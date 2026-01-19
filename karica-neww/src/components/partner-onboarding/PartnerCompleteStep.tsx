import { PartnerOnboardingData } from '@/hooks/usePartnerOnboarding';
import { Building2, Hash, Phone, FileText, CheckCircle2, XCircle } from 'lucide-react';

interface PartnerCompleteStepProps {
  formData: PartnerOnboardingData;
}

export function PartnerCompleteStep({ formData }: PartnerCompleteStepProps) {
  const items = [
    {
      icon: Building2,
      label: 'Nome Azienda',
      value: formData.companyName,
      required: true,
    },
    {
      icon: Hash,
      label: 'Partita IVA',
      value: formData.vatNumber,
      required: true,
    },
    {
      icon: Phone,
      label: 'Telefono',
      value: formData.phone,
      required: false,
    },
    {
      icon: FileText,
      label: 'Descrizione',
      value: formData.description ? formData.description.substring(0, 50) + (formData.description.length > 50 ? '...' : '') : '',
      required: false,
    },
  ];

  const hasDocument = !!formData.businessDocumentUrl;
  const hasAcceptedTerms = formData.termsAccepted;

  const allRequiredComplete = 
    formData.companyName.trim() !== '' && 
    formData.vatNumber.trim() !== '' && 
    formData.termsAccepted;

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${allRequiredComplete ? 'bg-green-500/10 border border-green-500/20' : 'bg-yellow-500/10 border border-yellow-500/20'}`}>
        <div className="flex items-center gap-3">
          {allRequiredComplete ? (
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          ) : (
            <XCircle className="h-6 w-6 text-yellow-600" />
          )}
          <div>
            <h3 className="font-semibold">
              {allRequiredComplete ? 'Tutto pronto!' : 'Completa i campi richiesti'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {allRequiredComplete 
                ? 'Puoi completare l\'onboarding e accedere al CRM'
                : 'Torna indietro per completare i campi obbligatori'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Riepilogo dati inseriti</h4>
        
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isComplete = item.value.trim() !== '';
            const showWarning = item.required && !isComplete;

            return (
              <div
                key={item.label}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  showWarning ? 'bg-destructive/10' : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${showWarning ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.required && <span className="text-xs text-destructive">*</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${showWarning ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {isComplete ? item.value : 'Non compilato'}
                  </span>
                  {isComplete ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : showWarning ? (
                    <XCircle className="h-4 w-4 text-destructive" />
                  ) : null}
                </div>
              </div>
            );
          })}

          {/* Document status */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Documento aziendale</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {hasDocument ? 'Caricato' : 'Non caricato'}
              </span>
              {hasDocument ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : null}
            </div>
          </div>

          {/* Terms status */}
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            !hasAcceptedTerms ? 'bg-destructive/10' : 'bg-muted/50'
          }`}>
            <div className="flex items-center gap-3">
              <CheckCircle2 className={`h-4 w-4 ${!hasAcceptedTerms ? 'text-destructive' : 'text-muted-foreground'}`} />
              <span className="text-sm font-medium">Termini B2B</span>
              <span className="text-xs text-destructive">*</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${!hasAcceptedTerms ? 'text-destructive' : 'text-muted-foreground'}`}>
                {hasAcceptedTerms ? 'Accettati' : 'Non accettati'}
              </span>
              {hasAcceptedTerms ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
