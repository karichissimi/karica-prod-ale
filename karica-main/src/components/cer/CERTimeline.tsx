import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

interface CERTimelineProps {
  onComplete: () => Promise<void>;
  loading: boolean;
}

export const CERTimeline = ({ onComplete, loading }: CERTimelineProps) => {
  const steps = [
    {
      title: "Domanda ricevuta",
      description: "La tua richiesta di adesione è stata registrata",
      status: "completed",
      date: new Date().toLocaleDateString('it-IT'),
    },
    {
      title: "Verifica documenti",
      description: "Verifica dell'identità e dei consensi in corso",
      status: "in-progress",
      eta: "1-2 giorni lavorativi",
    },
    {
      title: "Configurazione tecnica",
      description: "Attivazione del tuo POD nella comunità energetica",
      status: "pending",
      eta: "3-5 giorni lavorativi",
    },
    {
      title: "Attivazione completata",
      description: "Inizio condivisione energia e calcolo incentivi",
      status: "pending",
      eta: "7-10 giorni lavorativi",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Stato Attivazione</h2>
        <p className="text-muted-foreground text-sm">
          La tua adesione è in elaborazione. Riceverai notifiche ad ogni avanzamento.
        </p>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`p-1.5 rounded-full ${
                    step.status === 'completed'
                      ? 'bg-primary text-primary-foreground'
                      : step.status === 'in-progress'
                      ? 'bg-secondary text-secondary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {step.status === 'in-progress' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {step.status === 'pending' && <Clock className="h-3.5 w-3.5" />}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-10 mt-1.5 ${
                      step.status === 'completed' ? 'bg-primary' : 'bg-border'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 pb-4">
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                {step.date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Completato il {step.date}
                  </p>
                )}
                {step.eta && step.status !== 'completed' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Tempo stimato: {step.eta}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 bg-muted/50">
        <h4 className="font-semibold text-sm mb-2">Cosa succede ora?</h4>
        <ul className="space-y-1.5 text-xs text-muted-foreground">
          <li>• Riceverai una email di conferma con i dettagli dell'adesione</li>
          <li>• Il team tecnico procederà con la configurazione del tuo POD</li>
          <li>• Una volta attivato, potrai monitorare i tuoi benefici in tempo reale</li>
          <li>• Gli incentivi saranno calcolati mensilmente e visibili nel wallet</li>
        </ul>
      </Card>

      <Button 
        onClick={onComplete} 
        disabled={loading}
        className="w-full h-10"
      >
        {loading ? 'Finalizzazione...' : 'Completa Adesione'}
      </Button>
    </div>
  );
};
