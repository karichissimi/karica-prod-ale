import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CEROnboardingData } from '@/hooks/usePartnerOnboardingCER';

interface CERProfileStepProps {
  formData: CEROnboardingData;
  updateFormData: (data: Partial<CEROnboardingData>) => void;
}

export function CERProfileStep({ formData, updateFormData }: CERProfileStepProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cer-name">Nome della CER *</Label>
        <Input
          id="cer-name"
          placeholder="Es. CER Energia Verde Milano"
          value={formData.cerName}
          onChange={(e) => updateFormData({ cerName: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cer-fiscal-code">Codice Fiscale CER</Label>
        <Input
          id="cer-fiscal-code"
          placeholder="Es. 12345678901"
          value={formData.cerFiscalCode}
          onChange={(e) => updateFormData({ cerFiscalCode: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cer-address">Indirizzo Sede Legale</Label>
        <Input
          id="cer-address"
          placeholder="Via Roma 1, 20100 Milano"
          value={formData.cerAddress}
          onChange={(e) => updateFormData({ cerAddress: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="member-count">Numero Membri Attuali</Label>
        <Input
          id="member-count"
          type="number"
          placeholder="Es. 50"
          value={formData.memberCount ?? ''}
          onChange={(e) => updateFormData({ memberCount: e.target.value ? parseInt(e.target.value) : null })}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Il tuo ruolo nella CER</Label>
        <Select value={formData.role} onValueChange={(value) => updateFormData({ role: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Seleziona ruolo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="president">Presidente</SelectItem>
            <SelectItem value="secretary">Segretario</SelectItem>
            <SelectItem value="treasurer">Tesoriere</SelectItem>
            <SelectItem value="board_member">Membro del Consiglio</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
