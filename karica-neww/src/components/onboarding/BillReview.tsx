import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { BillData, useOnboarding } from '@/hooks/useOnboarding';
import { PdfPreview } from './PdfPreview';

interface BillReviewProps {
  billData: BillData;
  onUpdate: (data: Partial<BillData>) => void;
  onNext: () => void;
  filePath?: string;
}

export const BillReview = ({ billData, onUpdate, onNext, filePath }: BillReviewProps) => {
  const { billType } = useOnboarding();
  const isValid = billData.pod && billData.supplier && billData.annualConsumption > 0;
  const isGas = billType === 'GAS';

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Verifica i dati</h2>
        <p className="text-muted-foreground">
          Controlla che le informazioni estratte siano corrette. Puoi modificarle se necessario.
        </p>
      </div>

      {filePath && filePath.endsWith('.pdf') && (
        <div className="space-y-2">
          <Label>Anteprima Bolletta</Label>
          <PdfPreview filePath={filePath} />
        </div>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pod">
              {isGas ? 'PDR (Punto di Riconsegna)' : 'POD (Punto di Prelievo)'} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pod"
              value={billData.pod}
              onChange={(e) => onUpdate({ pod: e.target.value })}
              placeholder="IT001E12345678"
              className={!billData.pod ? 'border-destructive' : ''}
            />
            {!billData.pod && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Campo obbligatorio
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {isGas ? 'Codice di 14 cifre numeriche' : 'Codice di 14 caratteri che inizia con IT'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">
              Fornitore Energetico <span className="text-destructive">*</span>
            </Label>
            <Input
              id="supplier"
              value={billData.supplier}
              onChange={(e) => onUpdate({ supplier: e.target.value })}
              placeholder="Es. Enel Energia, A2A, Edison..."
              className={!billData.supplier ? 'border-destructive' : ''}
            />
            {!billData.supplier && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Campo obbligatorio
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="consumption">
              Consumo Annuo ({isGas ? 'Smc' : 'kWh'}) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="consumption"
              type="number"
              value={billData.annualConsumption || ''}
              onChange={(e) => onUpdate({ annualConsumption: parseFloat(e.target.value) || 0 })}
              placeholder="Es. 3000"
              min="0"
              className={billData.annualConsumption <= 0 ? 'border-destructive' : ''}
            />
            {billData.annualConsumption <= 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Inserisci un valore maggiore di 0
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Consumo negli ultimi 12 mesi
            </p>
          </div>
        </CardContent>
      </Card>

      {isValid && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">
              Tutti i dati obbligatori sono stati inseriti correttamente
            </p>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={onNext}
        disabled={!isValid}
        className="w-full"
        size="lg"
      >
        Continua
      </Button>
    </div>
  );
};