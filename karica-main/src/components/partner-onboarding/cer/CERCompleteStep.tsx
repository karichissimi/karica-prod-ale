import { CheckCircle2, AlertCircle } from 'lucide-react';
import { CEROnboardingData } from '@/hooks/usePartnerOnboardingCER';

interface CERCompleteStepProps {
  formData: CEROnboardingData;
}

export function CERCompleteStep({ formData }: CERCompleteStepProps) {
  const isComplete = formData.cerName && formData.termsAccepted;

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${isComplete ? 'bg-primary/10' : 'bg-destructive/10'}`}>
        {isComplete ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <p className="font-medium">Tutto pronto per completare l'onboarding!</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="font-medium">Completa tutti i campi obbligatori</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Riepilogo Dati CER</h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Nome CER</span>
            <span className="font-medium">{formData.cerName || '-'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Codice Fiscale</span>
            <span>{formData.cerFiscalCode || '-'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Membri</span>
            <span>{formData.memberCount || '-'}</span>
          </div>
          <div className="flex justify-between py-2 border-b">
            <span className="text-muted-foreground">Statuto</span>
            <span>{formData.statuteDocumentUrl ? '✓ Caricato' : 'Non caricato'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Termini accettati</span>
            <span>{formData.termsAccepted ? '✓ Sì' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
