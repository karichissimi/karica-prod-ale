import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CERConsentsProps {
  consents: {
    dataSharing: boolean;
    termsConditions: boolean;
    cerRules: boolean;
  };
  onUpdate: (consents: any) => void;
  onNext: () => void;
  loading: boolean;
}

export const CERConsents = ({ consents, onUpdate, onNext, loading }: CERConsentsProps) => {
  const allRequiredConsentsGiven = 
    consents.dataSharing && 
    consents.termsConditions && 
    consents.cerRules;

  const handleNext = async () => {
    if (!allRequiredConsentsGiven) return;
    await onUpdate(consents);
    onNext();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Consensi e Termini</h2>
        <p className="text-muted-foreground text-sm">
          Per procedere con l'adesione alla CER è necessario fornire i seguenti consensi
        </p>
      </div>

      <Card className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="dataSharing"
            checked={consents.dataSharing}
            onCheckedChange={(checked) =>
              onUpdate({ ...consents, dataSharing: checked as boolean })
            }
          />
          <div className="flex-1">
            <Label 
              htmlFor="dataSharing" 
              className="text-sm font-medium cursor-pointer leading-tight"
            >
              Condivisione dati energetici <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Autorizzo la condivisione dei miei dati di consumo energetico con la CER 
              per il calcolo degli incentivi e la gestione della comunità energetica.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="termsConditions"
            checked={consents.termsConditions}
            onCheckedChange={(checked) =>
              onUpdate({ ...consents, termsConditions: checked as boolean })
            }
          />
          <div className="flex-1">
            <Label 
              htmlFor="termsConditions" 
              className="text-sm font-medium cursor-pointer leading-tight"
            >
              Termini e condizioni CER <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Dichiaro di aver letto e accettato i{' '}
              <a href="#" className="text-primary underline">termini e condizioni</a>{' '}
              della Comunità Energetica Rinnovabile.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="cerRules"
            checked={consents.cerRules}
            onCheckedChange={(checked) =>
              onUpdate({ ...consents, cerRules: checked as boolean })
            }
          />
          <div className="flex-1">
            <Label 
              htmlFor="cerRules" 
              className="text-sm font-medium cursor-pointer leading-tight"
            >
              Regolamento CER <span className="text-destructive">*</span>
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Accetto il{' '}
              <a href="#" className="text-primary underline">regolamento interno</a>{' '}
              della comunità e mi impegno a rispettarlo.
            </p>
          </div>
        </div>
      </Card>

      {!allRequiredConsentsGiven && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Tutti i consensi contrassegnati con * sono obbligatori per procedere con l'adesione alla CER.
          </AlertDescription>
        </Alert>
      )}

      <Card className="p-3 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          I tuoi dati saranno trattati nel rispetto del GDPR. Potrai modificare o revocare 
          i consensi in qualsiasi momento dalla sezione Profilo.
        </p>
      </Card>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleNext}
          disabled={!allRequiredConsentsGiven || loading}
          className="flex-1 h-10"
        >
          {loading ? 'Salvataggio...' : 'Continua'}
        </Button>
      </div>
    </div>
  );
};
