import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Zap, TrendingDown, Users } from 'lucide-react';

interface OnboardingCompleteProps {
  onFinish: () => void;
}

export const OnboardingComplete = ({ onFinish }: OnboardingCompleteProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Benvenuto su <span className="font-brand">Karica</span>!</h2>
          <p className="text-muted-foreground">
            La tua registrazione è stata completata con successo
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Cosa puoi fare ora:</h3>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Monitora i tuoi consumi</p>
                <p className="text-sm text-muted-foreground">
                  Tieni traccia dei tuoi consumi energetici in tempo reale
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Scopri gli interventi</p>
                <p className="text-sm text-muted-foreground">
                  Ricevi suggerimenti personalizzati per ridurre i consumi
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Unisciti a una CER</p>
                <p className="text-sm text-muted-foreground">
                  Entra a far parte di una Comunità Energetica Rinnovabile
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-sm text-foreground text-center">
            🎉 Stai verificando l'eligibilità per le CER nel tuo territorio
          </p>
        </CardContent>
      </Card>

      <Button onClick={onFinish} className="w-full" size="lg">
        Inizia a usare <span className="font-brand">Karica</span>
      </Button>
    </div>
  );
};