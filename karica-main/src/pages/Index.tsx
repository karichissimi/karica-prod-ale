import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { CardWithWatermark } from "@/components/ui/card-watermark";
import { Zap, Users, Award, FileText, Calendar, TrendingUp, Upload, Info } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip, ReferenceLine } from "recharts";
import { AnimatedStat, ScrollReveal } from "@/components/ui/animated-stat";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedLogo from '@/components/AnimatedLogo';
import { WipDisclaimer } from "@/components/WipDisclaimer";
import { SupplyCard } from "@/components/consumer/SupplyCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BillUpload } from "@/components/onboarding/BillUpload";
import { useOnboarding } from "@/hooks/useOnboarding";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { AreraExplanationPopup } from "@/components/consumer/AreraExplanationPopup";

// ARERA profile for monthly distribution
const ARERA_PROFILE: Record<number, number> = {
  1: 0.092,
  // Gennaio
  2: 0.085,
  // Febbraio
  3: 0.080,
  // Marzo
  4: 0.072,
  // Aprile
  5: 0.070,
  // Maggio
  6: 0.083,
  // Giugno
  7: 0.095,
  // Luglio
  8: 0.088,
  // Agosto
  9: 0.078,
  // Settembre
  10: 0.075,
  // Ottobre
  11: 0.082,
  // Novembre
  12: 0.100 // Dicembre
};
const MONTH_NAMES = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const MONTH_FULL_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

// Italian average consumption (ARERA 2023)
const ITALIAN_AVERAGE = 2700;
interface BillData {
  period_consumption: number | null;
  period_start: string | null;
  period_end: string | null;
  annual_consumption_projected: number | null;
  projection_method: string | null;
  projection_details: {
    months_covered?: number[];
    arera_profile?: Record<string, number>;
  } | null;
  supplier: string | null;
  pod: string | null;
  power_kw: number | null;
  price_kwh: number | null;
}
interface MonthData {
  mese: string;
  consumo: number;
  costoEur: number;
  isCovered: boolean;
  isCurrent: boolean;
  monthNum: number;
  weight: number;
}
const Index = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [areraPopupOpen, setAreraPopupOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const {
    uploadAndAnalyzeBill,
    loading: billLoading
  } = useOnboarding();
  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const loadBillData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const {
          data,
          error
        } = await supabase.from('bill_uploads').select('ocr_data').eq('user_id', user.id).order('created_at', {
          ascending: false
        }).limit(1).maybeSingle();
        if (error) throw error;
        if (data?.ocr_data) {
          const ocr = data.ocr_data as Record<string, unknown>;
          setBillData({
            period_consumption: ocr.period_consumption as number | null,
            period_start: ocr.period_start as string | null,
            period_end: ocr.period_end as string | null,
            annual_consumption_projected: ocr.annual_consumption_projected as number | null,
            projection_method: ocr.projection_method as string | null,
            projection_details: ocr.projection_details as BillData['projection_details'],
            supplier: ocr.supplier as string | null,
            pod: ocr.pod as string | null,
            power_kw: ocr.power_kw as number | null,
            price_kwh: ocr.price_kwh as number | null
          });
        }
      } catch (err) {
        console.error('Error loading bill data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBillData();
  }, [user]);
  const handleBillUpload = async (file: File) => {
    await uploadAndAnalyzeBill(file);
    setBillDialogOpen(false);
    window.location.reload();
  };

  // Default price if not available from bill
  const DEFAULT_PRICE_KWH = 0.25;
  const priceKwh = billData?.price_kwh || DEFAULT_PRICE_KWH;

  // Generate monthly consumption data based on annual projection and ARERA profile
  const generateMonthlyData = (): MonthData[] => {
    if (!billData?.annual_consumption_projected) return [];
    const annual = billData.annual_consumption_projected;
    const monthsCovered = billData.projection_details?.months_covered || [];
    const currentMonth = new Date().getMonth() + 1;
    return Object.entries(ARERA_PROFILE).map(([month, weight]) => {
      const monthNum = parseInt(month);
      const consumption = Math.round(annual * weight);
      const costoEur = Math.round(consumption * priceKwh * 100) / 100;
      const isCovered = monthsCovered.includes(monthNum);
      const isCurrent = monthNum === currentMonth;
      return {
        mese: MONTH_NAMES[monthNum - 1],
        consumo: consumption,
        costoEur,
        isCovered,
        isCurrent,
        monthNum,
        weight: weight * 100
      };
    });
  };
  const monthlyData = generateMonthlyData();
  const avgMonthly = billData?.annual_consumption_projected ? Math.round(billData.annual_consumption_projected / 12) : 0;
  const avgMonthlyEur = Math.round(avgMonthly * priceKwh * 100) / 100;
  const coveredMonthsCount = monthlyData.filter(m => m.isCovered).length;

  // Format period for display
  const formatPeriod = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short'
    })} - ${endDate.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })}`;
  };
  const getProjectionBadge = (clickable = false) => {
    const baseClasses = clickable ? "cursor-pointer hover:opacity-80 transition-opacity" : "";
    const onClick = clickable ? () => setAreraPopupOpen(true) : undefined;
    switch (billData?.projection_method) {
      case 'historical_complete':
        return <Badge variant="default" className={`bg-green-500/10 text-green-600 border-green-500/20 ${baseClasses}`} onClick={onClick}>
            🟢 Dato reale {clickable && <Info className="h-3 w-3 ml-1" />}
          </Badge>;
      case 'historical_partial':
        return <Badge variant="default" className={`bg-yellow-500/10 text-yellow-600 border-yellow-500/20 ${baseClasses}`} onClick={onClick}>
            🟡 Parziale {clickable && <Info className="h-3 w-3 ml-1" />}
          </Badge>;
      case 'arera_projection':
        return <Badge variant="default" className={`bg-blue-500/10 text-blue-600 border-blue-500/20 ${baseClasses}`} onClick={onClick}>
            🔵 Proiezione ARERA {clickable && <Info className="h-3 w-3 ml-1" />}
          </Badge>;
      default:
        return null;
    }
  };

  // Get selected month data
  const selectedMonthData = selectedMonth ? monthlyData.find(d => d.monthNum === selectedMonth) : null;

  // Show empty state if no bill data
  if (!loading && !billData) {
    return <div className="space-y-6">
        <WipDisclaimer storageKey="karica_wip_dismissed_home" />

        <ScrollReveal>
          <div className="flex items-center gap-4">
            <AnimatedLogo className="h-14 w-14" />
            <div>
              <h2 className="text-3xl font-bold mb-2">Benvenuto su <span className="font-brand">Karica</span></h2>
              <p className="text-muted-foreground">
                Gestisci il tuo consumo energetico in modo intelligente
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <Card className="p-8 text-center space-y-6 border-dashed border-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Inizia caricando la tua bolletta</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Carica una bolletta della luce per popolare la tua dashboard con i dati reali di consumo e ricevere consigli personalizzati per risparmiare.
              </p>
            </div>
            <Button size="lg" onClick={() => setBillDialogOpen(true)} className="gap-2">
              <Upload className="h-5 w-5" />
              Carica la tua bolletta
            </Button>
          </Card>
        </ScrollReveal>

        <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Carica Bolletta</DialogTitle>
            </DialogHeader>
            <BillUpload onUpload={handleBillUpload} onSkip={() => setBillDialogOpen(false)} loading={billLoading} />
          </DialogContent>
        </Dialog>
      </div>;
  }
  return <div className="space-y-6">
      <WipDisclaimer storageKey="karica_wip_dismissed_home" />

      <ScrollReveal>
        <div className="flex items-center gap-4">
          <AnimatedLogo className="h-14 w-14" />
          <div>
            <h2 className="text-3xl mb-2 font-thin">Benvenuto su <span className="font-brand">Karica</span></h2>
            <p className="text-muted-foreground">
              Gestisci il tuo consumo energetico in modo intelligente
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* Supply Card - Real user data */}
      <ScrollReveal delay={75}>
        <SupplyCard onUpdateBill={() => setBillDialogOpen(true)} />
      </ScrollReveal>

      {/* Main KPIs - Monthly first, then Annual as detail */}
      <div className="grid grid-cols-2 gap-4">
        <ScrollReveal delay={100}>
          <Card className="p-4 hover:shadow-elegant transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Spesa Mensile Media</p>
                {billData?.annual_consumption_projected ? <>
                    <p className="text-xl font-bold">
                      ~<AnimatedStat end={avgMonthlyEur} decimals={0} suffix="€" />
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {avgMonthly} kWh/mese
                    </p>
                  </> : <p className="text-sm text-muted-foreground">-</p>}
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <Card className="p-4 hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => setAreraPopupOpen(true)}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Spesa Annua</p>
                {billData?.annual_consumption_projected ? <>
                    <p className="text-xl font-bold">
                      ~<AnimatedStat end={Math.round(billData.annual_consumption_projected * priceKwh)} decimals={0} suffix="€" />
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {billData.annual_consumption_projected.toLocaleString()} kWh
                    </p>
                    <div className="mt-0.5">
                      {getProjectionBadge(false)}
                    </div>
                  </> : <p className="text-sm text-muted-foreground">-</p>}
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <Card className="p-4 hover:shadow-elegant transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Zap className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Potenza</p>
                {billData?.power_kw ? <p className="text-xl font-bold">
                    <AnimatedStat end={billData.power_kw} decimals={1} suffix=" kW" />
                  </p> : <p className="text-sm text-muted-foreground">-</p>}
              </div>
            </div>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={250}>
          <Card className="p-4 hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => navigate('/gamification')}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-glow/10">
                <Award className="h-5 w-5 text-primary-glow" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Punti Karica</p>
                <p className="text-xl font-bold">
                  <AnimatedStat end={0} separator="." />
                </p>
              </div>
            </div>
          </Card>
        </ScrollReveal>
      </div>

      {/* Monthly Consumption Chart - Interactive */}
      {monthlyData.length > 0 && <ScrollReveal delay={300}>
          <CardWithWatermark className="p-6 glass-effect hover-lift" watermarkPosition="bottom-right" watermarkSize="lg" watermarkOpacity={0.04}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold">Consumi Mensili</h3>
              {getProjectionBadge(true)}
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Tocca una barra per i dettagli • Media: ~{avgMonthlyEur.toFixed(0)}€/mese ({avgMonthly} kWh)
            </p>
            
            {/* FOMO Banner - if consumption above Italian average */}
            {billData?.annual_consumption_projected && billData.annual_consumption_projected > ITALIAN_AVERAGE && (
              <div 
                className="mb-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20 cursor-pointer hover:bg-destructive/10 transition-colors"
                onClick={() => navigate('/interventions')}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-destructive flex-shrink-0" />
                  <p className="text-xs text-destructive">
                    <span className="font-semibold">Consumi sopra la media italiana</span>: potresti risparmiare fino a ~€{Math.round((billData.annual_consumption_projected - ITALIAN_AVERAGE) * priceKwh)}/anno
                  </p>
                </div>
              </div>
            )}
            
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} margin={{
            top: 5,
            right: 5,
            left: -10,
            bottom: 5
          }} onClick={data => {
            if (data && data.activePayload) {
              const clickedMonth = data.activePayload[0].payload.monthNum;
              setSelectedMonth(selectedMonth === clickedMonth ? null : clickedMonth);
            }
          }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mese" stroke="hsl(var(--muted-foreground))" style={{
              fontSize: '10px'
            }} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{
              fontSize: '10px'
            }} tickLine={false} axisLine={false} tickFormatter={value => `${value}`} />
                <ReferenceLine 
                  y={Math.round(ITALIAN_AVERAGE / 12)} 
                  stroke="hsl(var(--destructive) / 0.7)" 
                  strokeDasharray="5 3" 
                  strokeWidth={2}
                  label={{ 
                    value: `Media IT: ${Math.round(ITALIAN_AVERAGE / 12)} kWh`, 
                    position: 'right', 
                    fill: 'hsl(var(--destructive) / 0.8)', 
                    fontSize: 10,
                    fontWeight: 500
                  }} 
                />
                <Tooltip cursor={{
              fill: 'hsl(var(--muted) / 0.3)'
            }} content={({
              active,
              payload
            }) => {
              if (!active || !payload?.[0]) return null;
              const data = payload[0].payload as MonthData;
              const italianAvgMonthly = Math.round(ITALIAN_AVERAGE / 12);
              const differenceFromAvg = data.consumo - italianAvgMonthly;
              const isAboveAvg = differenceFromAvg > 0;
              return <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{MONTH_FULL_NAMES[data.monthNum - 1]}</p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${data.isCovered ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground'}`}>
                            {data.isCovered ? '✓ Reale' : '~ Stimato'}
                          </Badge>
                        </div>
                        <p className="text-lg font-bold text-primary">~{data.costoEur.toFixed(0)}€</p>
                        <p className="text-sm text-muted-foreground">{data.consumo.toLocaleString()} kWh</p>
                        <div className="mt-2 pt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">Media italiana: {italianAvgMonthly} kWh</p>
                          {isAboveAvg ? (
                            <p className="text-xs text-destructive font-medium mt-0.5">
                              +{differenceFromAvg} kWh sopra la media 📈
                            </p>
                          ) : (
                            <p className="text-xs text-green-600 font-medium mt-0.5">
                              {Math.abs(differenceFromAvg)} kWh sotto la media ✓
                            </p>
                          )}
                        </div>
                      </div>;
            }} />
                <Bar dataKey="consumo" radius={[4, 4, 0, 0]} cursor="pointer">
                  {monthlyData.map((entry, index) => <Cell key={`cell-${index}`} fill={selectedMonth === entry.monthNum ? 'hsl(var(--primary))' : entry.isCurrent ? 'hsl(var(--primary) / 0.8)' : entry.isCovered ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--muted-foreground) / 0.3)'} stroke={selectedMonth === entry.monthNum ? 'hsl(var(--primary))' : 'none'} strokeWidth={selectedMonth === entry.monthNum ? 2 : 0} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Selected Month Detail */}
            {selectedMonthData && <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-muted-foreground">
                        {selectedMonthData.isCovered ? 'Consumo reale' : 'Consumo stimato'}
                      </p>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${selectedMonthData.isCovered ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground'}`}>
                        {selectedMonthData.isCovered ? '✓ Reale' : '~ Stimato'}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ~{selectedMonthData.costoEur.toFixed(0)}€
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedMonthData.consumo.toLocaleString()} kWh</p>
                    <p className="text-sm font-medium">{MONTH_FULL_NAMES[selectedMonthData.monthNum - 1]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Peso ARERA</p>
                    <p className="text-xl font-bold">{selectedMonthData.weight.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">del consumo annuo</p>
                  </div>
                </div>
              </div>}

            <div className="flex items-center justify-between mt-4">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-primary/80" />
                  <span>Corrente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-primary/50" />
                  <span>Storico ({coveredMonthsCount}/12)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-muted-foreground/30" />
                  <span>Stimato</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-0.5 bg-destructive/50" />
                  <span>Media IT</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setAreraPopupOpen(true)}>
                <Info className="h-3 w-3 mr-1" />
                Dettagli
              </Button>
            </div>
          </CardWithWatermark>
        </ScrollReveal>}

      {/* Quick Actions */}
      <ScrollReveal delay={400}>
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => navigate('/cer')}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Comunità Energetica</p>
                <p className="text-sm font-medium">Scopri la CER →</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-elegant transition-shadow cursor-pointer" onClick={() => navigate('/interventions')}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/10">
                <Zap className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Risparmia</p>
                <p className="text-sm font-medium">Interventi →</p>
              </div>
            </div>
          </Card>
        </div>
      </ScrollReveal>

      {/* Bill Upload Dialog */}
      <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aggiorna Bolletta</DialogTitle>
          </DialogHeader>
          <BillUpload onUpload={handleBillUpload} onSkip={() => setBillDialogOpen(false)} loading={billLoading} />
        </DialogContent>
      </Dialog>

      {/* ARERA Explanation Popup */}
      <AreraExplanationPopup open={areraPopupOpen} onOpenChange={setAreraPopupOpen} annualConsumption={billData?.annual_consumption_projected || null} projectionMethod={billData?.projection_method || null} monthsCovered={billData?.projection_details?.months_covered || []} selectedMonth={selectedMonth} onMonthSelect={setSelectedMonth} priceKwh={priceKwh} />
    </div>;
};
export default Index;