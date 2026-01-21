"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Zap, TrendingDown, ArrowRight, CheckCircle2,
  Sparkles, Home, Flame, Sun, ThermometerSun, ChevronDown, Info, AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "next/navigation";
import { useConfetti } from "@/hooks/useConfetti";
import type { Recommendation, CalculationDetails } from "@/lib/recommendations-engine";

interface SnapSolveResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysisId: string;
}

interface AnalysisData {
  combined_energy_class: string | null;
  estimated_extra_cost_yearly: number;
  recommendations: Recommendation[];
  bill_analysis: any;
  heating_analysis: any;
  external_analysis: any;
  square_meters: number | null;
  calculation_details: CalculationDetails | null;
  confidence_level: number | null;
}

const getInterventionIcon = (type: string) => {
  switch (type) {
    case 'heating': return Flame;
    case 'windows': return Home;
    case 'insulation': return ThermometerSun;
    case 'solar_panels': return Sun;
    default: return Zap;
  }
};

const getEnergyClassColor = (cls: string | null | undefined) => {
  if (!cls) return 'bg-gray-400';
  if (cls.startsWith('A')) return 'bg-green-500';
  if (cls === 'B') return 'bg-lime-500';
  if (cls === 'C') return 'bg-yellow-500';
  if (cls === 'D') return 'bg-orange-400';
  if (cls === 'E') return 'bg-orange-500';
  if (cls === 'F') return 'bg-red-400';
  return 'bg-red-600';
};

const getConfidenceBadge = (confidence: 'alta' | 'media' | 'bassa') => {
  const styles = {
    alta: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    media: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    bassa: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
  };
  return styles[confidence];
};

export const SnapSolveResults = ({ open, onOpenChange, analysisId }: SnapSolveResultsProps) => {
  const router = useRouter();
  const navigate = (path: string, options?: any) => {
    // Adapter for Next.js navigation with state is not directly supported via push
    // We can use query params or Context for passing state. 
    // Ideally we should use query params.
    if (options?.state?.preselectedIntervention) {
      router.push(`${path}?preselectedIntervention=${encodeURIComponent(options.state.preselectedIntervention)}`);
    } else {
      router.push(path);
    }
  };

  const { fireMultiple, fireStars } = useConfetti();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confettiFired, setConfettiFired] = useState(false);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  useEffect(() => {
    if (open && analysisId) {
      loadAnalysis();
    }
  }, [open, analysisId]);

  useEffect(() => {
    if (analysis && !confettiFired) {
      fireMultiple('celebration');
      setConfettiFired(true);
    }
  }, [analysis, confettiFired]);

  const loadAnalysis = async () => {
    try {
      const { data, error } = await supabase
        .from('home_analysis')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) throw error;

      // Parse recommendations if it's a string
      const recommendations = typeof data.recommendations === 'string'
        ? JSON.parse(data.recommendations)
        : data.recommendations || [];

      // Parse calculation_details if it's a string
      const calculation_details = typeof data.calculation_details === 'string'
        ? JSON.parse(data.calculation_details)
        : data.calculation_details || null;

      setAnalysis({
        ...data,
        combined_energy_class: data.combined_energy_class || null,
        recommendations,
        calculation_details
      } as AnalysisData);
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInterventions = () => {
    onOpenChange(false);
    navigate('/interventions');
  };

  // Map recommendation types to intervention_types names (must match DB exactly!)
  // DB names: 'Audit Energetico', 'Batterie di Accumulo', 'Isolamento Termico', 
  //           'Pannelli Solari', 'Pompa di Calore', 'Sostituzione Infissi'
  const getInterventionTypeFromRecommendation = (recType: string): string | null => {
    const typeMap: Record<string, string> = {
      'heating_replacement': 'Pompa di Calore',
      'heating': 'Pompa di Calore',
      'window_replacement': 'Sostituzione Infissi',
      'windows': 'Sostituzione Infissi',
      'insulation': 'Isolamento Termico',
      'solar_panels': 'Pannelli Solari',
      'solar': 'Pannelli Solari',
      'battery': 'Batterie di Accumulo',
      'audit': 'Audit Energetico'
    };
    return typeMap[recType] || null;
  };

  const handleRequestQuote = async (recommendation: Recommendation) => {
    // Create a lead for this recommendation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('leads').insert([{
      user_id: user.id,
      calculator_data: {
        source: 'snap_solve',
        analysis_id: analysisId,
        recommendation: recommendation as unknown as Record<string, unknown>
      } as unknown as any,
      status: 'new'
    }]);

    fireStars();
    onOpenChange(false);

    // Navigate with preselected intervention type
    const interventionName = getInterventionTypeFromRecommendation(recommendation.intervention_type);
    navigate('/interventions', { state: { preselectedIntervention: interventionName } });
  };

  const totalSavingsMin = analysis?.recommendations?.reduce(
    (sum, r) => sum + (r.estimated_savings_min || r.estimated_savings || 0), 0
  ) || 0;
  const totalSavingsMax = analysis?.recommendations?.reduce(
    (sum, r) => sum + (r.estimated_savings_max || r.estimated_savings || 0), 0
  ) || 0;

  const details = analysis?.calculation_details;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            La Tua Casa in Numeri
          </DialogTitle>
          <DialogDescription>
            Ecco cosa abbiamo scoperto dall'analisi
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-muted rounded-lg" />
              <div className="h-32 bg-muted rounded-lg" />
              <div className="h-32 bg-muted rounded-lg" />
            </div>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Energy Class Hero */}
            <Card className="p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5" />
              <div className="relative">
                <p className="text-sm text-muted-foreground mb-2">Classe Energetica Stimata</p>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-white text-3xl font-bold ${getEnergyClassColor(analysis.combined_energy_class)
                      }`}
                  >
                    {analysis.combined_energy_class || 'N/D'}
                  </div>
                </div>

                {details?.energy_index_kwh_m2 && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {details.energy_index_kwh_m2} kWh/m²/anno
                  </p>
                )}

                {analysis.estimated_extra_cost_yearly > 0 && (
                  <div className="bg-destructive/10 rounded-lg p-3 mt-4">
                    <p className="text-destructive font-medium flex items-center justify-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Stima: €{Math.round(analysis.estimated_extra_cost_yearly * 0.8)} - €{Math.round(analysis.estimated_extra_cost_yearly * 1.2)}/anno
                    </p>
                    <p className="text-xs text-destructive/70 mt-1">
                      di costo extra rispetto a una casa in classe A
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Methodology Section */}
            <Collapsible open={methodologyOpen} onOpenChange={setMethodologyOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between text-muted-foreground hover:text-foreground">
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Come calcoliamo?
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${methodologyOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="p-4 mt-2 bg-muted/50 text-sm space-y-3">
                  {details && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        {details.annual_consumption_kwh && (
                          <div>
                            <p className="text-muted-foreground">Consumo rilevato</p>
                            <p className="font-medium">{details.annual_consumption_kwh.toLocaleString()} kWh/anno</p>
                          </div>
                        )}
                        {details.square_meters && (
                          <div>
                            <p className="text-muted-foreground">Superficie</p>
                            <p className="font-medium">{details.square_meters} m²</p>
                          </div>
                        )}
                        {details.energy_index_kwh_m2 && (
                          <div>
                            <p className="text-muted-foreground">Indice EP</p>
                            <p className="font-medium">{details.energy_index_kwh_m2} kWh/m²/anno</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">Metodo</p>
                          <p className="font-medium">{details.calculation_method === 'measured' ? 'Dati bolletta' : 'Stima AI'}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <p className="text-muted-foreground mb-1">Prezzi energia</p>
                        <p className="text-xs">
                          Elettricità: €{details.energy_prices.electricity_kwh}/kWh •
                          Gas: €{details.energy_prices.gas_smc}/Smc
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Fonte: {details.energy_prices.source}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                          Standard: {details.reference_standard}
                        </p>
                      </div>
                    </>
                  )}
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Analysis Summary */}
            {analysis.heating_analysis?.brand && (
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Flame className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">
                      {analysis.heating_analysis.brand}
                      {analysis.heating_analysis.model && ` ${analysis.heating_analysis.model}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Anno stimato: {analysis.heating_analysis.estimated_year || 'N/A'}
                      {analysis.heating_analysis.energy_class && ` • Classe ${analysis.heating_analysis.energy_class}`}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Interventi Consigliati</h3>
                  <Badge variant="secondary" className="gap-1">
                    <Zap className="h-3 w-3" />
                    €{totalSavingsMin.toLocaleString()} - €{totalSavingsMax.toLocaleString()}/anno
                  </Badge>
                </div>

                {analysis.recommendations.map((rec, index) => {
                  const Icon = getInterventionIcon(rec.intervention_type);
                  const savingsMin = rec.estimated_savings_min || rec.estimated_savings;
                  const savingsMax = rec.estimated_savings_max || rec.estimated_savings;
                  const costMin = rec.estimated_cost_min || rec.estimated_cost;
                  const costMax = rec.estimated_cost_max || rec.estimated_cost;

                  return (
                    <Card
                      key={index}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleRequestQuote(rec)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${rec.priority === 1 ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                          <Icon className={`h-5 w-5 ${rec.priority === 1 ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-medium">{rec.title}</p>
                            {rec.priority === 1 && (
                              <Badge variant="default" className="text-xs">Priorità</Badge>
                            )}
                            {rec.confidence && (
                              <Badge variant="outline" className={`text-xs ${getConfidenceBadge(rec.confidence)}`}>
                                {rec.confidence === 'alta' ? 'Stima affidabile' :
                                  rec.confidence === 'media' ? 'Stima indicativa' : 'Stima approssimativa'}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="text-secondary font-medium">
                              €{savingsMin.toLocaleString()} - €{savingsMax.toLocaleString()}/anno
                            </span>
                            <span className="text-muted-foreground">
                              Costo: €{costMin.toLocaleString()} - €{costMax.toLocaleString()}
                            </span>
                            <span className="text-muted-foreground">
                              ROI: {rec.roi_years_min || rec.roi_years} - {rec.roi_years_max || rec.roi_years} anni
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Disclaimer */}
            <Card className="p-3 bg-muted/50 border-muted">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Le stime sono indicative e non sostituiscono una diagnosi energetica certificata (APE).
                I risparmi effettivi dipendono da molti fattori.
              </p>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Chiudi
              </Button>
              <Button onClick={handleViewInterventions} className="flex-1 gap-2">
                Vedi Tutti
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Nessun dato disponibile
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
