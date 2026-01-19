import { CheckCircle2, AlertCircle } from 'lucide-react';
import { MarketplaceOnboardingData } from '@/hooks/usePartnerOnboardingMarketplace';

interface MarketplaceCompleteStepProps {
  formData: MarketplaceOnboardingData;
}

export function MarketplaceCompleteStep({ formData }: MarketplaceCompleteStepProps) {
  const isComplete = formData.storeName && formData.termsAccepted;

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-lg ${isComplete ? 'bg-primary/10' : 'bg-destructive/10'}`}>
        {isComplete ? (
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <p className="font-medium">Pronto per completare!</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="font-medium">Completa i campi obbligatori</p>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <h4 className="font-medium">Riepilogo Store</h4>
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Nome Store</span><span className="font-medium">{formData.storeName || '-'}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-muted-foreground">Categorie</span><span>{formData.productCategories.join(', ') || '-'}</span></div>
          <div className="flex justify-between py-2"><span className="text-muted-foreground">Termini</span><span>{formData.termsAccepted ? '✓ Accettati' : 'Non accettati'}</span></div>
        </div>
      </div>
    </div>
  );
}
