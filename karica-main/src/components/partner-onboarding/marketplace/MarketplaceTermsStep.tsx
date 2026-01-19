import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MarketplaceOnboardingData } from '@/hooks/usePartnerOnboardingMarketplace';

interface MarketplaceTermsStepProps {
  formData: MarketplaceOnboardingData;
  updateFormData: (data: Partial<MarketplaceOnboardingData>) => void;
}

export function MarketplaceTermsStep({ formData, updateFormData }: MarketplaceTermsStepProps) {
  return (
    <div className="space-y-4">
      <ScrollArea className="h-64 rounded-md border p-4">
        <div className="space-y-4 text-sm">
          <h4 className="font-semibold">Termini del Marketplace Karica</h4>
          <p>Come venditore nel marketplace Karica, accetti:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Commissione del 10% su ogni vendita</li>
            <li>Rispettare le policy di qualità dei prodotti</li>
            <li>Garantire spedizioni nei tempi dichiarati</li>
            <li>Gestire resi secondo le normative vigenti</li>
          </ul>
        </div>
      </ScrollArea>
      <div className="flex items-center space-x-2 pt-4">
        <Checkbox id="terms" checked={formData.termsAccepted} onCheckedChange={(checked) => updateFormData({ termsAccepted: checked === true })} />
        <Label htmlFor="terms" className="text-sm">Accetto i termini del marketplace</Label>
      </div>
    </div>
  );
}
