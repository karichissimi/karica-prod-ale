import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MarketplaceOnboardingData } from '@/hooks/usePartnerOnboardingMarketplace';

interface MarketplaceDocsStepProps {
  formData: MarketplaceOnboardingData;
  updateFormData: (data: Partial<MarketplaceOnboardingData>) => void;
  partnerId: string | null;
}

export function MarketplaceDocsStep({ formData, updateFormData, partnerId }: MarketplaceDocsStepProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!partnerId) return;
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${partnerId}/fiscal-${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('work-documents').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('work-documents').getPublicUrl(filePath);
      updateFormData({ fiscalDocumentsUrl: publicUrl });
      toast({ title: 'Documento caricato' });
    } catch (error) {
      toast({ title: 'Errore', description: 'Upload fallito', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Label>Documenti Fiscali (Visura Camerale)</Label>
      {formData.fiscalDocumentsUrl ? (
        <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border">
          <FileText className="h-5 w-5 text-primary" />
          <span className="flex-1 text-sm">Documento caricato</span>
          <Button variant="ghost" size="sm" onClick={() => updateFormData({ fiscalDocumentsUrl: '' })}><X className="h-4 w-4" /></Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
          {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Upload className="h-8 w-8 text-muted-foreground" />}
          <span className="mt-2 text-sm text-muted-foreground">Carica documento (PDF)</span>
          <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} />
        </label>
      )}
    </div>
  );
}
