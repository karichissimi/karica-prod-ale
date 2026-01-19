import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PartnerOnboardingData } from '@/hooks/usePartnerOnboarding';
import { Building2, Phone, FileText, Hash } from 'lucide-react';

interface PartnerProfileStepProps {
  formData: PartnerOnboardingData;
  updateFormData: (data: Partial<PartnerOnboardingData>) => void;
}

export function PartnerProfileStep({ formData, updateFormData }: PartnerProfileStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="companyName" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Nome Azienda *
        </Label>
        <Input
          id="companyName"
          placeholder="Es. Eco Solutions SRL"
          value={formData.companyName}
          onChange={(e) => updateFormData({ companyName: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="vatNumber" className="flex items-center gap-2">
          <Hash className="h-4 w-4" />
          Partita IVA *
        </Label>
        <Input
          id="vatNumber"
          placeholder="IT12345678901"
          value={formData.vatNumber}
          onChange={(e) => updateFormData({ vatNumber: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Inserisci la Partita IVA con il prefisso nazionale (es. IT)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Telefono
        </Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+39 123 456 7890"
          value={formData.phone}
          onChange={(e) => updateFormData({ phone: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Descrizione Servizi
        </Label>
        <Textarea
          id="description"
          placeholder="Descrivi brevemente i servizi offerti dalla tua azienda..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={4}
        />
      </div>
    </div>
  );
}
