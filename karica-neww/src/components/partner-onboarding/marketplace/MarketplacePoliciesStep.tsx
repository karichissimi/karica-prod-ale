import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MarketplaceOnboardingData } from '@/hooks/usePartnerOnboardingMarketplace';

interface MarketplacePoliciesStepProps {
  formData: MarketplaceOnboardingData;
  updateFormData: (data: Partial<MarketplaceOnboardingData>) => void;
}

export function MarketplacePoliciesStep({ formData, updateFormData }: MarketplacePoliciesStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="shipping">Politica di Spedizione</Label>
        <Textarea id="shipping" placeholder="Descrivi tempi e modalità di spedizione..." value={formData.shippingPolicy} onChange={(e) => updateFormData({ shippingPolicy: e.target.value })} rows={4} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="return">Politica di Reso</Label>
        <Textarea id="return" placeholder="Descrivi le condizioni per i resi..." value={formData.returnPolicy} onChange={(e) => updateFormData({ returnPolicy: e.target.value })} rows={4} />
      </div>
    </div>
  );
}
