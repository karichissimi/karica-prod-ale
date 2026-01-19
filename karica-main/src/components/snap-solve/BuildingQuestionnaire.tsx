import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Loader2, Home, Building2, Building, HelpCircle } from "lucide-react";
import { triggerHaptic } from "@/hooks/useHapticFeedback";

export interface BuildingData {
  building_type: 'appartamento' | 'villetta' | 'bifamiliare' | 'condominio' | 'altro';
  building_age: 'pre_1970' | '1970_1990' | '1990_2005' | '2005_2015' | 'post_2015' | 'non_so';
  window_type: 'vetro_singolo' | 'vetro_doppio' | 'triplo_vetro' | 'non_so';
  insulation: 'cappotto_termico' | 'nessuno_evidente' | 'non_so';
  estimated_energy_class: string;
  confidence: number;
  source: 'questionnaire';
}

interface BuildingQuestionnaireProps {
  onComplete: (data: BuildingData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

const buildingTypeOptions = [
  { value: 'appartamento', label: 'Appartamento', icon: Building2, description: 'In condominio o palazzina' },
  { value: 'villetta', label: 'Villetta', icon: Home, description: 'Casa indipendente' },
  { value: 'bifamiliare', label: 'Bifamiliare', icon: Building, description: 'Due unità abitative' },
  { value: 'altro', label: 'Altro', icon: HelpCircle, description: 'Tipologia diversa' },
];

const buildingAgeOptions = [
  { value: 'pre_1970', label: 'Prima del 1970', description: 'Costruzione storica' },
  { value: '1970_1990', label: '1970-1990', description: 'Anni \'70 e \'80' },
  { value: '1990_2005', label: '1990-2005', description: 'Anni \'90 e 2000' },
  { value: '2005_2015', label: '2005-2015', description: 'Costruzione recente' },
  { value: 'post_2015', label: 'Dopo il 2015', description: 'Costruzione moderna' },
  { value: 'non_so', label: 'Non so', description: 'Data sconosciuta' },
];

const windowTypeOptions = [
  { value: 'vetro_singolo', label: 'Vetro singolo', description: 'Freddo in inverno, spifferi' },
  { value: 'vetro_doppio', label: 'Doppio vetro', description: 'Standard, buon isolamento' },
  { value: 'triplo_vetro', label: 'Triplo vetro', description: 'Alta efficienza energetica' },
  { value: 'non_so', label: 'Non so', description: 'Non sono sicuro' },
];

const insulationOptions = [
  { value: 'cappotto_termico', label: 'Sì, cappotto termico', description: 'Isolamento esterno visibile' },
  { value: 'nessuno_evidente', label: 'No, non visibile', description: 'Nessun isolamento evidente' },
  { value: 'non_so', label: 'Non so', description: 'Non sono sicuro' },
];

export const BuildingQuestionnaire = ({ onComplete, onBack, isLoading }: BuildingQuestionnaireProps) => {
  const [questionStep, setQuestionStep] = useState(1);
  const [buildingType, setBuildingType] = useState<string>('');
  const [buildingAge, setBuildingAge] = useState<string>('');
  const [windowType, setWindowType] = useState<string>('');
  const [insulation, setInsulation] = useState<string>('');

  // Estimate energy class based on building characteristics
  const estimateEnergyClass = (): { class: string; confidence: number } => {
    let score = 50; // Base score (D class)
    let confidence = 0.4;

    // Building age impacts heavily
    switch (buildingAge) {
      case 'pre_1970': score -= 25; break;
      case '1970_1990': score -= 15; break;
      case '1990_2005': score -= 5; break;
      case '2005_2015': score += 10; break;
      case 'post_2015': score += 25; confidence += 0.1; break;
      case 'non_so': confidence -= 0.1; break;
    }

    // Window type
    switch (windowType) {
      case 'vetro_singolo': score -= 15; confidence += 0.05; break;
      case 'vetro_doppio': score += 5; confidence += 0.1; break;
      case 'triplo_vetro': score += 20; confidence += 0.1; break;
      case 'non_so': confidence -= 0.05; break;
    }

    // Insulation
    switch (insulation) {
      case 'cappotto_termico': score += 20; confidence += 0.1; break;
      case 'nessuno_evidente': score -= 10; confidence += 0.05; break;
      case 'non_so': confidence -= 0.05; break;
    }

    // Convert score to class
    let energyClass = 'D';
    if (score >= 80) energyClass = 'A';
    else if (score >= 65) energyClass = 'B';
    else if (score >= 50) energyClass = 'C';
    else if (score >= 35) energyClass = 'D';
    else if (score >= 20) energyClass = 'E';
    else if (score >= 5) energyClass = 'F';
    else energyClass = 'G';

    return { class: energyClass, confidence: Math.min(0.7, Math.max(0.3, confidence)) };
  };

  const handleComplete = () => {
    const { class: energyClass, confidence } = estimateEnergyClass();
    
    const data: BuildingData = {
      building_type: buildingType as BuildingData['building_type'],
      building_age: buildingAge as BuildingData['building_age'],
      window_type: windowType as BuildingData['window_type'],
      insulation: insulation as BuildingData['insulation'],
      estimated_energy_class: energyClass,
      confidence,
      source: 'questionnaire'
    };
    
    onComplete(data);
  };

  const canProceed = () => {
    switch (questionStep) {
      case 1: return buildingType !== '';
      case 2: return buildingAge !== '';
      case 3: return windowType !== '';
      case 4: return insulation !== '';
      default: return false;
    }
  };

  const handleNext = () => {
    if (questionStep < 4) {
      setQuestionStep(questionStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (questionStep > 1) {
      setQuestionStep(questionStep - 1);
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-muted-foreground">Domanda {questionStep} di 4</span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${(questionStep / 4) * 100}%` }}
          />
        </div>
      </div>

      {questionStep === 1 && (
        <div className="space-y-3">
          <Label className="text-base font-medium">In che tipo di casa vivi?</Label>
          <div className="grid grid-cols-2 gap-2">
            {buildingTypeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = buildingType === option.value;
              return (
                <Card 
                  key={option.value}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5 ring-2 ring-primary' 
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => {
                    setBuildingType(option.value);
                    triggerHaptic('selection');
                    // Auto-advance after selection
                    setTimeout(() => setQuestionStep(2), 150);
                  }}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <Icon className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div>
                      <p className="font-medium text-sm">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {questionStep === 2 && (
        <div className="space-y-3">
          <Label className="text-base font-medium">Quando è stato costruito l'edificio?</Label>
          <RadioGroup 
            value={buildingAge} 
            onValueChange={(value) => {
              setBuildingAge(value);
              triggerHaptic('selection');
              // Auto-advance after selection
              setTimeout(() => setQuestionStep(3), 150);
            }}
            className="space-y-2"
          >
            {buildingAgeOptions.map((option) => (
              <Card 
                key={option.value}
                className={`p-3 cursor-pointer transition-all ${
                  buildingAge === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setBuildingAge(option.value);
                  triggerHaptic('selection');
                  // Auto-advance after selection
                  setTimeout(() => setQuestionStep(3), 150);
                }}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="cursor-pointer font-medium">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </RadioGroup>
        </div>
      )}

      {questionStep === 3 && (
        <div className="space-y-3">
          <Label className="text-base font-medium">Che tipo di finestre hai?</Label>
          <RadioGroup 
            value={windowType} 
            onValueChange={(value) => {
              setWindowType(value);
              triggerHaptic('selection');
              // Auto-advance after selection
              setTimeout(() => setQuestionStep(4), 150);
            }}
            className="space-y-2"
          >
            {windowTypeOptions.map((option) => (
              <Card 
                key={option.value}
                className={`p-3 cursor-pointer transition-all ${
                  windowType === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => {
                  setWindowType(option.value);
                  triggerHaptic('selection');
                  // Auto-advance after selection
                  setTimeout(() => setQuestionStep(4), 150);
                }}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={option.value} id={`window-${option.value}`} />
                  <div className="flex-1">
                    <Label htmlFor={`window-${option.value}`} className="cursor-pointer font-medium">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </RadioGroup>
        </div>
      )}

      {questionStep === 4 && (
        <div className="space-y-3">
          <Label className="text-base font-medium">L'edificio ha isolamento termico (cappotto)?</Label>
          <RadioGroup value={insulation} onValueChange={(v) => { setInsulation(v); triggerHaptic('selection'); }} className="space-y-2">
            {insulationOptions.map((option) => (
              <Card 
                key={option.value}
                className={`p-3 cursor-pointer transition-all ${
                  insulation === option.value 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => { setInsulation(option.value); triggerHaptic('selection'); }}
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value={option.value} id={`insulation-${option.value}`} />
                  <div className="flex-1">
                    <Label htmlFor={`insulation-${option.value}`} className="cursor-pointer font-medium">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </RadioGroup>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={handleBack} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleNext}
          disabled={!canProceed() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {questionStep < 4 ? 'Avanti' : 'Conferma'}
          {questionStep < 4 && <ArrowRight className="h-4 w-4 ml-2" />}
        </Button>
      </div>
    </div>
  );
};
