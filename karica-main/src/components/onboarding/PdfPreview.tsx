import { Card, CardContent } from '@/components/ui/card';
import { FileText, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface PdfPreviewProps {
  filePath: string;
  file?: File | null;
}

export const PdfPreview = ({ filePath, file }: PdfPreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadPdf = async () => {
      // If we have the original file, use it directly
      if (file) {
        const url = URL.createObjectURL(file);
        setPdfUrl(url);
        setLoading(false);
        return;
      }
      
      // Otherwise, load from storage
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
          setPdfUrl(data.signedUrl);
        }
      } catch (error) {
        console.error('Error loading PDF:', error);
      } finally {
        setLoading(false);
      }
    };

    if (filePath || file) {
      loadPdf();
    } else {
      setLoading(false);
    }

    return () => {
      // Cleanup object URL if created from file
      if (file && pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
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

  if (!pdfUrl) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <FileText className="h-12 w-12 mb-2" />
            <p className="text-sm">Documento PDF caricato</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mobile: show a preview card with link to open PDF
  if (isMobile) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 bg-muted rounded-lg flex items-center justify-center border border-border">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm text-foreground">Bolletta PDF</p>
              <p className="text-xs text-muted-foreground mt-1">Documento caricato correttamente</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => window.open(pdfUrl, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Apri PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Desktop: show iframe
  return (
    <Card>
      <CardContent className="p-0">
        <iframe
          src={`${pdfUrl}#toolbar=0`}
          className="w-full h-64 rounded-lg"
          title="PDF Preview"
        />
      </CardContent>
    </Card>
  );
};
