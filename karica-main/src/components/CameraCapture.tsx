import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, X, RefreshCw, Check, Loader2, Crop } from "lucide-react";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface CameraCaptureProps {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
  skipCrop?: boolean; // Skip cropping step entirely
  useBackCamera?: boolean; // Use rear camera instead of front
}

type Step = 'camera' | 'crop' | 'preview';

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, mediaWidth, mediaHeight),
    mediaWidth,
    mediaHeight
  );
}

export const CameraCapture = ({ open, onClose, onCapture, skipCrop = false, useBackCamera = false }: CameraCaptureProps) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('camera');
  const [crop, setCrop] = useState<CropType>();
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraReady(false);
  }, [stream]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);
    setCameraReady(false);
    
    try {
      // Stop any existing stream first
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: useBackCamera ? 'environment' : 'user',
          width: { ideal: useBackCamera ? 1280 : 640 },
          height: { ideal: useBackCamera ? 960 : 480 }
        } 
      });
      
      setStream(mediaStream);
      setIsLoading(false);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Impossibile accedere alla fotocamera. Verifica i permessi del browser.');
      setIsLoading(false);
    }
  };

  // Set video source when stream changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Handle video ready
  const handleVideoCanPlay = () => {
    setCameraReady(true);
  };

  // Start camera when dialog opens
  useEffect(() => {
    if (open && step === 'camera' && !stream && !isLoading) {
      startCamera();
    }
  }, [open, step]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      stopCamera();
      setCapturedImage(null);
      setCroppedImage(null);
      setError(null);
      setStep('camera');
    }
  }, [open, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const width = video.videoWidth || video.clientWidth || 640;
    const height = video.videoHeight || video.clientHeight || 480;
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Only mirror for front camera (selfie)
    if (!useBackCamera) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);
    
    const imageUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedImage(imageUrl);
    stopCamera();
    
    // Skip crop if requested
    if (skipCrop) {
      setCroppedImage(imageUrl);
      setStep('preview');
    } else {
      setStep('crop');
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const getCroppedImg = useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      if (!imgRef.current || !crop) {
        resolve(capturedImage || '');
        return;
      }

      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const cropX = (crop.x / 100) * image.width * scaleX;
      const cropY = (crop.y / 100) * image.height * scaleY;
      const cropWidth = (crop.width / 100) * image.width * scaleX;
      const cropHeight = (crop.height / 100) * image.height * scaleY;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(capturedImage || '');
        return;
      }

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      resolve(canvas.toDataURL('image/jpeg', 0.95));
    });
  }, [crop, capturedImage]);

  const handleCropConfirm = async () => {
    const cropped = await getCroppedImg();
    setCroppedImage(cropped);
    setStep('preview');
  };

  const handleSkipCrop = () => {
    setCroppedImage(capturedImage);
    setStep('preview');
  };

  const handleConfirm = async () => {
    const imageToSave = croppedImage || capturedImage;
    if (!imageToSave) return;

    setIsSaving(true);
    try {
      const response = await fetch(imageToSave);
      const blob = await response.blob();
      await onCapture(blob);
      onClose();
    } catch (err) {
      console.error('Error confirming capture:', err);
      setError('Errore nel salvataggio della foto.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setCroppedImage(null);
    setError(null);
    setStep('camera');
  };

  const handleBackToCrop = () => {
    setCroppedImage(null);
    setStep('crop');
  };

  const getTitle = () => {
    switch (step) {
      case 'camera': return 'Scatta una foto';
      case 'crop': return 'Ritaglia immagine';
      case 'preview': return 'Anteprima foto';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => !newOpen && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {step === 'camera' && 'Posizionati davanti alla fotocamera'}
            {step === 'crop' && 'Regola il ritaglio dell\'immagine'}
            {step === 'preview' && 'Verifica la foto prima di confermare'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
              {error}
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => { setError(null); startCamera(); }} 
                className="ml-2 text-destructive"
              >
                Riprova
              </Button>
            </div>
          )}

          {step === 'camera' && (
            <>
              <div className={`relative ${useBackCamera ? 'aspect-[4/3]' : 'aspect-square'} bg-muted rounded-lg overflow-hidden flex items-center justify-center`}>
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="text-sm">Attivazione fotocamera...</span>
                  </div>
                ) : stream ? (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onCanPlay={handleVideoCanPlay}
                      className="w-full h-full object-cover"
                      style={{ transform: useBackCamera ? 'none' : 'scaleX(-1)' }}
                    />
                    {!cameraReady && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Camera className="h-12 w-12 opacity-50" />
                    <span className="text-sm">Fotocamera non attiva</span>
                    <Button size="sm" variant="outline" onClick={startCamera}>
                      Attiva Fotocamera
                    </Button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleCapture} 
                  className="flex-1" 
                  disabled={!cameraReady}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {cameraReady ? 'Scatta Foto' : 'Preparazione...'}
                </Button>
                <Button onClick={onClose} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Annulla
                </Button>
              </div>
            </>
          )}

          {step === 'crop' && capturedImage && (
            <>
              <div className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center p-2">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    src={capturedImage}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-h-[400px] w-auto"
                  />
                </ReactCrop>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Trascina per riposizionare, ridimensiona gli angoli per regolare
              </p>
              <div className="flex gap-2">
                <Button onClick={handleCropConfirm} className="flex-1">
                  <Crop className="h-4 w-4 mr-2" />
                  Applica Ritaglio
                </Button>
                <Button onClick={handleSkipCrop} variant="outline">
                  Salta
                </Button>
                <Button onClick={handleRetake} variant="outline">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}

          {step === 'preview' && (croppedImage || capturedImage) && (
            <>
              <div className="relative aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <img 
                  src={croppedImage || capturedImage || ''} 
                  alt="Preview" 
                  className="w-full h-full object-cover rounded-full" 
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleConfirm} 
                  className="flex-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Conferma
                </Button>
                <Button onClick={handleBackToCrop} variant="outline" disabled={isSaving}>
                  <Crop className="h-4 w-4 mr-2" />
                  Modifica
                </Button>
                <Button onClick={handleRetake} variant="outline" disabled={isSaving}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
