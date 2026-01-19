import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CEROnboardingData } from '@/hooks/usePartnerOnboardingCER';

interface CERTermsStepProps {
  formData: CEROnboardingData;
  updateFormData: (data: Partial<CEROnboardingData>) => void;
}

export function CERTermsStep({ formData, updateFormData }: CERTermsStepProps) {
  return (
    <div className="space-y-4">
      <ScrollArea className="h-64 rounded-md border p-4">
        <div className="space-y-4 text-sm">
          <h4 className="font-semibold">Termini e Condizioni per Presidenti CER</h4>
          <p>In qualità di Presidente/Referente della Comunità Energetica Rinnovabile, accetti di:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Gestire la CER in conformità con la normativa vigente</li>
            <li>Garantire la correttezza dei dati inseriti sulla piattaforma</li>
            <li>Comunicare tempestivamente variazioni dei membri della comunità</li>
            <li>Rispettare le policy di utilizzo della piattaforma Karica</li>
            <li>Mantenere aggiornata la documentazione richiesta</li>
          </ul>
          <h4 className="font-semibold mt-4">Responsabilità</h4>
          <p>Il Presidente si assume la responsabilità della veridicità delle informazioni fornite e della corretta gestione della CER secondo le normative GSE.</p>
        </div>
      </ScrollArea>

      <div className="flex items-center space-x-2 pt-4">
        <Checkbox
          id="terms"
          checked={formData.termsAccepted}
          onCheckedChange={(checked) => updateFormData({ termsAccepted: checked === true })}
        />
        <Label htmlFor="terms" className="text-sm">
          Accetto i termini e le condizioni per la gestione della CER
        </Label>
      </div>
    </div>
  );
}
