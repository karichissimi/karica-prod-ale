import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Camera, FileText, Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CameraCapture } from '@/components/CameraCapture';

interface BillUploadProps {
  onUpload: (file: File) => Promise<void>;
  onSkip: () => void;
  loading: boolean;
}

export const BillUpload = ({ onUpload, onSkip, loading }: BillUploadProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('File selected:', file.name, file.type, file.size);
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    console.log('Validating file:', file.name, file.type);
    
    // Validate file type - be more permissive with PDF detection
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type);
    
    if (!isPdf && !isImage) {
      toast({
        title: 'Formato non valido',
        description: 'Carica un file JPG, PNG o PDF',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File troppo grande',
        description: 'Il file deve essere inferiore a 10MB',
        variant: 'destructive',
      });
      return;
    }

    console.log('File validated successfully, setting selectedFile');
    setSelectedFile(file);
    
    toast({
      title: 'File caricato',
      description: `${file.name} è pronto per l'analisi`,
    });
  };

  const handleCameraCapture = (blob: Blob) => {
    const file = new File([blob], `bill_${Date.now()}.jpg`, { type: 'image/jpeg' });
    setSelectedFile(file);
    setCameraOpen(false);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.log('No file selected');
      return;
    }
    
    console.log('Handling upload for:', selectedFile.name, selectedFile.type);
    
    // Try AI analysis for both images and PDFs
    await onUpload(selectedFile);
  };

  return (
    <>
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Carica la tua bolletta</h2>
          <p className="text-muted-foreground">
            Carica una foto o il PDF della tua ultima bolletta energetica per iniziare
          </p>
        </div>

        {!selectedFile ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer bg-card">
              <CardContent className="p-6">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-3 text-center"
                  disabled={loading}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Carica file</p>
                    <p className="text-sm text-muted-foreground">PDF, JPG o PNG</p>
                  </div>
                </button>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-border hover:border-primary transition-colors cursor-pointer bg-card">
              <CardContent className="p-6">
                <button
                  onClick={() => setCameraOpen(true)}
                  className="w-full flex flex-col items-center gap-3 text-center"
                  disabled={loading}
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Scatta foto</p>
                    <p className="text-sm text-muted-foreground">Usa la fotocamera</p>
                  </div>
                </button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-2 border-primary bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  disabled={loading}
                >
                  Cambia
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisi in corso...
              </>
            ) : (
              'Analizza bolletta'
            )}
          </Button>

          <Button
            onClick={onSkip}
            disabled={loading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <Edit className="mr-2 h-4 w-4" />
            Inserisci dati manualmente
          </Button>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 space-y-1 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            💡 <strong className="text-foreground">Suggerimento:</strong> Le foto vengono analizzate automaticamente, i PDF richiedono inserimento manuale
          </p>
          <p className="text-xs text-center text-muted-foreground">
            I tuoi dati sono al sicuro e vengono utilizzati solo per migliorare il servizio
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
};