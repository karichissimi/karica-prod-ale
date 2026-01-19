import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CEROnboardingData } from '@/hooks/usePartnerOnboardingCER';

interface CERDocumentsStepProps {
  formData: CEROnboardingData;
  updateFormData: (data: Partial<CEROnboardingData>) => void;
  partnerId: string | null;
}

export function CERDocumentsStep({ formData, updateFormData, partnerId }: CERDocumentsStepProps) {
  const { toast } = useToast();
  const [uploadingStatute, setUploadingStatute] = useState(false);
  const [uploadingAppointment, setUploadingAppointment] = useState(false);

  const handleUpload = async (file: File, type: 'statute' | 'appointment') => {
    if (!partnerId) return;
    
    const setUploading = type === 'statute' ? setUploadingStatute : setUploadingAppointment;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${partnerId}/${type}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('work-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('work-documents')
        .getPublicUrl(filePath);

      if (type === 'statute') {
        updateFormData({ statuteDocumentUrl: publicUrl });
      } else {
        updateFormData({ appointmentDocumentUrl: publicUrl });
      }

      toast({ title: 'Documento caricato', description: 'Il documento è stato caricato con successo' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Errore', description: 'Impossibile caricare il documento', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Statuto della CER</Label>
        {formData.statuteDocumentUrl ? (
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border">
            <FileText className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm truncate">Statuto caricato</span>
            <Button variant="ghost" size="sm" onClick={() => updateFormData({ statuteDocumentUrl: '' })}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
            {uploadingStatute ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <span className="mt-2 text-sm text-muted-foreground">Carica lo statuto (PDF)</span>
            <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'statute')} disabled={uploadingStatute} />
          </label>
        )}
      </div>

      <div className="space-y-3">
        <Label>Verbale di Nomina</Label>
        {formData.appointmentDocumentUrl ? (
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border">
            <FileText className="h-5 w-5 text-primary" />
            <span className="flex-1 text-sm truncate">Verbale caricato</span>
            <Button variant="ghost" size="sm" onClick={() => updateFormData({ appointmentDocumentUrl: '' })}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
            {uploadingAppointment ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
            <span className="mt-2 text-sm text-muted-foreground">Carica il verbale di nomina (PDF)</span>
            <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0], 'appointment')} disabled={uploadingAppointment} />
          </label>
        )}
      </div>
    </div>
  );
}
