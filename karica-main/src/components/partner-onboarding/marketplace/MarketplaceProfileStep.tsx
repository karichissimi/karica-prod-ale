import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MarketplaceOnboardingData } from '@/hooks/usePartnerOnboardingMarketplace';

interface MarketplaceProfileStepProps {
  formData: MarketplaceOnboardingData;
  updateFormData: (data: Partial<MarketplaceOnboardingData>) => void;
}

export function MarketplaceProfileStep({ formData, updateFormData }: MarketplaceProfileStepProps) {
  const handleCategoriesChange = (value: string) => {
    const categories = value.split(',').map(c => c.trim()).filter(Boolean);
    updateFormData({ productCategories: categories });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="store-name">Nome Store *</Label>
        <Input id="store-name" placeholder="Es. EcoShop Italia" value={formData.storeName} onChange={(e) => updateFormData({ storeName: e.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="store-description">Descrizione Store</Label>
        <Textarea id="store-description" placeholder="Descrivi il tuo store..." value={formData.storeDescription} onChange={(e) => updateFormData({ storeDescription: e.target.value })} rows={3} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="categories">Categorie Prodotti</Label>
        <Input id="categories" placeholder="Pannelli solari, LED, Domotica" value={formData.productCategories.join(', ')} onChange={(e) => handleCategoriesChange(e.target.value)} />
        <p className="text-xs text-muted-foreground">Separa le categorie con virgole</p>
      </div>
    </div>
  );
}
