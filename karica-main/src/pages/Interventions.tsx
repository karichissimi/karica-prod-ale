import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Sparkles, TrendingDown, HelpCircle, ArrowRight, Home, RefreshCw, Flame, Thermometer, Sun, Info, Zap } from "lucide-react";
import { LeadGenerationDialog } from "@/components/lead-generation/LeadGenerationDialog";
import { SnapSolveFlow } from "@/components/snap-solve/SnapSolveFlow";
import { ConsumptionChart } from "@/components/interventions/ConsumptionChart";
import { CalculationDetailsPopup } from "@/components/interventions/CalculationDetailsPopup";
import AnimatedLogo from '@/components/AnimatedLogo';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

interface Recommendation {
  type: string;
  title: string;
  description: string;
  savings_min: number;
  savings_max: number;
  cost_min: number;
  cost_max: number;
  roi_years: number;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
}

interface CalculationDetails {
  energy_price_source?: string;
  electricity_price_kwh?: number;
  gas_price_smc?: number;
  reference_standard?: string;
  methodology?: string;
  confidence_factors?: {
    bill: number;
    heating: number;
    building: number;
    overall: number;
  };
  assumptions?: string[];
  data_sources?: string[];
}

interface HomeAnalysis {
  id: string;
  combined_energy_class: string | null;
  estimated_extra_cost_yearly: number | null;
  recommendations: Recommendation[] | null;
  completed_at: string | null;
  confidence_level: number | null;
  bill_analysis?: { annual_consumption?: number } | null;
  calculation_details?: CalculationDetails | null;
}

const getEnergyClassColor = (energyClass: string | null) => {
  switch (energyClass?.toUpperCase()) {
    case 'A': return 'bg-green-500 text-white';
    case 'B': return 'bg-lime-500 text-white';
    case 'C': return 'bg-yellow-500 text-black';
    case 'D': return 'bg-orange-500 text-white';
    case 'E': return 'bg-orange-600 text-white';
    case 'F': return 'bg-red-500 text-white';
    case 'G': return 'bg-red-700 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getInterventionIcon = (type: string) => {
  switch (type) {
    case 'heating_replacement': return <Flame className="h-5 w-5" />;
    case 'window_replacement': return <Thermometer className="h-5 w-5" />;
    case 'insulation': return <Home className="h-5 w-5" />;
    case 'solar_panels': return <Sun className="h-5 w-5" />;
    default: return <Zap className="h-5 w-5" />;
  }
};

const Interventions = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snapSolveOpen, setSnapSolveOpen] = useState(false);
  const [calculationPopupOpen, setCalculationPopupOpen] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<HomeAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);
  const [preselectedIntervention, setPreselectedIntervention] = useState<string | null>(null);

  // Check for preselected intervention from navigation state
  useEffect(() => {
    const state = location.state as { preselectedIntervention?: string } | null;
    if (state?.preselectedIntervention) {
      setPreselectedIntervention(state.preselectedIntervention);
      setDialogOpen(true);
      // Clear the state to prevent reopening on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (user) {
      loadLatestAnalysis();
    } else {
      setLoadingAnalysis(false);
    }
  }, [user]);

  const loadLatestAnalysis = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('home_analysis')
        .select('id, combined_energy_class, estimated_extra_cost_yearly, recommendations, completed_at, confidence_level, bill_analysis, calculation_details')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setLatestAnalysis({
          ...data,
          recommendations: Array.isArray(data.recommendations) 
            ? (data.recommendations as unknown as Recommendation[]) 
            : null,
          bill_analysis: data.bill_analysis as { annual_consumption?: number } | null,
          calculation_details: data.calculation_details as CalculationDetails | null
        });
      }
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const hasAnalysis = latestAnalysis !== null;
  const recommendations = latestAnalysis?.recommendations || [];
  
  // Calculate yearly savings with proper fallback for NaN
  const yearlySavings = recommendations.reduce((sum, rec) => {
    const savingsMin = rec.savings_min ?? 0;
    const savingsMax = rec.savings_max ?? savingsMin;
    const avgSavings = (savingsMin + savingsMax) / 2;
    return sum + (isNaN(avgSavings) ? 0 : avgSavings);
  }, 0);
  const monthlySavings = isNaN(yearlySavings) ? 0 : Math.round(yearlySavings / 12);
  const extraCostYearly = latestAnalysis?.estimated_extra_cost_yearly || 0;
  const annualConsumption = (latestAnalysis?.bill_analysis as any)?.annual_consumption || 3000;

  // Calculate recovery percentage (how much of the waste can be recovered)
  // Default to 80% (Karica specialists can get you to at least Class B) if no recommendations yet
  // If savings >= extraCost, user can reach class A (100%)
  // Otherwise, calculate percentage
  const hasRecommendations = recommendations.length > 0 && yearlySavings > 0;
  
  // Always default to 80% when no recommendations or calculations available
  const DEFAULT_RECOVERY = 80;
  
  const recoveryPercentage = hasRecommendations && extraCostYearly > 0
    ? Math.min(100, Math.round((yearlySavings / extraCostYearly) * 100))
    : DEFAULT_RECOVERY;
  
  // Calculate actual savings based on recovery percentage  
  // If no recommendations, show 80% of the yearly waste as potential savings
  const displayedSavings = hasRecommendations 
    ? yearlySavings 
    : Math.round(extraCostYearly * (DEFAULT_RECOVERY / 100));

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

  // Handle dialog close - reset preselected intervention
  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setPreselectedIntervention(null);
    }
  };

  const handleRecommendationClick = (rec: Recommendation) => {
    const interventionName = getInterventionTypeFromRecommendation(rec.type);
    setPreselectedIntervention(interventionName);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <AnimatedLogo className="h-10 w-10 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-tight">Interventi Consigliati</h2>
            <p className="text-sm text-muted-foreground">Migliora l'efficienza energetica della tua casa</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {loadingAnalysis ? (
        <Card className="p-4 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-24" />
              <div className="h-6 bg-muted rounded w-16" />
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            {/* Energy Class Badge */}
            <div className={`p-2.5 rounded-lg font-bold text-lg ${hasAnalysis ? getEnergyClassColor(latestAnalysis?.combined_energy_class) : 'bg-muted'}`}>
              {hasAnalysis ? latestAnalysis?.combined_energy_class || '?' : '?'}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">
                  {hasAnalysis ? `Classe ${latestAnalysis?.combined_energy_class}` : 'Classe da calcolare'}
                </p>
                {hasAnalysis && extraCostYearly > 0 && (
                  <span className="text-lg font-bold text-destructive">
                    -€{Math.round(extraCostYearly)}/anno
                  </span>
                )}
              </div>
              
              {hasAnalysis && extraCostYearly > 0 ? (
                <div className="mt-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-secondary font-medium">
                      Recupera {recoveryPercentage}%
                    </span>
                    <span className="text-xs bg-lime-500/10 text-lime-600 px-2 py-0.5 rounded-full">
                      = €{Math.round(displayedSavings)}/anno
                    </span>
                    {recoveryPercentage >= 100 ? (
                      <span className="text-xs bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">→ A</span>
                    ) : (
                      <span className="text-xs bg-lime-500/10 text-lime-600 px-1.5 py-0.5 rounded">→ B</span>
                    )}
                  </div>
                  <button 
                    onClick={() => setCalculationPopupOpen(true)}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                  >
                    Come calcoliamo?
                    <Info className="h-3 w-3" />
                  </button>
                </div>
              ) : !hasAnalysis && (
                <p className="text-xs text-muted-foreground mt-1">
                  Esegui un'analisi per scoprire quanto puoi risparmiare
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Analysis timestamp & re-run button */}
      {hasAnalysis && latestAnalysis?.completed_at && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Aggiornata {formatDistanceToNow(new Date(latestAnalysis.completed_at), { addSuffix: true, locale: it })}
          </span>
          <Button variant="ghost" size="sm" onClick={() => setSnapSolveOpen(true)} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Riesegui Analisi
          </Button>
        </div>
      )}

      {/* Comparative Consumption Chart - When analysis exists */}
      {hasAnalysis && yearlySavings > 0 && (
        <ConsumptionChart 
          currentConsumption={annualConsumption}
          yearlySavings={yearlySavings}
          energyClass={latestAnalysis?.combined_energy_class || null}
        />
      )}
      {!hasAnalysis && !loadingAnalysis && (
        <div className="space-y-4">
          {/* Main FOMO Card */}
          <Card className="p-6 border-destructive/30 bg-gradient-to-br from-destructive/5 via-background to-destructive/10">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-foreground">Quanto stai buttando via?</h3>
                <p className="text-lg text-muted-foreground mt-2">
                  La maggior parte delle famiglie italiane spreca tra{' '}
                  <span className="font-bold text-destructive">200 €</span> e{' '}
                  <span className="font-bold text-destructive">800 € l'anno</span>{' '}
                  in inefficienze energetiche.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button 
                  size="lg"
                  onClick={() => setSnapSolveOpen(true)} 
                  className="gap-2 text-lg px-6"
                >
                  <Sparkles className="h-5 w-5" />
                  Analisi Smart
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Scopri quanta energia brucia la tua casa • Analisi AI in 30 secondi
              </p>
            </div>
          </Card>

          {/* Secondary CTA - Urgency */}
          <Card className="p-4 bg-muted/50">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10 flex-shrink-0">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">
                  Ogni giorno che passa sono soldi persi 💸
                </p>
                <p className="text-sm text-muted-foreground">
                  Scopri subito quanto puoi risparmiare con interventi mirati
                </p>
              </div>
            </div>
          </Card>

          {/* Manual Entry Option */}
          <div className="text-center pt-2">
            <Button 
              variant="ghost" 
              onClick={() => { setPreselectedIntervention(null); setDialogOpen(true); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Oppure aggiungi un intervento manualmente
            </Button>
          </div>
        </div>
      )}

      {/* Recommendations List - When analysis exists */}
      {hasAnalysis && recommendations.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Interventi Consigliati</h3>
          
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <Card key={index} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleRecommendationClick(rec)}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    rec.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                    rec.priority === 'medium' ? 'bg-primary/10 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {getInterventionIcon(rec.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{rec.title}</h4>
                      {rec.priority === 'high' && (
                        <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Priorità alta</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{rec.description}</p>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm">
                      <span className="text-secondary font-medium">
                        Risparmio: €{rec.savings_min ?? 0}-{rec.savings_max ?? 0}/anno
                      </span>
                      <span className="text-muted-foreground">
                        Costo: €{(rec.cost_min ?? 0).toLocaleString()}-{(rec.cost_max ?? 0).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground">
                        ROI: ~{rec.roi_years ?? '?'} anni
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>

          {/* Manual Entry Option */}
          <div className="text-center pt-2">
            <Button 
              variant="ghost" 
              onClick={() => { setPreselectedIntervention(null); setDialogOpen(true); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi un intervento manualmente
            </Button>
          </div>
        </div>
      )}

      {/* Empty recommendations state */}
      {hasAnalysis && recommendations.length === 0 && (
        <Card className="p-6 text-center">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-secondary/10">
              <Zap className="h-8 w-8 text-secondary" />
            </div>
            <h3 className="text-lg font-semibold">Ottimo lavoro! 🎉</h3>
            <p className="text-muted-foreground">
              La tua casa è già efficiente. Non abbiamo trovato interventi prioritari da consigliarti.
            </p>
            <Button variant="outline" onClick={() => { setPreselectedIntervention(null); setDialogOpen(true); }} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi intervento manuale
            </Button>
          </div>
        </Card>
      )}


      <LeadGenerationDialog 
        open={dialogOpen} 
        onOpenChange={(open) => { 
          setDialogOpen(open); 
          if (!open) setPreselectedIntervention(null);
        }}
        preselectedInterventionName={preselectedIntervention}
      />
      <SnapSolveFlow open={snapSolveOpen} onOpenChange={setSnapSolveOpen} />
      <CalculationDetailsPopup 
        open={calculationPopupOpen} 
        onOpenChange={setCalculationPopupOpen}
        details={latestAnalysis?.calculation_details || null}
        extraCostYearly={extraCostYearly}
        energyClass={latestAnalysis?.combined_energy_class || null}
      />
    </div>
  );
};

export default Interventions;