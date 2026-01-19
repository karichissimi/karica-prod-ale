import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PartnerOnboardingData } from '@/hooks/usePartnerOnboarding';
import { Upload, FileText, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PartnerDocumentsStepProps {
  formData: PartnerOnboardingData;
  updateFormData: (data: Partial<PartnerOnboardingData>) => void;
  partnerId: string | null;
}

export function PartnerDocumentsStep({ formData, updateFormData, partnerId }: PartnerDocumentsStepProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !partnerId) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Formato non supportato',
        description: 'Carica un file PDF o un\'immagine (JPG, PNG, WEBP)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File troppo grande',
        description: 'La dimensione massima è 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${partnerId}/business-doc-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('partner-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        // If bucket doesn't exist, show a friendly message
        if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
          toast({
            title: 'Upload non disponibile',
            description: 'Il sistema di upload documenti non è ancora configurato. Puoi procedere senza documento.',
          });
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('partner-documents')
        .getPublicUrl(fileName);

      updateFormData({ businessDocumentUrl: publicUrl });

      toast({
        title: 'Documento caricato',
        description: 'Il documento è stato caricato con successo',
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il documento',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          {formData.businessDocumentUrl ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <Upload className="h-6 w-6 text-primary" />
          )}
        </div>
        
        <h3 className="text-lg font-medium mb-2">Documento Aziendale</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Carica la visura camerale o un documento equivalente (opzionale)
        </p>

        {formData.businessDocumentUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Documento caricato</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFormData({ businessDocumentUrl: null })}
            >
              Rimuovi documento
            </Button>
          </div>
        ) : (
          <div>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="business-doc"
            />
            <Label 
              htmlFor="business-doc" 
              className={`cursor-pointer inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${uploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Caricamento...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Seleziona file
                </>
              )}
            </Label>
          </div>
        )}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
        <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Documenti accettati:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Visura camerale (non più vecchia di 6 mesi)</li>
            <li>Certificato di iscrizione alla Camera di Commercio</li>
            <li>Documento di riconoscimento del legale rappresentante</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
