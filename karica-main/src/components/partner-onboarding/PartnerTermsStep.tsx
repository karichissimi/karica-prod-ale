import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PartnerOnboardingData } from '@/hooks/usePartnerOnboarding';
import { FileText, Shield, Scale, AlertTriangle } from 'lucide-react';

interface PartnerTermsStepProps {
  formData: PartnerOnboardingData;
  updateFormData: (data: Partial<PartnerOnboardingData>) => void;
}

export function PartnerTermsStep({ formData, updateFormData }: PartnerTermsStepProps) {
  return (
    <div className="space-y-6">
      <ScrollArea className="h-64 rounded-lg border p-4">
        <div className="space-y-6 pr-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4" />
              1. Oggetto del Contratto
            </h3>
            <p className="text-sm text-muted-foreground">
              Il presente accordo regola i rapporti tra Karica S.r.l. ("Karica") e il Partner 
              per l'erogazione di servizi di efficientamento energetico ai clienti finali 
              acquisiti tramite la piattaforma Karica.
            </p>
          </div>

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4" />
              2. Obblighi del Partner
            </h3>
            <p className="text-sm text-muted-foreground">
              Il Partner si impegna a:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
              <li>Rispondere alle richieste dei clienti entro 48 ore lavorative</li>
              <li>Fornire preventivi dettagliati e trasparenti</li>
              <li>Eseguire i lavori a regola d'arte secondo le normative vigenti</li>
              <li>Mantenere le certificazioni e abilitazioni professionali aggiornate</li>
              <li>Comunicare tempestivamente eventuali variazioni nei tempi o costi</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4" />
              3. Commissioni e Pagamenti
            </h3>
            <p className="text-sm text-muted-foreground">
              Per ogni lavoro concluso positivamente tramite la piattaforma, il Partner 
              riconoscerà a Karica una commissione pari al 5% del valore del contratto 
              stipulato con il cliente finale. Le commissioni saranno fatturate mensilmente 
              e dovranno essere saldate entro 30 giorni dalla data di fatturazione.
            </p>
          </div>

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4" />
              4. Responsabilità e Garanzie
            </h3>
            <p className="text-sm text-muted-foreground">
              Il Partner è l'unico responsabile della qualità dei lavori eseguiti e 
              si impegna a fornire le garanzie previste dalla legge. Karica non assume 
              alcuna responsabilità per danni derivanti dall'operato del Partner.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">5. Protezione dei Dati</h3>
            <p className="text-sm text-muted-foreground">
              Il Partner si impegna a trattare i dati personali dei clienti in conformità 
              al GDPR (Regolamento UE 2016/679) e alla normativa italiana in materia di 
              protezione dei dati personali.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">6. Durata e Recesso</h3>
            <p className="text-sm text-muted-foreground">
              Il presente accordo ha durata annuale e si rinnova tacitamente. Ciascuna 
              parte può recedere con un preavviso scritto di 30 giorni.
            </p>
          </div>
        </div>
      </ScrollArea>

      <div className="flex items-start space-x-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <Checkbox
          id="terms"
          checked={formData.termsAccepted}
          onCheckedChange={(checked) => updateFormData({ termsAccepted: checked === true })}
          className="mt-1"
        />
        <div className="grid gap-1.5 leading-none">
          <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
            Accetto i Termini e Condizioni di Partnership B2B *
          </Label>
          <p className="text-xs text-muted-foreground">
            Confermo di aver letto e compreso i termini del contratto di partnership e 
            di accettarli integralmente.
          </p>
        </div>
      </div>
    </div>
  );
}
