import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Info, Calculator, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

// Profilo ARERA standard per clienti domestici residenti (3 kW)
const ARERA_PROFILE: Record<number, number> = {
  1: 0.092,  // Gennaio 9.2%
  2: 0.085,  // Febbraio 8.5%
  3: 0.080,  // Marzo 8.0%
  4: 0.072,  // Aprile 7.2%
  5: 0.070,  // Maggio 7.0%
  6: 0.083,  // Giugno 8.3%
  7: 0.095,  // Luglio 9.5%
  8: 0.088,  // Agosto 8.8%
  9: 0.078,  // Settembre 7.8%
  10: 0.075, // Ottobre 7.5%
  11: 0.082, // Novembre 8.2%
  12: 0.100  // Dicembre 10.0%
};

const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

// Projection method types
type ProjectionMethod = 'historical_complete' | 'historical_partial' | 'arera_projection' | 'direct';

interface ConsumptionCalculationPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  periodStart: string | null;
  periodEnd: string | null;
  periodConsumption: number | null;
  annualProjection: number | null;
  projectionMethod: ProjectionMethod | null;
  monthsCovered?: number[];
  monthsProjected?: number[];
  historicalConsumption?: number | null;
  projectedAddition?: number | null;
  confidence?: 'alta' | 'media' | 'bassa' | null;
}

export const ConsumptionCalculationPopup = ({
  open,
  onOpenChange,
  periodStart,
  periodEnd,
  periodConsumption,
  annualProjection,
  projectionMethod,
  monthsCovered = [],
  monthsProjected = [],
  historicalConsumption,
  projectedAddition,
  confidence
}: ConsumptionCalculationPopupProps) => {
  
  // Prepare chart data
  const chartData = Object.entries(ARERA_PROFILE).map(([month, weight]) => ({
    month: MONTH_LABELS[parseInt(month) - 1],
    monthNum: parseInt(month),
    weight: weight * 100,
    isCovered: monthsCovered.includes(parseInt(month)),
    isProjected: monthsProjected.includes(parseInt(month))
  }));

  // Calculate total weight of covered months
  const totalWeight = monthsCovered.reduce((sum, m) => sum + ARERA_PROFILE[m], 0);
  const normalizationFactor = totalWeight > 0 ? 1 / totalWeight : 0;

  // Format period string
  const formatPeriod = () => {
    if (!periodStart || !periodEnd) return 'Periodo non disponibile';
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const startStr = start.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    const endStr = end.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  // Get covered months names
  const getCoveredMonthsText = () => {
    if (monthsCovered.length === 0) return '';
    if (monthsCovered.length === 1) return MONTH_NAMES[monthsCovered[0] - 1];
    if (monthsCovered.length > 4) return `${monthsCovered.length} mesi`;
    return monthsCovered.map(m => MONTH_NAMES[m - 1]).join(', ');
  };

  // Get projected months names
  const getProjectedMonthsText = () => {
    if (monthsProjected.length === 0) return '';
    if (monthsProjected.length === 1) return MONTH_NAMES[monthsProjected[0] - 1];
    return monthsProjected.map(m => MONTH_NAMES[m - 1]).join(', ');
  };

  // Get confidence badge color
  const getConfidenceBadge = () => {
    switch (confidence) {
      case 'alta': return { color: 'bg-green-600', text: 'Alta affidabilità' };
      case 'media': return { color: 'bg-amber-500', text: 'Media affidabilità' };
      case 'bassa': return { color: 'bg-red-500', text: 'Bassa affidabilità' };
      default: return null;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Come calcoliamo il consumo annuo?
          </SheetTitle>
          <SheetDescription>
            {projectionMethod === 'historical_complete' && 'Dato reale estratto dalla bolletta'}
            {projectionMethod === 'historical_partial' && 'Dato storico con proiezione ARERA per mesi mancanti'}
            {projectionMethod === 'arera_projection' && 'Proiezione basata sul profilo ARERA per clienti domestici'}
            {projectionMethod === 'direct' && 'Stima semplice (moltiplicazione ×12)'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          
          {/* CASE 1: Historical Complete */}
          {projectionMethod === 'historical_complete' && (
            <>
              <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-800">
                    <span className="text-lg font-bold text-green-600">✓</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1 text-green-800 dark:text-green-200">Dato reale dalla tua bolletta</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      La tua bolletta riporta già il consumo degli ultimi 12 mesi. 
                      Non è necessaria nessuna proiezione!
                    </p>
                    <div className="mt-3 p-3 bg-white dark:bg-green-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Consumo annuo storico</p>
                      <p className="text-2xl font-bold text-green-600">
                        {historicalConsumption?.toLocaleString() || annualProjection?.toLocaleString()} kWh/anno
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Monthly Distribution Chart */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Distribuzione mensile stimata</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Ecco come si distribuisce il consumo annuo di <strong>{annualProjection?.toLocaleString()} kWh</strong> sui 12 mesi, 
                  basandoci sul profilo ARERA per clienti domestici.
                </p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={chartData.map(d => ({
                        ...d,
                        consumo: Math.round((annualProjection || 0) * ARERA_PROFILE[d.monthNum])
                      }))} 
                      margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                    >
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toLocaleString()} kWh`, 'Consumo stimato']}
                        labelFormatter={(label) => {
                          const item = chartData.find(d => d.month === label);
                          return MONTH_NAMES[item ? item.monthNum - 1 : 0];
                        }}
                      />
                      <Bar dataKey="consumo" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.isCovered ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.4)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-primary"></div>
                    <span>Mesi coperti dalla bolletta</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-primary text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6" />
                    <div>
                      <p className="text-sm opacity-90">Consumo annuo reale</p>
                      <p className="text-2xl font-bold">
                        {annualProjection?.toLocaleString()} kWh/anno
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-500 text-white">
                    🟢 Reale
                  </Badge>
                </div>
              </Card>
            </>
          )}

          {/* CASE 2: Historical Partial */}
          {projectionMethod === 'historical_partial' && (
            <>
              <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-800">
                    <span className="text-lg font-bold text-amber-600">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Consumo storico dalla bolletta</h4>
                    <p className="text-sm text-muted-foreground">
                      La tua bolletta riporta il consumo di <strong>{monthsCovered.length} mesi</strong> su 12.
                    </p>
                    <div className="mt-3 p-3 bg-white dark:bg-amber-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Consumo {monthsCovered.length} mesi</p>
                      <p className="text-2xl font-bold text-amber-600">
                        {historicalConsumption?.toLocaleString()} kWh
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatPeriod()}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Mesi mancanti proiettati</h4>
                    <p className="text-sm text-muted-foreground">
                      Abbiamo stimato il consumo per: <Badge variant="outline">{getProjectedMonthsText()}</Badge>
                    </p>
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-xs text-muted-foreground">Consumo stimato mesi mancanti</p>
                      <p className="text-xl font-bold text-blue-600">
                        +{projectedAddition?.toLocaleString()} kWh
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Chart for partial */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Distribuzione mensile</h4>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, 12]} />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Peso ARERA']}
                        labelFormatter={(label) => {
                          const item = chartData.find(d => d.month === label);
                          return MONTH_NAMES[item ? item.monthNum - 1 : 0];
                        }}
                      />
                      <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.isCovered ? 'hsl(var(--primary))' : entry.isProjected ? 'hsl(45 93% 47%)' : 'hsl(var(--muted-foreground) / 0.3)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-primary"></div>
                    <span>Dati reali ({monthsCovered.length} mesi)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-amber-500"></div>
                    <span>Proiettati ({monthsProjected.length} mesi)</span>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-primary text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6" />
                    <div>
                      <p className="text-sm opacity-90">Consumo annuo stimato</p>
                      <p className="text-2xl font-bold">
                        ~{annualProjection?.toLocaleString()} kWh/anno
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500 text-white">
                    🟡 Parziale
                  </Badge>
                </div>
              </Card>
            </>
          )}

          {/* CASE 3: ARERA Projection */}
          {projectionMethod === 'arera_projection' && (
            <>
              {/* Step 1: Consumo estratto */}
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Consumo estratto dalla bolletta</h4>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">
                        {periodConsumption?.toLocaleString() || '—'}
                      </span>
                      <span className="text-lg text-muted-foreground">kWh</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{formatPeriod()}</p>
                  </div>
                </div>
              </Card>

              {/* Step 2: Spiegazione profilo ARERA */}
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Perché non moltiplichiamo ×12?</h4>
                    <p className="text-sm text-muted-foreground">
                      I consumi elettrici non sono uguali ogni mese: d'inverno si consuma di più 
                      (luci accese più a lungo), d'estate meno (ma con picchi per l'aria condizionata).
                    </p>
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <Info className="h-4 w-4" />
                        <span className="text-sm font-medium">Profilo ARERA</span>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                        L'ARERA (Autorità per l'Energia) definisce quanto "pesa" ogni mese sul consumo annuo totale.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Step 3: Grafico */}
              <Card className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Distribuzione mensile ARERA</h4>
                    {monthsCovered.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Il tuo periodo copre: <Badge variant="secondary">{getCoveredMonthsText()}</Badge>
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={[0, 12]} />
                      <Tooltip 
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Peso ARERA']}
                        labelFormatter={(label) => {
                          const item = chartData.find(d => d.month === label);
                          return MONTH_NAMES[item ? item.monthNum - 1 : 0];
                        }}
                      />
                      <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`}
                            fill={entry.isCovered ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-primary"></div>
                    <span>Il tuo periodo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-muted-foreground/30"></div>
                    <span>Altri mesi</span>
                  </div>
                </div>
              </Card>

              {/* Step 4: Calcolo */}
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <span className="text-lg font-bold text-primary">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-3">Il calcolo</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-background rounded">
                          <p className="text-muted-foreground text-xs">Peso mese/i</p>
                          <p className="font-mono font-semibold">{(totalWeight * 100).toFixed(1)}%</p>
                        </div>
                        <div className="p-2 bg-background rounded">
                          <p className="text-muted-foreground text-xs">Fattore normalizzazione</p>
                          <p className="font-mono font-semibold">{normalizationFactor.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-background rounded-lg border">
                        <p className="text-xs text-muted-foreground mb-2">Formula:</p>
                        <p className="font-mono text-sm text-center">
                          {periodConsumption?.toLocaleString()} kWh ÷ {(totalWeight * 100).toFixed(1)}% = <strong>{annualProjection?.toLocaleString()} kWh/anno</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-primary text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6" />
                    <div>
                      <p className="text-sm opacity-90">Proiezione annuale</p>
                      <p className="text-2xl font-bold">~{annualProjection?.toLocaleString()} kWh/anno</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-primary-foreground/20">
                    🔵 ARERA
                  </Badge>
                </div>
              </Card>

              {/* Comparison note */}
              {periodConsumption && (
                <div className="text-xs text-muted-foreground p-3 border rounded-lg">
                  <p className="flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    <strong>Perché è diverso da ×12?</strong>
                  </p>
                  <p className="mt-1">
                    Una moltiplicazione semplice ({periodConsumption} × 12 = {(periodConsumption * 12).toLocaleString()} kWh) 
                    non tiene conto della stagionalità. {getCoveredMonthsText()} {monthsCovered.length === 1 ? 'pesa' : 'pesano'} il {(totalWeight * 100).toFixed(1)}% 
                    del consumo annuo.
                  </p>
                </div>
              )}
            </>
          )}

          {/* CASE 4: Direct fallback */}
          {projectionMethod === 'direct' && (
            <>
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-muted">
                    <Info className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Stima semplificata</h4>
                    <p className="text-sm text-muted-foreground">
                      Non avendo le date precise del periodo di fatturazione, abbiamo usato 
                      una stima semplice moltiplicando il consumo estratto per 12 mesi.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-2">Formula:</p>
                  <p className="font-mono text-sm text-center">
                    {periodConsumption?.toLocaleString()} kWh × 12 = <strong>{annualProjection?.toLocaleString()} kWh/anno</strong>
                  </p>
                </div>
              </Card>

              <Card className="p-4 bg-primary text-primary-foreground">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-6 w-6" />
                    <div>
                      <p className="text-sm opacity-90">Stima annuale</p>
                      <p className="text-2xl font-bold">~{annualProjection?.toLocaleString()} kWh/anno</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-primary-foreground/20 text-primary-foreground">
                    ×12
                  </Badge>
                </div>
              </Card>

              <div className="text-xs text-amber-600 p-3 border border-amber-200 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <p className="flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  <strong>Nota:</strong>
                </p>
                <p className="mt-1">
                  Questa stima potrebbe essere imprecisa. Per un calcolo più accurato, 
                  modifica i dati e inserisci le date del periodo di fatturazione.
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
