import { Card, CardContent } from '@/components/ui/card';
import { FileText, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface BillPreviewProps {
  filePath: string;
  file?: File | null;
}

// Detect file type from MIME type or file extension
const getFileType = (file?: File | null, filePath?: string): 'image' | 'pdf' | 'unknown' => {
  // Check MIME type first (most reliable)
  if (file?.type) {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf') return 'pdf';
  }
  
  // Fallback to extension check
  const path = file?.name || filePath || '';
  const ext = path.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(ext || '')) return 'image';
  if (ext === 'pdf') return 'pdf';
  
  return 'unknown';
};

export const BillPreview = ({ filePath, file }: BillPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown');

  useEffect(() => {
    const loadPreview = async () => {
      const type = getFileType(file, filePath);
      setFileType(type);

      // If we have the original file, use it directly
      if (file) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setLoading(false);
        return;
      }
      
      // Otherwise, load from storage
      if (filePath) {
        try {
          const { data, error } = await supabase.storage
            .from('bills')
            .createSignedUrl(filePath, 3600); // 1 hour expiry

          if (error) {
            console.error('Storage error:', error);
            setLoading(false);
            return;
          }

          if (data?.signedUrl) {
            setPreviewUrl(data.signedUrl);
          }
        } catch (error) {
          console.error('Error loading file:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    loadPreview();

    return () => {
      // Cleanup object URL if created from file
      if (file && previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [filePath, file]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!previewUrl) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <FileText className="h-12 w-12 mb-2" />
            <p className="text-sm">Documento caricato</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Image preview - show actual thumbnail
  if (fileType === 'image') {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-20 h-24 bg-muted rounded-lg flex items-center justify-center border border-border overflow-hidden flex-shrink-0">
              <img 
                src={previewUrl} 
                alt="Bolletta" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="font-medium text-sm text-foreground truncate">Bolletta Immagine</p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Documento caricato correttamente</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(previewUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Apri Immagine
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // PDF preview - card with icon and button (works reliably everywhere)
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-20 bg-muted rounded-lg flex items-center justify-center border border-border flex-shrink-0">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">Bolletta PDF</p>
            <p className="text-xs text-muted-foreground mt-1">Documento caricato correttamente</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Apri PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};