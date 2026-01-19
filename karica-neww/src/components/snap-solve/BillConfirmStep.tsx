import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, Zap, CheckCircle2, AlertCircle, RefreshCw, Edit2, 
  Save, X, Plug, Receipt, Calendar, HelpCircle, TrendingUp
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ConsumptionCalculationPopup } from "./ConsumptionCalculationPopup";

// Projection method types
type ProjectionMethod = 'historical_complete' | 'historical_partial' | 'arera_projection' | 'direct';

interface BillAnalysisData {
  pod: string | null;
  supplier: string | null;
  period_start?: string | null;
  period_end?: string | null;
  period_consumption?: number | null;
  // Annual consumption from bill
  annual_consumption_reported?: number | null;
  annual_period_start?: string | null;
  annual_period_end?: string | null;
  // Legacy field for backward compatibility
  annual_consumption?: number | null;
  annual_consumption_projected?: number | null;
  projection_method?: ProjectionMethod | null;
  projection_details?: {
    months_covered: number[];
    months_projected: number[];
    total_weight: number;
    confidence: 'alta' | 'media' | 'bassa';
    historical_consumption?: number;
    projected_addition?: number;
    arera_profile: Record<number, number>;
  } | null;
  tariff_type?: 'monorario' | 'biorario' | 'triorario' | null;
  power_kw?: number | null;
  customer_code?: string | null;
  price_kwh?: number | null;
}

interface BillConfirmStepProps {
  billAnalysis: BillAnalysisData;
  onConfirm: (updatedData: Partial<BillAnalysisData>) => void;
  onRetake: () => void;
}

const COMMON_SUPPLIERS = [
  "Enel Energia",
  "Eni Plenitude",
  "A2A Energia",
  "Edison",
  "Sorgenia",
  "Illumia",
  "Axpo",
  "Engie",
  "Hera",
  "Iren",
  "E.ON",
  "Wekiwi",
  "Octopus Energy",
  "Altro"
];

export const BillConfirmStep = ({ billAnalysis, onConfirm, onRetake }: BillConfirmStepProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCalculationPopup, setShowCalculationPopup] = useState(false);
  const [editedData, setEditedData] = useState<BillAnalysisData>({
    pod: billAnalysis.pod || '',
    supplier: billAnalysis.supplier || '',
    period_start: billAnalysis.period_start || null,
    period_end: billAnalysis.period_end || null,
    period_consumption: billAnalysis.period_consumption || null,
    annual_consumption_projected: billAnalysis.annual_consumption_projected || billAnalysis.annual_consumption || null,
    tariff_type: billAnalysis.tariff_type || null,
    power_kw: billAnalysis.power_kw || null,
    customer_code: billAnalysis.customer_code || null,
    price_kwh: billAnalysis.price_kwh || null,
  });

  // Get period consumption and annual projection
  const periodConsumption = billAnalysis.period_consumption;
  const annualProjection = billAnalysis.annual_consumption_projected || billAnalysis.annual_consumption;
  const projectionMethod = billAnalysis.projection_method || 'direct';
  const monthsCovered = billAnalysis.projection_details?.months_covered || [];

  const hasMissingCoreData = !billAnalysis.pod || !billAnalysis.supplier || (!periodConsumption && !annualProjection);
  const hasExtendedData = billAnalysis.tariff_type || billAnalysis.power_kw || billAnalysis.customer_code || billAnalysis.price_kwh;

  const formatPeriod = () => {
    if (!billAnalysis.period_start || !billAnalysis.period_end) return null;
    const start = new Date(billAnalysis.period_start);
    const end = new Date(billAnalysis.period_end);
    const startStr = start.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
    const endStr = end.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    // Filter out empty strings, convert them to null
    const cleanedData: Partial<BillAnalysisData> = {
      pod: editedData.pod || null,
      supplier: editedData.supplier || null,
      period_start: editedData.period_start || null,
      period_end: editedData.period_end || null,
      period_consumption: editedData.period_consumption || null,
      annual_consumption_projected: editedData.annual_consumption_projected || null,
      tariff_type: editedData.tariff_type || null,
      power_kw: editedData.power_kw || null,
      customer_code: editedData.customer_code || null,
      price_kwh: editedData.price_kwh || null,
    };
    onConfirm(cleanedData);
  };

  const handleConfirmWithoutEdit = () => {
    onConfirm({});
  };

  const getTariffLabel = (type: string | null | undefined) => {
    switch (type) {
      case 'monorario': return 'Monorario';
      case 'biorario': return 'Biorario (F1/F23)';
      case 'triorario': return 'Triorario (F1/F2/F3)';
      default: return null;
    }
  };

  if (isEditing) {
    return (
      <>
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-primary" />
              Modifica Dati
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pod">POD (Punto di Prelievo)</Label>
              <Input
                id="pod"
                placeholder="IT001E12345678"
                value={editedData.pod || ''}
                onChange={(e) => setEditedData(prev => ({ ...prev, pod: e.target.value.toUpperCase() }))}
                className="font-mono"
                maxLength={15}
              />
              <p className="text-xs text-muted-foreground">14-15 caratteri, inizia con IT</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Fornitore</Label>
              <Select 
                value={COMMON_SUPPLIERS.includes(editedData.supplier || '') ? editedData.supplier || '' : 'Altro'}
                onValueChange={(val) => setEditedData(prev => ({ ...prev, supplier: val === 'Altro' ? '' : val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona fornitore" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_SUPPLIERS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!COMMON_SUPPLIERS.includes(editedData.supplier || '') || editedData.supplier === '') && (
                <Input
                  placeholder="Nome fornitore"
                  value={editedData.supplier || ''}
                  onChange={(e) => setEditedData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="mt-2"
                />
              )}
            </div>

            {/* Period dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="period_start">Inizio Periodo</Label>
                <Input
                  id="period_start"
                  type="date"
                  value={editedData.period_start || ''}
                  onChange={(e) => setEditedData(prev => ({ ...prev, period_start: e.target.value || null }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="period_end">Fine Periodo</Label>
                <Input
                  id="period_end"
                  type="date"
                  value={editedData.period_end || ''}
                  onChange={(e) => setEditedData(prev => ({ ...prev, period_end: e.target.value || null }))}
                />
              </div>
            </div>

            {/* Period consumption */}
            <div className="space-y-2">
              <Label htmlFor="period_consumption">Consumo del Periodo (kWh)</Label>
              <Input
                id="period_consumption"
                type="number"
                placeholder="178"
                value={editedData.period_consumption || ''}
                onChange={(e) => setEditedData(prev => ({ 
                  ...prev, 
                  period_consumption: e.target.value ? parseInt(e.target.value) : null 
                }))}
              />
              <p className="text-xs text-muted-foreground">Consumo fatturato nel periodo indicato</p>
            </div>

            {/* Annual projection (read-only info) */}
            <div className="space-y-2">
              <Label htmlFor="annual_projection">Proiezione Annuale (kWh/anno)</Label>
              <Input
                id="annual_projection"
                type="number"
                placeholder="1780"
                value={editedData.annual_consumption_projected || ''}
                onChange={(e) => setEditedData(prev => ({ 
                  ...prev, 
                  annual_consumption_projected: e.target.value ? parseInt(e.target.value) : null 
                }))}
              />
              <p className="text-xs text-muted-foreground">Calcolata automaticamente con profilo ARERA</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo Tariffa</Label>
                <Select 
                  value={editedData.tariff_type || 'none'}
                  onValueChange={(val) => setEditedData(prev => ({ 
                    ...prev, 
                    tariff_type: val === 'none' ? null : val as 'monorario' | 'biorario' | 'triorario'
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Non specificato</SelectItem>
                    <SelectItem value="monorario">Monorario</SelectItem>
                    <SelectItem value="biorario">Biorario</SelectItem>
                    <SelectItem value="triorario">Triorario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="power">Potenza (kW)</Label>
                <Input
                  id="power"
                  type="number"
                  step="0.1"
                  placeholder="3.0"
                  value={editedData.power_kw || ''}
                  onChange={(e) => setEditedData(prev => ({ 
                    ...prev, 
                    power_kw: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerCode">Codice Cliente</Label>
                <Input
                  id="customerCode"
                  placeholder="123456789"
                  value={editedData.customer_code || ''}
                  onChange={(e) => setEditedData(prev => ({ ...prev, customer_code: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Prezzo €/kWh</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.001"
                  placeholder="0.250"
                  value={editedData.price_kwh || ''}
                  onChange={(e) => setEditedData(prev => ({ 
                    ...prev, 
                    price_kwh: e.target.value ? parseFloat(e.target.value) : null 
                  }))}
                />
              </div>
            </div>
          </div>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Annulla
          </Button>
          <Button onClick={handleSaveEdit} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Salva e Continua
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg">Dati Bolletta</h3>
            <p className="text-sm text-muted-foreground">Informazioni estratte</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-4 w-4 mr-1" />
            Modifica
          </Button>
        </div>

        {/* Core Data */}
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">POD</span>
            </div>
            <span className="font-mono font-medium text-sm">
              {billAnalysis.pod || <span className="text-muted-foreground italic">Non rilevato</span>}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Fornitore</span>
            </div>
            <span className="font-medium text-sm">
              {billAnalysis.supplier || <span className="text-muted-foreground italic">Non rilevato</span>}
            </span>
          </div>
          
          {/* Period Consumption - NEW */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Consumo Periodo</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-lg">
                  {periodConsumption 
                    ? `${periodConsumption.toLocaleString()} kWh` 
                    : <span className="text-muted-foreground italic text-sm">Non rilevato</span>}
                </span>
              </div>
            </div>
            {formatPeriod() && (
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {formatPeriod()}
              </p>
            )}
          </div>

          {/* Annual Projection - NEW with "Come è calcolato?" button */}
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Proiezione Annuale</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => setShowCalculationPopup(true)}
              >
                <HelpCircle className="h-3.5 w-3.5 mr-1" />
                Come è calcolato?
              </Button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                ~{annualProjection?.toLocaleString() || '—'}
              </span>
              <span className="text-sm text-muted-foreground">kWh/anno</span>
            </div>
            {/* Projection method badge */}
            {projectionMethod === 'historical_complete' && (
              <Badge variant="default" className="mt-2 text-xs bg-green-600">
                🟢 Dato reale
              </Badge>
            )}
            {projectionMethod === 'historical_partial' && (
              <Badge variant="secondary" className="mt-2 text-xs bg-amber-500 text-white">
                🟡 Parzialmente proiettato
              </Badge>
            )}
            {projectionMethod === 'arera_projection' && (
              <Badge variant="secondary" className="mt-2 text-xs">
                🔵 Proiezione ARERA
              </Badge>
            )}
            {projectionMethod === 'direct' && (
              <Badge variant="outline" className="mt-2 text-xs">
                Stima semplice (×12)
              </Badge>
            )}
          </div>
        </div>

        {/* Extended Data - only show if any present */}
        {hasExtendedData && (
          <div className="pt-3 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Dettagli aggiuntivi</p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              {billAnalysis.tariff_type && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Tariffa:</span>
                  <Badge variant="outline" className="text-xs">
                    {getTariffLabel(billAnalysis.tariff_type)}
                  </Badge>
                </div>
              )}
              
              {billAnalysis.power_kw && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <Plug className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Potenza:</span>
                  <strong>{billAnalysis.power_kw} kW</strong>
                </div>
              )}
              
              {billAnalysis.customer_code && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Cod. Cliente:</span>
                  <span className="font-mono text-xs">{billAnalysis.customer_code}</span>
                </div>
              )}
              
              {billAnalysis.price_kwh && (
                <div className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                  <Zap className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">Prezzo:</span>
                  <strong>€{billAnalysis.price_kwh.toFixed(3)}/kWh</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {hasMissingCoreData && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs">
              Alcuni dati non sono stati rilevati. Puoi modificarli manualmente o rifare la foto.
            </p>
          </div>
        )}
      </Card>

      <p className="text-sm text-center text-muted-foreground">
        I dati sono corretti? Puoi modificarli o rifare la foto.
      </p>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onRetake}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Rifai Foto
        </Button>
        <Button className="flex-1" onClick={handleConfirmWithoutEdit}>
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Confermo
        </Button>
      </div>

      {/* Calculation Popup */}
      <ConsumptionCalculationPopup
        open={showCalculationPopup}
        onOpenChange={setShowCalculationPopup}
        periodStart={billAnalysis.annual_period_start || billAnalysis.period_start || null}
        periodEnd={billAnalysis.annual_period_end || billAnalysis.period_end || null}
        periodConsumption={periodConsumption || null}
        annualProjection={annualProjection || null}
        projectionMethod={projectionMethod}
        monthsCovered={monthsCovered}
        monthsProjected={billAnalysis.projection_details?.months_projected || []}
        historicalConsumption={billAnalysis.projection_details?.historical_consumption || null}
        projectedAddition={billAnalysis.projection_details?.projected_addition || null}
        confidence={billAnalysis.projection_details?.confidence || null}
      />
    </>
  );
};
