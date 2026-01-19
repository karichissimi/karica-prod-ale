import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { InterventionResults } from "./InterventionResults";

interface CalculatorFlowProps {
  onComplete: () => void;
  onBack: () => void;
}

type HouseType = "apartment" | "single_family" | "multi_family";
type HeatingType = "gas" | "electric" | "heat_pump" | "oil" | "wood";

export function CalculatorFlow({ onComplete, onBack }: CalculatorFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const [formData, setFormData] = useState({
    houseType: "" as HouseType | "",
    squareMeters: "",
    heatingType: "" as HeatingType | "",
    yearBuilt: "",
    insulation: "" as "good" | "poor" | "none" | "",
  });

  const totalSteps = 5;

  const getRecommendedInterventions = () => {
    const recommendations: string[] = [];
    
    // Logica di raccomandazione basata sulle risposte
    if (formData.heatingType === "gas" || formData.heatingType === "oil") {
      recommendations.push("Pompa di Calore");
    }
    
    if (formData.insulation === "poor" || formData.insulation === "none") {
      recommendations.push("Isolamento Termico");
    }
    
    const yearBuilt = parseInt(formData.yearBuilt);
    if (yearBuilt && yearBuilt < 2000) {
      recommendations.push("Sostituzione Infissi");
    }
    
    if (formData.houseType === "single_family" || formData.houseType === "multi_family") {
      recommendations.push("Pannelli Solari");
    }
    
    // Sempre consigliare audit energetico
    recommendations.push("Audit Energetico");
    
    return recommendations;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const recommendations = getRecommendedInterventions();
      
      // Ottieni i tipi di intervento raccomandati
      const { data: interventionTypes } = await (supabase as any)
        .from("intervention_types")
        .select("id, name")
        .in("name", recommendations);

      if (interventionTypes && interventionTypes.length > 0) {
        // Crea una lead per ogni intervento raccomandato
        const leadsToCreate = interventionTypes.map((type: any) => ({
          user_id: user.id,
          intervention_type_id: type.id,
          status: "new",
          calculator_data: formData,
        }));

        const { error } = await (supabase as any)
          .from("leads")
          .insert(leadsToCreate);

        if (error) throw error;

        toast({
          title: "Successo",
          description: `Abbiamo trovato ${interventionTypes.length} interventi adatti alla tua casa!`,
        });

        setShowResults(true);
      }
    } catch (error) {
      console.error("Error creating leads:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante la creazione delle richieste",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1: return formData.houseType !== "";
      case 2: return formData.squareMeters !== "";
      case 3: return formData.heatingType !== "";
      case 4: return formData.yearBuilt !== "";
      case 5: return formData.insulation !== "";
      default: return false;
    }
  };

  if (showResults) {
    return <InterventionResults onClose={onComplete} />;
  }

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-sm text-muted-foreground">
          Passo {step} di {totalSteps}
        </div>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <Card className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Tipo di Abitazione</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Che tipo di casa hai?
              </p>
            </div>
            <RadioGroup
              value={formData.houseType}
              onValueChange={(value) => setFormData({ ...formData, houseType: value as HouseType })}
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="apartment" id="apartment" />
                <Label htmlFor="apartment" className="cursor-pointer flex-1">
                  Appartamento
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="single_family" id="single_family" />
                <Label htmlFor="single_family" className="cursor-pointer flex-1">
                  Casa Unifamiliare
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="multi_family" id="multi_family" />
                <Label htmlFor="multi_family" className="cursor-pointer flex-1">
                  Casa Plurifamiliare
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Dimensione Casa</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Quanti metri quadri ha la tua casa?
              </p>
            </div>
            <div>
              <Label htmlFor="squareMeters">Metri Quadri (m²)</Label>
              <Input
                id="squareMeters"
                type="number"
                placeholder="es. 120"
                value={formData.squareMeters}
                onChange={(e) => setFormData({ ...formData, squareMeters: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Tipo di Riscaldamento</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Quale sistema di riscaldamento utilizzi attualmente?
              </p>
            </div>
            <RadioGroup
              value={formData.heatingType}
              onValueChange={(value) => setFormData({ ...formData, heatingType: value as HeatingType })}
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="gas" id="gas" />
                <Label htmlFor="gas" className="cursor-pointer flex-1">
                  Caldaia a Gas
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="electric" id="electric" />
                <Label htmlFor="electric" className="cursor-pointer flex-1">
                  Riscaldamento Elettrico
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="heat_pump" id="heat_pump" />
                <Label htmlFor="heat_pump" className="cursor-pointer flex-1">
                  Pompa di Calore
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="oil" id="oil" />
                <Label htmlFor="oil" className="cursor-pointer flex-1">
                  Caldaia a Gasolio
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="wood" id="wood" />
                <Label htmlFor="wood" className="cursor-pointer flex-1">
                  Stufa a Legna/Pellet
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Anno di Costruzione</h3>
              <p className="text-sm text-muted-foreground mb-4">
                In che anno è stata costruita la casa?
              </p>
            </div>
            <div>
              <Label htmlFor="yearBuilt">Anno</Label>
              <Input
                id="yearBuilt"
                type="number"
                placeholder="es. 1985"
                value={formData.yearBuilt}
                onChange={(e) => setFormData({ ...formData, yearBuilt: e.target.value })}
                className="mt-2"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Stato Isolamento</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Com'è l'isolamento termico della tua casa?
              </p>
            </div>
            <RadioGroup
              value={formData.insulation}
              onValueChange={(value) => setFormData({ ...formData, insulation: value as "good" | "poor" | "none" })}
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="good" id="good" />
                <Label htmlFor="good" className="cursor-pointer flex-1">
                  Buono (recente o ristrutturato)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="poor" id="poor" />
                <Label htmlFor="poor" className="cursor-pointer flex-1">
                  Scarso (necessita miglioramenti)
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="cursor-pointer flex-1">
                  Assente o molto vecchio
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        
        {step < totalSteps ? (
          <Button onClick={handleNext} disabled={!isStepValid()}>
            Avanti
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={!isStepValid() || loading}>
            <Check className="h-4 w-4 mr-2" />
            {loading ? "Creazione..." : "Ottieni Consigli"}
          </Button>
        )}
      </div>
    </div>
  );
}
