import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calculator, List } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CalculatorFlow } from "./CalculatorFlow";
import { DirectSelectionFlow } from "./DirectSelectionFlow";

interface LeadGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedInterventionName?: string | null;
}

type FlowType = "none" | "calculator" | "direct";

export function LeadGenerationDialog({ open, onOpenChange, preselectedInterventionName }: LeadGenerationDialogProps) {
  // Initialize flowType based on whether we have a preselected intervention
  const [flowType, setFlowType] = useState<FlowType>(preselectedInterventionName ? "direct" : "none");

  // Update flowType when preselectedInterventionName changes or dialog opens/closes
  useEffect(() => {
    if (open && preselectedInterventionName) {
      setFlowType("direct");
    } else if (open && !preselectedInterventionName) {
      // Opening without preselection - show menu
      setFlowType("none");
    } else if (!open) {
      // Reset when dialog closes
      setFlowType("none");
    }
  }, [open, preselectedInterventionName]);

  const handleClose = () => {
    setFlowType("none");
    onOpenChange(false);
  };

  const handleSuccess = () => {
    handleClose();
  };

  // Determine dialog title based on flow
  const getDialogTitle = () => {
    if (preselectedInterventionName && flowType === "direct") {
      return "Scegli il Partner";
    }
    if (flowType === "calculator") {
      return "Calcolatore Interventi";
    }
    if (flowType === "direct") {
      return "Selezione Intervento";
    }
    return "Nuovo Intervento";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{getDialogTitle()}</DialogTitle>
        </DialogHeader>

        {flowType === "none" && !preselectedInterventionName && (
          <div className="space-y-6 py-4">
            <p className="text-muted-foreground">
              Scegli come vuoi procedere per creare una richiesta di intervento
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              <Card 
                className="p-6 cursor-pointer hover:shadow-elegant transition-all hover:scale-105"
                onClick={() => setFlowType("calculator")}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Calculator className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Calcolatore Interventi</h3>
                    <p className="text-sm text-muted-foreground">
                      Non sai quale intervento scegliere? Rispondi ad alcune domande sulla tua casa 
                      e ti consiglieremo i migliori interventi possibili
                    </p>
                  </div>
                  <Button className="w-full">Inizia il Calcolatore</Button>
                </div>
              </Card>

              <Card 
                className="p-6 cursor-pointer hover:shadow-elegant transition-all hover:scale-105"
                onClick={() => setFlowType("direct")}
              >
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="p-4 rounded-full bg-secondary/10">
                    <List className="h-8 w-8 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Selezione Diretta</h3>
                    <p className="text-sm text-muted-foreground">
                      Sai già quale intervento vuoi effettuare? Selezionalo direttamente 
                      e scegli il partner che preferisci
                    </p>
                  </div>
                  <Button variant="secondary" className="w-full">Scegli Intervento</Button>
                </div>
              </Card>
            </div>
          </div>
        )}

        {flowType === "calculator" && (
          <CalculatorFlow onComplete={handleSuccess} onBack={() => setFlowType("none")} />
        )}

        {flowType === "direct" && (
          <DirectSelectionFlow 
            onComplete={handleSuccess} 
            onBack={() => {
              // If preselected, close the dialog instead of going back to flow selection
              if (preselectedInterventionName) {
                handleClose();
              } else {
                setFlowType("none");
              }
            }}
            preselectedInterventionName={preselectedInterventionName}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
