import React from 'react';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TrendingDown, Zap } from "lucide-react";

interface ConsumptionChartProps {
  currentConsumption: number; // in kWh/year
  yearlySavings: number; // in EUR/year
  energyClass: string | null;
}

export const ConsumptionChart = ({ 
  currentConsumption, 
  yearlySavings,
  energyClass 
}: ConsumptionChartProps) => {
  // Estimate consumption after interventions (assume savings correlate to ~15-25% reduction)
  const savingsPercentage = Math.min(0.30, yearlySavings / (currentConsumption * 0.25));
  const afterConsumption = Math.round(currentConsumption * (1 - savingsPercentage));
  const monthlySavings = Math.round(yearlySavings / 12);
  
  const data = [
    {
      name: 'Attuale',
      consumption: currentConsumption,
      fill: 'hsl(var(--destructive))',
    },
    {
      name: 'Dopo interventi',
      consumption: afterConsumption,
      fill: 'hsl(var(--secondary))',
    },
  ];

  const reduction = currentConsumption - afterConsumption;
  const reductionPercentage = Math.round((reduction / currentConsumption) * 100);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Confronto Consumi</h3>
        </div>
        {reductionPercentage > 0 && (
          <div className="flex items-center gap-1 text-secondary text-sm font-medium">
            <TrendingDown className="h-4 w-4" />
            -{reductionPercentage}%
          </div>
        )}
      </div>
      
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical"
            margin={{ top: 10, right: 60, left: 10, bottom: 10 }}
          >
            <XAxis 
              type="number" 
              hide 
              domain={[0, currentConsumption * 1.1]} 
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              width={90}
            />
            <Bar 
              dataKey="consumption" 
              radius={[0, 8, 8, 0]}
              barSize={32}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
              <LabelList 
                dataKey="consumption" 
                position="right" 
                formatter={(value: number) => `${value.toLocaleString()} kWh`}
                style={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly savings highlight */}
      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Risparmio mensile stimato</p>
          <p className="text-2xl font-bold text-secondary">
            €{monthlySavings}<span className="text-sm font-normal text-muted-foreground">/mese</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Riduzione consumi</p>
          <p className="text-lg font-semibold text-foreground">
            -{reduction.toLocaleString()} kWh/anno
          </p>
        </div>
      </div>
    </Card>
  );
};
