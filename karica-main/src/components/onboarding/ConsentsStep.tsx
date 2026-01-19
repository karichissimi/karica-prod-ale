import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Eye, Mail, AlertCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { ConsentsData } from '@/hooks/useOnboarding';

interface ConsentsStepProps {
  consents: ConsentsData;
  onUpdate: (data: Partial<ConsentsData>) => void;
  onNext: () => void;
  loading: boolean;
}

export const ConsentsStep = ({ consents, onUpdate, onNext, loading }: ConsentsStepProps) => {
  const [householdSize, setHouseholdSize] = useState<string>('');
  const [showHouseholdInfo, setShowHouseholdInfo] = useState(false);
  const requiredConsentsGiven = consents.service && consents.monitoring;

  const handleNext = () => {
    // Store household size in localStorage for now (can be moved to profile later)
    if (householdSize) {
      localStorage.setItem('karica_household_size', householdSize);
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Privacy e Consensi</h2>
        <p className="text-muted-foreground">
          Per utilizzare Karica abbiamo bisogno del tuo consenso per alcuni servizi
        </p>
      </div>

      {/* Household Size Section */}
      <Card className="border bg-card">
        <CardContent className="p-4">
          <button 
            onClick={() => setShowHouseholdInfo(!showHouseholdInfo)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground">Nucleo Familiare</p>
                <p className="text-xs text-muted-foreground">Per confronti più precisi</p>
              </div>
            </div>
            {showHouseholdInfo ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          
          {showHouseholdInfo && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <Label htmlFor="household-size" className="text-sm text-foreground">
                Quante persone vivono in casa?
              </Label>
              <Select value={householdSize} onValueChange={setHouseholdSize}>
                <SelectTrigger id="household-size" className="bg-background">
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 persona</SelectItem>
                  <SelectItem value="2">2 persone</SelectItem>
                  <SelectItem value="3">3 persone</SelectItem>
                  <SelectItem value="4">4 persone</SelectItem>
                  <SelectItem value="5">5+ persone</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Questo ci aiuta a confrontare i tuoi consumi con famiglie simili
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border-2 border-primary/20 bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <Checkbox
                  id="service-consent"
                  checked={consents.service}
                  onCheckedChange={(checked) => onUpdate({ service: checked as boolean })}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="service-consent"
                  className="flex items-center gap-2 font-semibold text-foreground cursor-pointer"
                >
                  <Shield className="h-5 w-5 text-primary" />
                  Utilizzo del Servizio <span className="text-destructive">*</span>
                </label>
                <p className="text-sm text-muted-foreground">
                  Acconsento al trattamento dei miei dati personali per l'erogazione del servizio Karica, 
                  inclusa la gestione del mio profilo energetico e delle funzionalità dell'app.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <Checkbox
                  id="monitoring-consent"
                  checked={consents.monitoring}
                  onCheckedChange={(checked) => onUpdate({ monitoring: checked as boolean })}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="monitoring-consent"
                  className="flex items-center gap-2 font-semibold text-foreground cursor-pointer"
                >
                  <Eye className="h-5 w-5 text-primary" />
                  Monitoraggio Consumi <span className="text-destructive">*</span>
                </label>
                <p className="text-sm text-muted-foreground">
                  Acconsento al monitoraggio e all'analisi dei miei consumi energetici per ricevere 
                  consigli personalizzati e interventi di ottimizzazione.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 bg-card">
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                <Checkbox
                  id="marketing-consent"
                  checked={consents.marketing}
                  onCheckedChange={(checked) => onUpdate({ marketing: checked as boolean })}
                />
              </div>
              <div className="flex-1 space-y-2">
                <label
                  htmlFor="marketing-consent"
                  className="flex items-center gap-2 font-semibold text-foreground cursor-pointer"
                >
                  <Mail className="h-5 w-5 text-primary" />
                  Comunicazioni Marketing
                </label>
                <p className="text-sm text-muted-foreground">
                  Acconsento a ricevere comunicazioni promozionali, newsletter e offerte personalizzate 
                  da Karica e dai partner selezionati.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!requiredConsentsGiven && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-foreground">
              I consensi contrassegnati con * sono obbligatori per utilizzare Karica
            </p>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleNext}
        disabled={!requiredConsentsGiven || loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Completamento in corso...' : 'Completa Registrazione'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Puoi modificare le tue preferenze in qualsiasi momento dalle impostazioni del profilo
      </p>
    </div>
  );
};