import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CERStrongIDProps {
  onComplete: (method: string) => Promise<void>;
  onNext: () => void;
  loading: boolean;
  strongIdCompleted: boolean;
}

export const CERStrongID = ({ onComplete, onNext, loading, strongIdCompleted }: CERStrongIDProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const handleVerify = async (method: string) => {
    setSelectedMethod(method);
    setVerifying(true);
    
    // Simulate verification process
    setTimeout(async () => {
      await onComplete(method);
      setVerifying(false);
      setTimeout(() => {
        onNext();
      }, 1500);
    }, 2000);
  };

  if (strongIdCompleted) {
    return (
      <div className="space-y-4">
        <Card className="p-5 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Identificazione Completata</h3>
              <p className="text-xs text-muted-foreground">La tua identità è stata verificata con successo</p>
            </div>
          </div>
        </Card>
        <Button onClick={onNext} className="w-full h-10">
          Continua
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Identificazione Forte</h2>
        <p className="text-muted-foreground text-sm">
          Per motivi normativi, è necessaria un'identificazione forte tramite SPID o Firma Digitale
        </p>
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription className="text-xs">
          L'identificazione forte è obbligatoria per legge per l'adesione alle Comunità Energetiche Rinnovabili.
          I tuoi dati sono protetti e gestiti in sicurezza.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Card 
          className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
            selectedMethod === 'SPID' && verifying ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => !verifying && handleVerify('SPID')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">SPID</h3>
                <p className="text-xs text-muted-foreground">
                  Sistema Pubblico di Identità Digitale
                </p>
              </div>
            </div>
            {selectedMethod === 'SPID' && verifying && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            )}
          </div>
        </Card>

        <Card 
          className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
            selectedMethod === 'FirmaDigitale' && verifying ? 'border-primary bg-primary/5' : ''
          }`}
          onClick={() => !verifying && handleVerify('FirmaDigitale')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-secondary/10">
                <Shield className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Firma Digitale</h3>
                <p className="text-xs text-muted-foreground">
                  Certificato di firma digitale qualificata
                </p>
              </div>
            </div>
            {selectedMethod === 'FirmaDigitale' && verifying && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-secondary border-t-transparent"></div>
            )}
          </div>
        </Card>
      </div>

      {verifying && (
        <Card className="p-4 bg-muted/50">
          <p className="text-xs text-center text-muted-foreground">
            Verifica in corso... Verrai reindirizzato al provider di identità.
          </p>
        </Card>
      )}

      <Card className="p-3 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          <strong>Nota:</strong> In ambiente di test, la verifica avverrà in modo simulato. 
          In produzione, verrai reindirizzato al provider SPID o al sistema di firma digitale selezionato.
        </p>
      </Card>
    </div>
  );
};
