"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface InterventionResultsProps {
  onClose: () => void;
}

interface Lead {
  id: string;
  intervention_type_id: string;
  intervention_types: {
    name: string;
    description: string | null;
    icon: string | null;
  };
}

export function InterventionResults({ onClose }: InterventionResultsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeads();
  }, [user]);

  const loadLeads = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("leads")
        .select(`
          id,
          intervention_type_id,
          intervention_types (
            name,
            description,
            icon
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "new")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads((data || []).map(l => ({
        ...l,
        intervention_type_id: l.intervention_type_id || ''
      })) as Lead[]);
    } catch (error) {
      console.error("Error loading leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleInterventionClick = (interventionId: string) => {
    // Navigate to interventions page and possibly filter/highlight this intervention
    navigate("/interventions");
    onClose();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-4">
          <CheckCircle2 className="h-8 w-8 text-primary-foreground" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Interventi Consigliati</h3>
        <p className="text-muted-foreground">
          Abbiamo trovato {leads.length} interventi perfetti per la tua casa
        </p>
      </div>

      <div className="grid gap-4">
        {leads.map((lead, index) => (
          <Card
            key={lead.id}
            className="p-4 hover:shadow-elegant transition-all cursor-pointer group"
            onClick={() => handleInterventionClick(lead.intervention_type_id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {lead.intervention_types.name}
                    </h4>
                    <Badge variant="secondary" className="mt-1">
                      Richiesta #{index + 1}
                    </Badge>
                  </div>
                </div>
                {lead.intervention_types.description && (
                  <p className="text-sm text-muted-foreground ml-12">
                    {lead.intervention_types.description}
                  </p>
                )}
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button onClick={onClose} variant="outline" className="flex-1">
          Chiudi
        </Button>
        <Button onClick={() => navigate("/interventions")} className="flex-1">
          Vedi Tutti gli Interventi
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Puoi sempre tornare a visualizzare i tuoi interventi suggeriti dalla sezione "Interventi"
      </p>
    </div>
  );
}