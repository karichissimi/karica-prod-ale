import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Check, Star } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface DirectSelectionFlowProps {
  onComplete: () => void;
  onBack: () => void;
  preselectedInterventionName?: string | null;
}

interface InterventionType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface Partner {
  id: string;
  company_name: string;
  description: string;
  rating: number;
  contact_email: string;
  contact_phone: string;
  specializations: { intervention_type_id: string }[];
}

export function DirectSelectionFlow({ onComplete, onBack, preselectedInterventionName }: DirectSelectionFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [interventionTypes, setInterventionTypes] = useState<InterventionType[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isPreselected] = useState(!!preselectedInterventionName);
  // Track if we're still auto-selecting (waiting for intervention types to load)
  const [autoSelecting, setAutoSelecting] = useState(!!preselectedInterventionName);
  
  const [selectedIntervention, setSelectedIntervention] = useState("");
  const [selectedPartner, setSelectedPartner] = useState("");
  const [notes, setNotes] = useState("");
  
  // Step starts at 1 unless we have a preselected intervention AND it has been auto-selected
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadInterventionTypes();
  }, []);

  // Auto-select intervention if preselected name is provided
  useEffect(() => {
    if (preselectedInterventionName && interventionTypes.length > 0 && autoSelecting) {
      // Try exact match first (case-insensitive)
      let matchingType = interventionTypes.find(t => 
        t.name.toLowerCase() === preselectedInterventionName.toLowerCase()
      );
      
      // Fallback to partial match
      if (!matchingType) {
        matchingType = interventionTypes.find(t => 
          t.name.toLowerCase().includes(preselectedInterventionName.toLowerCase()) ||
          preselectedInterventionName.toLowerCase().includes(t.name.toLowerCase())
        );
      }
      
      if (matchingType) {
        console.log('Auto-selecting intervention:', matchingType.name, 'from:', preselectedInterventionName);
        setSelectedIntervention(matchingType.id);
        setStep(2); // Now move to step 2 after selecting
      } else {
        console.warn('No matching intervention type found for:', preselectedInterventionName);
        // If no match, stay on step 1 so user can select manually
        setStep(1);
      }
      setAutoSelecting(false); // Done auto-selecting
    }
  }, [preselectedInterventionName, interventionTypes, autoSelecting]);

  useEffect(() => {
    if (selectedIntervention) {
      loadPartners();
    }
  }, [selectedIntervention]);

  const loadInterventionTypes = async () => {
    const { data, error } = await (supabase as any)
      .from("intervention_types")
      .select("*")
      .order("name");

    if (!error && data) {
      setInterventionTypes(data as any);
    }
  };

  const loadPartners = async () => {
    const { data, error } = await (supabase as any)
      .from("partners")
      .select(`
        *,
        specializations:partner_specializations(intervention_type_id)
      `)
      .eq("partner_specializations.intervention_type_id", selectedIntervention)
      .eq("is_active", true)
      .order("rating", { ascending: false });

    if (!error && data) {
      setPartners(data as any);
    }
  };

  const handleNext = () => {
    if (step === 1 && selectedIntervention) {
      setStep(2);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      // When going back from partner selection, go to intervention selection if not preselected
      if (isPreselected) {
        onBack();
      } else {
        setStep(step - 1);
      }
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await (supabase as any)
        .from("leads")
        .insert({
          user_id: user.id,
          intervention_type_id: selectedIntervention,
          partner_id: selectedPartner || null,
          status: "new",
          notes: notes || null,
        });

      if (error) throw error;

      toast({
        title: "Richiesta Inviata",
        description: "La tua richiesta è stata inviata con successo!",
      });

      onComplete();
    } catch (error) {
      console.error("Error creating lead:", error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio della richiesta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get selected intervention name for display
  const selectedInterventionName = interventionTypes.find(t => t.id === selectedIntervention)?.name || preselectedInterventionName;

  // Show loading while auto-selecting
  if (autoSelecting) {
    return (
      <div className="py-8 flex flex-col items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Caricamento partner qualificati...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Show progress - for preselected we're on step 2 of 2 */}
      <div className="flex items-center gap-2 mb-6">
        <div className="text-sm text-muted-foreground">
          Passo {step} di 2
        </div>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-secondary transition-all duration-300"
            style={{ width: `${(step / 2) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Show selected intervention badge when preselected */}
      {isPreselected && selectedInterventionName && (
        <div className="mb-4">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {selectedInterventionName}
          </Badge>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Seleziona Tipo di Intervento</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Quale intervento vuoi effettuare?
            </p>
          </div>
          
          <RadioGroup value={selectedIntervention} onValueChange={setSelectedIntervention}>
            <div className="grid gap-3">
              {interventionTypes.map((type) => (
                <Card 
                  key={type.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedIntervention === type.id ? "border-primary ring-2 ring-primary/20" : ""
                  }`}
                  onClick={() => setSelectedIntervention(type.id)}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value={type.id} id={type.id} />
                    <div className="flex-1">
                      <Label htmlFor={type.id} className="cursor-pointer">
                        <div className="font-semibold">{type.name}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {type.description}
                        </div>
                      </Label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </RadioGroup>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Scegli il Partner (Opzionale)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Seleziona un'azienda partner o lascia che te ne assegnamo una automaticamente
            </p>
          </div>

          {partners.length > 0 ? (
            <RadioGroup value={selectedPartner} onValueChange={setSelectedPartner}>
              <div className="grid gap-3">
                <Card 
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPartner === "" ? "border-primary ring-2 ring-primary/20" : ""
                  }`}
                  onClick={() => setSelectedPartner("")}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="" id="auto" />
                    <Label htmlFor="auto" className="cursor-pointer flex-1">
                      <div className="font-semibold">Assegnazione Automatica</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Ti assegneremo il miglior partner disponibile
                      </div>
                    </Label>
                  </div>
                </Card>

                {partners.map((partner) => (
                  <Card 
                    key={partner.id}
                    className={`p-4 cursor-pointer transition-all ${
                      selectedPartner === partner.id ? "border-primary ring-2 ring-primary/20" : ""
                    }`}
                    onClick={() => setSelectedPartner(partner.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={partner.id} id={partner.id} />
                      <div className="flex-1">
                        <Label htmlFor={partner.id} className="cursor-pointer">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold">{partner.company_name}</div>
                            <Badge variant="outline" className="gap-1">
                              <Star className="h-3 w-3 fill-secondary text-secondary" />
                              {partner.rating.toFixed(1)}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {partner.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            📧 {partner.contact_email} • 📞 {partner.contact_phone}
                          </div>
                        </Label>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </RadioGroup>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">
                Nessun partner disponibile per questo tipo di intervento.
                La richiesta verrà gestita automaticamente.
              </p>
            </Card>
          )}

          <div className="mt-4">
            <Label htmlFor="notes">Note aggiuntive (opzionale)</Label>
            <Textarea
              id="notes"
              placeholder="Aggiungi eventuali dettagli o richieste specifiche..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2"
              rows={4}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        
        {step === 1 ? (
          <Button onClick={handleNext} disabled={!selectedIntervention}>
            Avanti
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            <Check className="h-4 w-4 mr-2" />
            {loading ? "Invio..." : "Invia Richiesta"}
          </Button>
        )}
      </div>
    </div>
  );
}
