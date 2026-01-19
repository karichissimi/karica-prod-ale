import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Flame, Thermometer, Zap, Calendar, ArrowRight, ArrowLeft } from "lucide-react";
import { triggerHaptic } from "@/hooks/useHapticFeedback";

interface HeatingQuestionnaireProps {
  onComplete: (data: HeatingData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export interface HeatingData {
  device_type: string;
  fuel_type: string;
  estimated_year: number;
  energy_class: string | null;
  brand: string | null;
  model: string | null;
  confidence: number;
}

const currentYear = new Date().getFullYear();

export const HeatingQuestionnaire = ({ onComplete, onBack, isLoading }: HeatingQuestionnaireProps) => {
  const [deviceType, setDeviceType] = useState<string>('');
  const [fuelType, setFuelType] = useState<string>('');
  const [year, setYear] = useState<number>(2010);
  const [questionStep, setQuestionStep] = useState<1 | 2 | 3>(1);

  const deviceOptions = [
    { value: 'caldaia', label: 'Caldaia', icon: Flame },
    { value: 'condizionatore', label: 'Condizionatore/Pompa di calore', icon: Thermometer },
    { value: 'stufa', label: 'Stufa/Camino', icon: Flame },
    { value: 'nessuno', label: 'Non so / Altro', icon: Zap },
  ];

  const fuelOptions = [
    { value: 'gas_metano', label: 'Gas metano' },
    { value: 'gpl', label: 'GPL' },
    { value: 'gasolio', label: 'Gasolio' },
    { value: 'elettrico', label: 'Elettrico' },
    { value: 'pellet', label: 'Pellet/Legna' },
    { value: 'non_so', label: 'Non so' },
  ];

  // Estimate energy class based on year
  const estimateEnergyClass = (installYear: number): string => {
    if (installYear >= 2020) return 'A';
    if (installYear >= 2015) return 'B';
    if (installYear >= 2010) return 'C';
    if (installYear >= 2005) return 'D';
    if (installYear >= 2000) return 'E';
    return 'F';
  };

  const handleComplete = () => {
    const energyClass = estimateEnergyClass(year);
    const data: HeatingData = {
      device_type: deviceType,
      fuel_type: fuelType,
      estimated_year: year,
      energy_class: energyClass,
      brand: null,
      model: null,
      confidence: 0.7, // Lower confidence since it's user-reported
    };
    onComplete(data);
  };

  const canProceedStep1 = deviceType !== '';
  const canProceedStep2 = fuelType !== '';

  return (
    <div className="space-y-4">
      {questionStep === 1 && (
        <>
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Domanda 1 di 3</p>
          </div>
          
          <h4 className="font-medium text-center">Che tipo di impianto hai?</h4>
          
          <RadioGroup 
            value={deviceType} 
            onValueChange={(value) => {
              setDeviceType(value);
              triggerHaptic('selection');
              // Auto-advance on mobile after selection
              setTimeout(() => setQuestionStep(2), 150);
            }}
            className="grid grid-cols-1 gap-3"
          >
            {deviceOptions.map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                  deviceType === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                <option.icon className={`h-5 w-5 ${deviceType === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium">{option.label}</span>
              </Label>
            ))}
          </RadioGroup>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Button 
              className="flex-1" 
              onClick={() => setQuestionStep(2)}
              disabled={!canProceedStep1}
            >
              Avanti
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}

      {questionStep === 2 && (
        <>
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Domanda 2 di 3</p>
          </div>
          
          <h4 className="font-medium text-center">Con cosa funziona?</h4>
          
          <RadioGroup 
            value={fuelType} 
            onValueChange={(value) => {
              setFuelType(value);
              triggerHaptic('selection');
              // Auto-advance on mobile after selection
              setTimeout(() => setQuestionStep(3), 150);
            }}
            className="grid grid-cols-2 gap-3"
          >
            {fuelOptions.map((option) => (
              <Label
                key={option.value}
                htmlFor={`fuel-${option.value}`}
                className={`flex items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-colors text-center ${
                  fuelType === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-muted-foreground/50'
                }`}
              >
                <RadioGroupItem value={option.value} id={`fuel-${option.value}`} className="sr-only" />
                <span className="font-medium text-sm">{option.label}</span>
              </Label>
            ))}
          </RadioGroup>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setQuestionStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Button 
              className="flex-1" 
              onClick={() => setQuestionStep(3)}
              disabled={!canProceedStep2}
            >
              Avanti
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}

      {questionStep === 3 && (
        <>
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Domanda 3 di 3</p>
          </div>
          
          <h4 className="font-medium text-center">Quando è stato installato (circa)?</h4>
          
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-3xl font-bold text-primary">{year}</span>
              </div>
              
              <Slider
                value={[year]}
                onValueChange={(values) => setYear(values[0])}
                min={1990}
                max={currentYear}
                step={1}
                className="mt-4"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1990</span>
                <span>2000</span>
                <span>2010</span>
                <span>{currentYear}</span>
              </div>

              <div className="pt-4 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Classe energetica stimata: {' '}
                  <span className={`font-bold ${
                    estimateEnergyClass(year) <= 'B' ? 'text-green-500' :
                    estimateEnergyClass(year) <= 'D' ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {estimateEnergyClass(year)}
                  </span>
                </p>
              </div>
            </div>
          </Card>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => setQuestionStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <Button 
              className="flex-1" 
              onClick={handleComplete}
              disabled={isLoading}
            >
              {isLoading ? 'Salvataggio...' : 'Conferma'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
