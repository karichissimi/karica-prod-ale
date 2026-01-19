import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator, Database, ShieldCheck, TrendingUp } from "lucide-react";

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

interface CalculationDetailsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  details: CalculationDetails | null;
  extraCostYearly: number;
  energyClass: string | null;
}

export const CalculationDetailsPopup = ({
  open,
  onOpenChange,
  details,
  extraCostYearly,
  energyClass,
}: CalculationDetailsPopupProps) => {
  const confidencePercent = details?.confidence_factors?.overall 
    ? Math.round(details.confidence_factors.overall * 100) 
    : 50;

  const getConfidenceColor = (level: number) => {
    if (level >= 0.7) return 'text-secondary';
    if (level >= 0.5) return 'text-primary';
    return 'text-muted-foreground';
  };

  const getConfidenceLabel = (level: number) => {
    if (level >= 0.7) return 'Alta';
    if (level >= 0.5) return 'Media';
    return 'Bassa';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Come abbiamo calcolato
          </DialogTitle>
          <DialogDescription>
            Trasparenza sui metodi e fonti dei dati
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main result summary */}
          <Card className="p-4 bg-destructive/5 border-destructive/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Costo extra stimato</p>
                <p className="text-2xl font-bold text-destructive">€{Math.round(extraCostYearly)}/anno</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Rispetto a</p>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                  Classe A
                </Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              La tua classe stimata: <span className="font-semibold">{energyClass || '?'}</span>
            </p>
          </Card>

          {/* Confidence level */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">Livello di confidenza</p>
                <p className="text-sm text-muted-foreground">Quanto siamo sicuri dei dati</p>
              </div>
              <Badge 
                variant="outline" 
                className={getConfidenceColor(details?.confidence_factors?.overall || 0.5)}
              >
                {confidencePercent}% - {getConfidenceLabel(details?.confidence_factors?.overall || 0.5)}
              </Badge>
            </div>
            
            {details?.confidence_factors && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dati bolletta</span>
                  <span className={getConfidenceColor(details.confidence_factors.bill)}>
                    {Math.round(details.confidence_factors.bill * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dati impianto</span>
                  <span className={getConfidenceColor(details.confidence_factors.heating)}>
                    {Math.round(details.confidence_factors.heating * 100)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dati edificio</span>
                  <span className={getConfidenceColor(details.confidence_factors.building)}>
                    {Math.round(details.confidence_factors.building * 100)}%
                  </span>
                </div>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
              💡 Più dati fornisci, più accurata sarà la stima
            </p>
          </Card>

          {/* Energy prices */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Prezzi energia utilizzati</p>
                <p className="text-xs text-muted-foreground">
                  {details?.energy_price_source || 'ARERA Mercato Tutelato'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-muted-foreground text-xs">Elettricità</p>
                <p className="font-medium">€{details?.electricity_price_kwh?.toFixed(3) || '0.320'}/kWh</p>
              </div>
              <div className="p-2 bg-muted/50 rounded">
                <p className="text-muted-foreground text-xs">Gas</p>
                <p className="font-medium">€{details?.gas_price_smc?.toFixed(2) || '1.05'}/Smc</p>
              </div>
            </div>
          </Card>

          {/* Methodology */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Standard di riferimento</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {details?.reference_standard || 'DM 26/06/2015 - Linee guida nazionali per la certificazione energetica degli edifici'}
            </p>
          </Card>

          {/* Methodology explanation */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Info className="h-5 w-5 text-primary" />
              <p className="font-medium">Come funziona il calcolo</p>
            </div>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Analizziamo i tuoi consumi dalla bolletta</li>
              <li>Valutiamo l'efficienza del tuo impianto di riscaldamento</li>
              <li>Consideriamo le caratteristiche del tuo edificio</li>
              <li>Confrontiamo con i consumi medi di una casa in classe A</li>
              <li>Calcoliamo la differenza di costo annuale</li>
            </ol>
          </Card>

          {/* Assumptions if available */}
          {details?.assumptions && details.assumptions.length > 0 && (
            <Card className="p-4 bg-muted/50">
              <p className="font-medium text-sm mb-2">Ipotesi utilizzate</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {details.assumptions.map((assumption, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {assumption}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Questa è una stima indicativa. Per un'analisi certificata, 
            consulta un tecnico abilitato.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
