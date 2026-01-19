import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, BarChart3, Home, Zap, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, ReferenceLine } from 'recharts';

// ARERA profile for domestic residential clients (3 kW)
const ARERA_PROFILE: Record<number, number> = {
  1: 0.092,  // Gennaio
  2: 0.085,  // Febbraio
  3: 0.080,  // Marzo
  4: 0.072,  // Aprile
  5: 0.070,  // Maggio
  6: 0.083,  // Giugno
  7: 0.095,  // Luglio
  8: 0.088,  // Agosto
  9: 0.078,  // Settembre
  10: 0.075, // Ottobre
  11: 0.082, // Novembre
  12: 0.100, // Dicembre
};

const MONTH_LABELS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
const MONTH_NAMES = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

// Italian average consumption by household size (kWh/year) - ARERA data 2023
const ITALIAN_AVERAGE_BY_SIZE = {
  single: 1800,      // 1 persona
  couple: 2400,      // 2 persone  
  family_small: 2800, // 3 persone
  family: 3200,      // 4+ persone
  average: 2700,     // Media nazionale
};

interface MonthDetailData {
  month: string;
  monthNum: number;
  consumption: number;
  costEur: number;
  weight: number;
  isCovered: boolean;
  isCurrent: boolean;
}

interface AreraExplanationPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  annualConsumption: number | null;
  projectionMethod: string | null;
  monthsCovered?: number[];
  selectedMonth?: number | null;
  onMonthSelect?: (month: number | null) => void;
  priceKwh?: number;
}

export const AreraExplanationPopup = ({
  open,
  onOpenChange,
  annualConsumption,
  projectionMethod,
  monthsCovered = [],
  selectedMonth,
  onMonthSelect,
  priceKwh = 0.25
}: AreraExplanationPopupProps) => {
  const currentMonth = new Date().getMonth() + 1;
  const coveredMonthsCount = monthsCovered.length;
  
  // Generate chart data with consumption values
  const chartData: MonthDetailData[] = Object.entries(ARERA_PROFILE).map(([month, weight]) => {
    const monthNum = parseInt(month);
    const consumption = Math.round((annualConsumption || 0) * weight);
    const costEur = Math.round(consumption * priceKwh * 100) / 100;
    return {
      month: MONTH_LABELS[monthNum - 1],
      monthNum,
      consumption,
      costEur,
      weight: weight * 100,
      isCovered: monthsCovered.includes(monthNum),
      isCurrent: monthNum === currentMonth,
    };
  });

  // Average monthly consumption
  const avgMonthly = annualConsumption ? Math.round(annualConsumption / 12) : 0;
  const avgMonthlyEur = Math.round(avgMonthly * priceKwh * 100) / 100;
  const annualCostEur = annualConsumption ? Math.round(annualConsumption * priceKwh) : 0;
  
  // Comparison with Italian average
  const italianAvg = ITALIAN_AVERAGE_BY_SIZE.average;
  const italianAvgCost = Math.round(italianAvg * priceKwh);
  const difference = annualConsumption ? annualConsumption - italianAvg : 0;
  const percentDiff = annualConsumption ? Math.round((difference / italianAvg) * 100) : 0;

  const getComparisonColor = () => {
    if (percentDiff < -10) return 'text-green-600';
    if (percentDiff > 10) return 'text-red-500';
    return 'text-amber-500';
  };

  const getComparisonIcon = () => {
    if (percentDiff < -5) return <TrendingDown className="h-5 w-5" />;
    if (percentDiff > 5) return <TrendingUp className="h-5 w-5" />;
    return <Minus className="h-5 w-5" />;
  };

  const getComparisonText = () => {
    if (percentDiff < -10) return 'Ottimo! Consumi meno della media italiana.';
    if (percentDiff < 0) return 'Bene! Sei leggermente sotto la media italiana.';
    if (percentDiff < 10) return 'In linea con la media italiana.';
    if (percentDiff < 25) return 'Consumi un po\' più della media italiana.';
    return 'Consumi significativamente più della media italiana.';
  };

  const selectedMonthData = selectedMonth ? chartData.find(d => d.monthNum === selectedMonth) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            I tuoi consumi in dettaglio
          </SheetTitle>
          <SheetDescription>
            {projectionMethod === 'historical_complete' && 'Basato sui dati reali della tua bolletta'}
            {projectionMethod === 'historical_partial' && 'Dati storici con proiezione ARERA'}
            {projectionMethod === 'arera_projection' && 'Proiezione basata sul profilo ARERA'}
            {!projectionMethod && 'Analisi del tuo consumo energetico'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 pb-6">
          
          {/* What is ARERA */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800">
                <Info className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">Cos'è il profilo ARERA?</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  L'<strong>ARERA</strong> (Autorità per l'Energia) definisce quanto si consuma tipicamente ogni mese dell'anno. 
                  Ad esempio, a <strong>Dicembre</strong> si consuma il <strong>10%</strong> del totale annuo (luci accese più a lungo), 
                  mentre a <strong>Maggio</strong> solo il <strong>7%</strong>.
                </p>
              </div>
            </div>
          </Card>

          {/* Interactive Monthly Chart */}
          <Card className="p-4">
            <h4 className="font-semibold mb-2">Tocca una barra per i dettagli</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Spesa mensile media: ~{avgMonthlyEur.toFixed(0)}€ ({avgMonthly.toLocaleString()} kWh) • {coveredMonthsCount}/12 mesi reali
            </p>
            
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData} 
                  margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                  onClick={(data) => {
                    if (data && data.activePayload) {
                      const clickedMonth = data.activePayload[0].payload.monthNum;
                      onMonthSelect?.(selectedMonth === clickedMonth ? null : clickedMonth);
                    }
                  }}
                >
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis hide />
                  <ReferenceLine 
                    y={avgMonthly} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="3 3"
                    label={{ value: 'Media', position: 'right', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const data = payload[0].payload as MonthDetailData;
                      return (
                        <div className="bg-card border rounded-lg p-3 shadow-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{MONTH_NAMES[data.monthNum - 1]}</p>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] px-1.5 py-0 ${data.isCovered ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground'}`}
                            >
                              {data.isCovered ? '✓ Reale' : '~ Stimato'}
                            </Badge>
                          </div>
                          <p className="text-lg font-bold text-primary">~{data.costEur.toFixed(0)}€</p>
                          <p className="text-sm text-muted-foreground">{data.consumption.toLocaleString()} kWh</p>
                          <p className="text-xs text-muted-foreground">Peso ARERA: {data.weight.toFixed(1)}%</p>
                        </div>
                      );
                    }}
                  />
                  <Bar 
                    dataKey="consumption" 
                    radius={[4, 4, 0, 0]}
                    cursor="pointer"
                  >
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={
                          selectedMonth === entry.monthNum
                            ? 'hsl(var(--primary))'
                            : entry.isCurrent 
                              ? 'hsl(var(--primary) / 0.8)' 
                              : entry.isCovered 
                                ? 'hsl(var(--primary) / 0.5)' 
                                : 'hsl(var(--muted-foreground) / 0.3)'
                        }
                        stroke={selectedMonth === entry.monthNum ? 'hsl(var(--primary))' : 'none'}
                        strokeWidth={selectedMonth === entry.monthNum ? 2 : 0}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Selected month detail */}
            {selectedMonthData && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm text-muted-foreground">
                        {selectedMonthData.isCovered ? 'Consumo reale' : 'Consumo stimato'}
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${selectedMonthData.isCovered ? 'bg-green-500/10 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground'}`}
                      >
                        {selectedMonthData.isCovered ? '✓ Reale' : '~ Stimato'}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ~{selectedMonthData.costEur.toFixed(0)}€
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedMonthData.consumption.toLocaleString()} kWh</p>
                    <p className="text-sm font-medium">{MONTH_NAMES[selectedMonthData.monthNum - 1]}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Peso ARERA</p>
                    <p className="text-xl font-bold">{selectedMonthData.weight.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">del consumo annuo</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary/80" />
                <span>Mese corrente</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary/50" />
                <span>Dati reali ({coveredMonthsCount}/12)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-muted-foreground/30" />
                <span>Stimato</span>
              </div>
            </div>
          </Card>

          {/* Comparison with Italian Average */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-semibold">Confronto con la media italiana</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Tu spendi</p>
                <p className="text-xl font-bold text-primary">
                  ~{annualCostEur.toLocaleString()}€
                </p>
                <p className="text-xs text-muted-foreground">{annualConsumption?.toLocaleString() || '-'} kWh/anno</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Media italiana</p>
                <p className="text-xl font-bold">
                  ~{italianAvgCost.toLocaleString()}€
                </p>
                <p className="text-xs text-muted-foreground">{italianAvg.toLocaleString()} kWh/anno</p>
              </div>
            </div>

            {annualConsumption && (
              <div className={`p-4 rounded-lg ${percentDiff < 0 ? 'bg-green-50 dark:bg-green-900/20' : percentDiff > 15 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${percentDiff < 0 ? 'bg-green-100 dark:bg-green-800' : percentDiff > 15 ? 'bg-red-100 dark:bg-red-800' : 'bg-amber-100 dark:bg-amber-800'}`}>
                    <span className={getComparisonColor()}>{getComparisonIcon()}</span>
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${getComparisonColor()}`}>
                      {percentDiff > 0 ? '+' : ''}{percentDiff}% rispetto alla media
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getComparisonText()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Italian Average by Household */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3">Media consumi per tipo di famiglia</h4>
            <div className="space-y-2">
              {[
                { label: '1 persona', value: ITALIAN_AVERAGE_BY_SIZE.single },
                { label: '2 persone', value: ITALIAN_AVERAGE_BY_SIZE.couple },
                { label: '3 persone', value: ITALIAN_AVERAGE_BY_SIZE.family_small },
                { label: '4+ persone', value: ITALIAN_AVERAGE_BY_SIZE.family },
              ].map((item) => {
                const isClosest = annualConsumption && Math.abs(annualConsumption - item.value) < 300;
                const itemCost = Math.round(item.value * priceKwh);
                return (
                  <div 
                    key={item.label} 
                    className={`flex items-center justify-between p-2 rounded-lg ${isClosest ? 'bg-primary/10 border border-primary/20' : ''}`}
                  >
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">~{itemCost}€/anno</span>
                      <span className="text-xs text-muted-foreground">({item.value.toLocaleString()} kWh)</span>
                      {isClosest && <Badge variant="secondary" className="text-xs">≈ Tu</Badge>}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Fonte: ARERA - Dati 2023 per utenze domestiche residenti con potenza 3 kW
            </p>
          </Card>

          {/* Summary Card */}
          <Card className="p-4 bg-primary text-primary-foreground">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6" />
              <div>
                <p className="text-sm opacity-90">La tua spesa annua stimata</p>
                <p className="text-2xl font-bold">
                  ~{annualCostEur.toLocaleString()}€/anno
                </p>
                <p className="text-xs opacity-75">{annualConsumption?.toLocaleString() || '-'} kWh</p>
              </div>
            </div>
          </Card>

        </div>
      </SheetContent>
    </Sheet>
  );
};
