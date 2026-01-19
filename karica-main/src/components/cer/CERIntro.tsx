import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Leaf, TrendingDown, Award } from "lucide-react";

interface CERIntroProps {
  onStart: () => void;
  loading: boolean;
}

export const CERIntro = ({ onStart, loading }: CERIntroProps) => {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Unisciti alla Comunità Energetica Rinnovabile</h2>
        <p className="text-muted-foreground text-sm">
          Condividi energia rinnovabile con la tua zona e risparmia sulla bolletta
        </p>
      </div>

      <Card className="p-5 bg-primary">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-primary-foreground/20">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-primary-foreground">Come funziona?</h3>
        </div>
        <p className="text-primary-foreground/90 text-sm leading-relaxed">
          Le Comunità Energetiche Rinnovabili (CER) permettono a cittadini, imprese e enti locali di 
          produrre, condividere e consumare energia pulita. Più energia condividi, più risparmi!
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingDown className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risparmio medio</p>
              <p className="text-base font-bold">15-20%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Users className="h-4 w-4 text-secondary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Membri attivi</p>
              <p className="text-base font-bold">1.200+</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 border-accent/20 bg-accent/5">
        <h4 className="font-semibold text-sm mb-2.5 flex items-center gap-2">
          <Award className="h-4 w-4 text-accent" />
          Vantaggi dell'adesione
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            <span>Risparmio sulla bolletta energetica</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            <span>Incentivi statali sull'energia condivisa</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            <span>Contribuisci alla transizione ecologica</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-accent mt-0.5">•</span>
            <span>Monitoraggio in tempo reale dei tuoi benefici</span>
          </li>
        </ul>
      </Card>

      <Card className="p-4 bg-muted/50">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Nota:</strong> L'adesione alla CER richiede un'identificazione forte (SPID o firma digitale) 
          per conformità normativa. Non comporta cambio di fornitore energetico.
        </p>
      </Card>

      <Button 
        onClick={onStart} 
        disabled={loading}
        className="w-full h-10"
        size="lg"
      >
        {loading ? 'Caricamento...' : 'Inizia il Processo di Adesione'}
      </Button>
    </div>
  );
};
