// Recommendations Engine per Snap & Solve
// Basato su standard ENEA e normativa APE italiana (DM 26/06/2015)

// === INTERFACES ===

interface BillAnalysis {
  pod?: string | null;
  supplier?: string | null;
  annual_consumption?: number | null;
  confidence?: number;
}

interface HeatingAnalysis {
  brand?: string | null;
  model?: string | null;
  estimated_year?: number | null;
  fuel_type?: string | null;
  device_type?: string | null;
  energy_class?: string | null;
  estimated_efficiency?: number | null;
  issues_detected?: string[];
  confidence?: number;
}

interface ExternalAnalysis {
  window_type?: string | null;
  window_frame_material?: string | null;
  facade_condition?: string | null;
  insulation_visible?: string | null;
  building_age_estimate?: string | null;
  building_type?: string | null;
  roof_condition?: string | null;
  estimated_class?: string | null;
  confidence?: number;
}

export interface Recommendation {
  intervention_type: string;
  title: string;
  description: string;
  estimated_savings_min: number; // €/anno min
  estimated_savings_max: number; // €/anno max
  estimated_savings: number; // €/anno medio (per retrocompatibilità)
  estimated_cost_min: number; // € min
  estimated_cost_max: number; // € max
  estimated_cost: number; // € medio (per retrocompatibilità)
  roi_years_min: number;
  roi_years_max: number;
  roi_years: number; // medio
  priority: number; // 1 = highest
  confidence: 'alta' | 'media' | 'bassa';
  reasoning: string;
  sources: string[];
}

export interface CalculationDetails {
  energy_index_kwh_m2: number | null;
  square_meters: number | null;
  annual_consumption_kwh: number | null;
  calculation_method: 'measured' | 'estimated';
  reference_standard: string;
  energy_prices: {
    electricity_kwh: number;
    gas_smc: number;
    source: string;
    date: string;
  };
  confidence_factors: {
    bill_data: number;
    heating_data: number;
    external_data: number;
    overall: number;
  };
}

// === STANDARD ENEA / APE ITALIANO ===
// Fonte: DM 26/06/2015 Allegato 1 - Classi energetiche edifici residenziali

// EPgl,nren (kWh/m²/anno) per ogni classe - valori indicativi zona E (Nord Italia)
const ENERGY_CLASS_THRESHOLDS = {
  'A4': { max: 15, label: 'Quasi zero energia' },
  'A3': { max: 25, label: 'Altissima efficienza' },
  'A2': { max: 40, label: 'Alta efficienza' },
  'A1': { max: 55, label: 'Ottima efficienza' },
  'B': { max: 80, label: 'Buona efficienza' },
  'C': { max: 115, label: 'Media efficienza' },
  'D': { max: 150, label: 'Efficienza sufficiente' },
  'E': { max: 200, label: 'Bassa efficienza' },
  'F': { max: 275, label: 'Scarsa efficienza' },
  'G': { max: 999, label: 'Inefficiente' }
} as const;

// Consumo extra rispetto a classe A4 (benchmark) in kWh/m²/anno
const CLASS_EXTRA_KWH_M2: Record<string, number> = {
  'A4': 0,
  'A3': 10,
  'A2': 25,
  'A1': 40,
  'B': 65,
  'C': 100,
  'D': 135,
  'E': 185,
  'F': 260,
  'G': 350
};

// === PREZZI ENERGIA ARERA ===
// Fonte: ARERA - Prezzi di riferimento Q4 2024
// Aggiornamento: Trimestrale dal sito ARERA
const ENERGY_PRICES = {
  electricity_kwh: 0.32, // €/kWh PUN medio + oneri + accise (fascia unica)
  gas_smc: 1.05, // €/Smc PSV medio + distribuzione + accise
  gas_kwh: 0.105, // €/kWh termico (1 Smc ≈ 10 kWh)
  source: 'ARERA Mercato Tutelato Q4 2024',
  date: '2024-12-01'
};

// === EFFICIENZA CALDAIE PER ANNO ===
// Fonte: Rapporto ENEA Detrazioni Fiscali 2023

function getBoilerEfficiency(year: number | null, type: string | null): { efficiency: number; source: string } {
  const currentYear = new Date().getFullYear();
  const age = year ? currentYear - year : 15;
  
  // Caldaie a condensazione
  if (type === 'caldaia_condensazione') {
    if (age <= 5) return { efficiency: 0.94, source: 'ENEA - Caldaie condensazione recenti' };
    if (age <= 10) return { efficiency: 0.90, source: 'ENEA - Degradamento stimato 1%/anno' };
    if (age <= 15) return { efficiency: 0.85, source: 'ENEA - Degradamento stimato' };
    return { efficiency: 0.80, source: 'ENEA - Caldaie condensazione datate' };
  }
  
  // Caldaie tradizionali
  if (type === 'caldaia_tradizionale' || !type) {
    if (age <= 10) return { efficiency: 0.82, source: 'ENEA - Caldaie tradizionali buone condizioni' };
    if (age <= 15) return { efficiency: 0.75, source: 'ENEA - Degradamento stimato' };
    if (age <= 20) return { efficiency: 0.68, source: 'ENEA - Caldaie pre-2005' };
    return { efficiency: 0.60, source: 'ENEA - Caldaie anni 90 o precedenti' };
  }
  
  // Pompe di calore
  if (type === 'pompa_calore') {
    if (age <= 5) return { efficiency: 3.5, source: 'ENEA - COP medio PDC recenti' }; // COP
    if (age <= 10) return { efficiency: 3.0, source: 'ENEA - PDC degradate' };
    return { efficiency: 2.5, source: 'ENEA - PDC datate' };
  }
  
  return { efficiency: 0.75, source: 'Stima generica' };
}

// === FUNZIONI DI CALCOLO ===

function getHeatingSystemAge(analysis: HeatingAnalysis | null): number {
  if (!analysis?.estimated_year) return 15;
  return new Date().getFullYear() - analysis.estimated_year;
}

// Calcola classe energetica da EPgl
function getEnergyClassFromEP(epIndex: number): string {
  for (const [cls, data] of Object.entries(ENERGY_CLASS_THRESHOLDS)) {
    if (epIndex <= data.max) return cls;
  }
  return 'G';
}

// Calcola risparmio sostituzione caldaia
function calculateHeatingReplacement(
  consumption: number,
  squareMeters: number | null,
  heating: HeatingAnalysis | null
): Recommendation | null {
  const age = getHeatingSystemAge(heating);
  const deviceType = heating?.device_type || 'caldaia_tradizionale';
  
  // Non suggerire se caldaia recente a condensazione o PDC
  if (age < 8 && (deviceType === 'caldaia_condensazione' || deviceType === 'pompa_calore')) {
    return null;
  }

  const currentEff = getBoilerEfficiency(heating?.estimated_year || null, deviceType);
  const newEff = { efficiency: 0.94, source: 'Caldaia condensazione classe A+' };
  
  // Calcolo risparmio
  const heatingShare = 0.65; // 65% consumo per riscaldamento (fonte ENEA)
  const heatingConsumption = consumption * heatingShare;
  const currentCost = heatingConsumption * ENERGY_PRICES.gas_kwh / currentEff.efficiency;
  const newCost = heatingConsumption * ENERGY_PRICES.gas_kwh / newEff.efficiency;
  
  const annualSavingsMid = Math.round(currentCost - newCost);
  const annualSavingsMin = Math.round(annualSavingsMid * 0.75);
  const annualSavingsMax = Math.round(annualSavingsMid * 1.25);
  
  if (annualSavingsMid < 80) return null;

  // Costi installazione (fonte: Osservatorio prezzi MISE 2024)
  const costMin = deviceType === 'pompa_calore' ? 6500 : 2800;
  const costMax = deviceType === 'pompa_calore' ? 12000 : 5500;
  const costMid = Math.round((costMin + costMax) / 2);

  const roiMin = Math.round((costMin / annualSavingsMax) * 10) / 10;
  const roiMax = Math.round((costMax / annualSavingsMin) * 10) / 10;
  const roiMid = Math.round((costMid / annualSavingsMid) * 10) / 10;

  // Determina confidence basata su dati disponibili
  let confidence: 'alta' | 'media' | 'bassa' = 'media';
  if (heating?.brand && heating?.estimated_year && heating?.confidence && heating.confidence > 0.7) {
    confidence = 'alta';
  } else if (!heating?.brand && !heating?.estimated_year) {
    confidence = 'bassa';
  }

  return {
    intervention_type: 'heating',
    title: 'Sostituzione Impianto Termico',
    description: heating?.brand 
      ? `${heating.brand} del ${heating.estimated_year || '~2010'} → Caldaia condensazione classe A+`
      : `Impianto di circa ${age} anni → Caldaia condensazione classe A+`,
    estimated_savings_min: annualSavingsMin,
    estimated_savings_max: annualSavingsMax,
    estimated_savings: annualSavingsMid,
    estimated_cost_min: costMin,
    estimated_cost_max: costMax,
    estimated_cost: costMid,
    roi_years_min: roiMin,
    roi_years_max: roiMax,
    roi_years: roiMid,
    priority: age > 15 ? 1 : 2,
    confidence,
    reasoning: `Efficienza attuale: ${Math.round(currentEff.efficiency * 100)}% (${currentEff.source}). ` +
      `Efficienza nuova: 94%. Risparmio = differenza costi riscaldamento.`,
    sources: [
      currentEff.source,
      'ARERA - Prezzi gas Q4 2024',
      'ENEA - Rapporto Detrazioni Fiscali 2023'
    ]
  };
}

// Calcola risparmio infissi
function calculateWindowReplacement(
  consumption: number,
  squareMeters: number | null,
  external: ExternalAnalysis | null
): Recommendation | null {
  if (!external) return null;
  
  const windowType = external.window_type;
  const frameMaterial = external.window_frame_material;
  
  // Non suggerire se infissi già buoni
  if (windowType === 'triplo_vetro' || 
      (windowType === 'vetro_doppio' && (frameMaterial === 'pvc' || frameMaterial === 'alluminio_taglio_termico'))) {
    return null;
  }

  // Trasmittanza termica U (W/m²K) per tipo finestra - Fonte: UNI EN 10077
  const transmittanceOld: Record<string, number> = {
    'vetro_singolo': 5.8,
    'vetro_doppio_legno_vecchio': 3.2,
    'vetro_doppio_alluminio': 3.5,
    'vetro_doppio': 2.8
  };
  const transmittanceNew = 1.1; // Triplo vetro PVC classe A

  const uOld = windowType === 'vetro_singolo' ? transmittanceOld.vetro_singolo :
               frameMaterial === 'legno_vecchio' ? transmittanceOld.vetro_doppio_legno_vecchio :
               frameMaterial === 'alluminio' ? transmittanceOld.vetro_doppio_alluminio :
               transmittanceOld.vetro_doppio;

  // Stima superficie finestrata (15-20% superficie calpestabile)
  const windowArea = squareMeters ? squareMeters * 0.15 : 18; // default 120m² * 15%
  
  // Gradi giorno zona E (Milano) e ore riscaldamento
  const gradiGiorno = 2400;
  const oreRiscaldamento = 14 * 180; // 14h/giorno x 180 giorni
  
  // Energia dispersa (kWh) = U * A * ΔT * ore / 1000
  const deltaT = 20; // differenza media interno-esterno
  const energyLossOld = (uOld * windowArea * deltaT * oreRiscaldamento) / 1000;
  const energyLossNew = (transmittanceNew * windowArea * deltaT * oreRiscaldamento) / 1000;
  const energySaved = energyLossOld - energyLossNew;
  
  const annualSavingsMid = Math.round(energySaved * ENERGY_PRICES.gas_kwh);
  const annualSavingsMin = Math.round(annualSavingsMid * 0.70);
  const annualSavingsMax = Math.round(annualSavingsMid * 1.30);
  
  if (annualSavingsMid < 60) return null;

  // Costi infissi (fonte: Prezzi informativi ANCE 2024)
  const costPerMq = { min: 350, max: 650 };
  const costMin = Math.round(windowArea * costPerMq.min);
  const costMax = Math.round(windowArea * costPerMq.max);
  const costMid = Math.round((costMin + costMax) / 2);

  const roiMin = Math.round((costMin / annualSavingsMax) * 10) / 10;
  const roiMax = Math.round((costMax / annualSavingsMin) * 10) / 10;
  const roiMid = Math.round((costMid / annualSavingsMid) * 10) / 10;

  let confidence: 'alta' | 'media' | 'bassa' = 'media';
  if (external.confidence && external.confidence > 0.7 && squareMeters) {
    confidence = 'alta';
  } else if (!windowType) {
    confidence = 'bassa';
  }

  return {
    intervention_type: 'windows',
    title: 'Sostituzione Infissi',
    description: `Da ${windowType?.replace('_', ' ') || 'vetro doppio'} a triplo vetro basso emissivo`,
    estimated_savings_min: annualSavingsMin,
    estimated_savings_max: annualSavingsMax,
    estimated_savings: annualSavingsMid,
    estimated_cost_min: costMin,
    estimated_cost_max: costMax,
    estimated_cost: costMid,
    roi_years_min: roiMin,
    roi_years_max: roiMax,
    roi_years: roiMid,
    priority: windowType === 'vetro_singolo' ? 1 : 3,
    confidence,
    reasoning: `Trasmittanza attuale: U=${uOld} W/m²K → U=1.1 W/m²K. ` +
      `Superficie finestre stimata: ${Math.round(windowArea)}m². Zona climatica E.`,
    sources: [
      'UNI EN 10077 - Trasmittanza infissi',
      'DPR 412/93 - Zone climatiche',
      'ANCE - Prezzi informativi 2024'
    ]
  };
}

// Calcola risparmio cappotto termico
function calculateInsulation(
  consumption: number,
  squareMeters: number | null,
  external: ExternalAnalysis | null
): Recommendation | null {
  if (!external) return null;
  
  if (external.insulation_visible === 'cappotto_termico') return null;
  
  // Trasmittanza pareti per epoca costruttiva (fonte: ENEA)
  const transmittanceByAge: Record<string, { u: number; description: string }> = {
    'pre_1970': { u: 1.8, description: 'Muratura piena senza isolamento' },
    '1970_1990': { u: 1.2, description: 'Muratura con camera d\'aria' },
    '1990_2005': { u: 0.8, description: 'Isolamento minimo L. 10/91' },
    '2005_2015': { u: 0.45, description: 'Isolamento D.Lgs 192/05' },
    'post_2015': { u: 0.28, description: 'nZEB o quasi' }
  };
  
  const buildingAge = external.building_age_estimate || '1970_1990';
  const wallData = transmittanceByAge[buildingAge] || transmittanceByAge['1970_1990'];
  const uNew = 0.22; // Cappotto 12cm EPS - limite DM 26/06/2015 zona E
  
  if (wallData.u <= 0.35) return null; // Già ben isolato
  
  // Stima superficie pareti disperdenti (circa 1.2x superficie calpestabile per appartamento)
  const wallArea = squareMeters ? squareMeters * 1.2 : 120;
  
  // Gradi giorno e calcolo
  const gradiGiorno = 2400;
  const oreRiscaldamento = 14 * 180;
  const deltaT = 20;
  
  const energyLossOld = (wallData.u * wallArea * deltaT * oreRiscaldamento) / 1000;
  const energyLossNew = (uNew * wallArea * deltaT * oreRiscaldamento) / 1000;
  const energySaved = energyLossOld - energyLossNew;
  
  const annualSavingsMid = Math.round(energySaved * ENERGY_PRICES.gas_kwh);
  const annualSavingsMin = Math.round(annualSavingsMid * 0.65);
  const annualSavingsMax = Math.round(annualSavingsMid * 1.35);
  
  if (annualSavingsMid < 120) return null;

  // Costi cappotto (fonte: DEI Prezzi Tipologie Edilizie 2024)
  const costPerMq = { min: 80, max: 140 };
  const costMin = Math.round(wallArea * costPerMq.min);
  const costMax = Math.round(wallArea * costPerMq.max);
  const costMid = Math.round((costMin + costMax) / 2);

  const roiMin = Math.round((costMin / annualSavingsMax) * 10) / 10;
  const roiMax = Math.round((costMax / annualSavingsMin) * 10) / 10;
  const roiMid = Math.round((costMid / annualSavingsMid) * 10) / 10;

  let confidence: 'alta' | 'media' | 'bassa' = 'media';
  if (external.confidence && external.confidence > 0.6 && squareMeters && external.building_age_estimate) {
    confidence = 'alta';
  } else if (!external.building_age_estimate) {
    confidence = 'bassa';
  }

  return {
    intervention_type: 'insulation',
    title: 'Isolamento Termico (Cappotto)',
    description: `Cappotto esterno 12cm → Da ${wallData.description} a edificio ben isolato`,
    estimated_savings_min: annualSavingsMin,
    estimated_savings_max: annualSavingsMax,
    estimated_savings: annualSavingsMid,
    estimated_cost_min: costMin,
    estimated_cost_max: costMax,
    estimated_cost: costMid,
    roi_years_min: roiMin,
    roi_years_max: roiMax,
    roi_years: roiMid,
    priority: wallData.u > 1.2 ? 2 : 4,
    confidence,
    reasoning: `Trasmittanza attuale: U=${wallData.u} W/m²K → U=0.22 W/m²K. ` +
      `Superficie pareti stimata: ${Math.round(wallArea)}m². ${wallData.description}.`,
    sources: [
      'ENEA - Rapporto Riqualificazione Energetica',
      'DM 26/06/2015 - Limiti trasmittanza',
      'DEI - Prezzi Tipologie Edilizie 2024'
    ]
  };
}

// Calcola risparmio fotovoltaico
function calculateSolarPanels(
  consumption: number,
  squareMeters: number | null,
  external: ExternalAnalysis | null
): Recommendation | null {
  if (consumption < 2200) return null;

  // Dimensionamento impianto basato su consumi
  // 1 kWp → circa 1100-1300 kWh/anno in Nord Italia
  const kWhPerKWp = 1200;
  const targetCoverage = 0.70; // Copertura 70% consumi
  const kWpNeeded = Math.ceil((consumption * targetCoverage) / kWhPerKWp);
  const kWpSystem = Math.min(Math.max(kWpNeeded, 3), 6); // Min 3kWp, max 6kWp
  
  const annualProduction = kWpSystem * kWhPerKWp;
  const selfConsumption = 0.35; // 35% autoconsumo diretto (fonte GSE)
  const gridExchange = 0.65; // 65% immesso e ripreso con Scambio sul Posto
  const sspValue = 0.12; // Valore SSP medio €/kWh
  
  const savingsDirectConsumption = annualProduction * selfConsumption * ENERGY_PRICES.electricity_kwh;
  const savingsSSP = annualProduction * gridExchange * sspValue;
  
  const annualSavingsMid = Math.round(savingsDirectConsumption + savingsSSP);
  const annualSavingsMin = Math.round(annualSavingsMid * 0.80);
  const annualSavingsMax = Math.round(annualSavingsMid * 1.20);

  // Costi impianto (fonte: SolarPower Europe 2024)
  const costPerKWp = { min: 1600, max: 2200 };
  const costMin = kWpSystem * costPerKWp.min;
  const costMax = kWpSystem * costPerKWp.max;
  const costMid = Math.round((costMin + costMax) / 2);

  const roiMin = Math.round((costMin / annualSavingsMax) * 10) / 10;
  const roiMax = Math.round((costMax / annualSavingsMin) * 10) / 10;
  const roiMid = Math.round((costMid / annualSavingsMid) * 10) / 10;

  return {
    intervention_type: 'solar_panels',
    title: `Impianto Fotovoltaico ${kWpSystem} kWp`,
    description: `Produci ~${annualProduction.toLocaleString()} kWh/anno e riduci la bolletta`,
    estimated_savings_min: annualSavingsMin,
    estimated_savings_max: annualSavingsMax,
    estimated_savings: annualSavingsMid,
    estimated_cost_min: costMin,
    estimated_cost_max: costMax,
    estimated_cost: costMid,
    roi_years_min: roiMin,
    roi_years_max: roiMax,
    roi_years: roiMid,
    priority: 2,
    confidence: 'alta',
    reasoning: `Impianto ${kWpSystem} kWp × ${kWhPerKWp} kWh/kWp = ${annualProduction} kWh/anno. ` +
      `Autoconsumo 35% + Scambio sul Posto 65%.`,
    sources: [
      'GSE - Statistiche Scambio sul Posto',
      'ARERA - Prezzi elettricità Q4 2024',
      'SolarPower Europe - Market Outlook 2024'
    ]
  };
}

// === FUNZIONI ESPORTATE ===

// Calcola classe energetica da EP index
export function calculateCombinedEnergyClass(
  heating: HeatingAnalysis | null,
  external: ExternalAnalysis | null,
  consumption?: number | null,
  squareMeters?: number | null
): string {
  // Metodo 1: Calcolo da consumi reali (più affidabile)
  if (consumption && squareMeters && squareMeters > 0) {
    const epIndex = consumption / squareMeters;
    return getEnergyClassFromEP(epIndex);
  }

  // Metodo 2: Stima AI dall'esterno
  if (external?.estimated_class) {
    return external.estimated_class;
  }

  // Metodo 3: Stima da età edificio (meno affidabile)
  const buildingAge = external?.building_age_estimate;
  const ageClassMap: Record<string, string> = {
    'pre_1970': 'G',
    '1970_1990': 'F',
    '1990_2005': 'E',
    '2005_2015': 'C',
    'post_2015': 'B'
  };
  if (buildingAge && ageClassMap[buildingAge]) {
    return ageClassMap[buildingAge];
  }

  // Metodo 4: Stima da età caldaia
  const heatingAge = getHeatingSystemAge(heating);
  if (heatingAge > 20) return 'F';
  if (heatingAge > 15) return 'E';
  if (heatingAge > 10) return 'D';
  
  return 'D';
}

// Calcola costo extra annuale vs classe A
export function calculateExtraCostYearly(
  consumption: number,
  energyClass: string,
  squareMeters?: number | null
): number {
  const extraKwhM2 = CLASS_EXTRA_KWH_M2[energyClass] || 150;
  const area = squareMeters || 100;
  const extraKwh = extraKwhM2 * area;
  
  // Costo extra = energia sprecata × prezzo medio (mix gas/elettrico)
  const avgPrice = (ENERGY_PRICES.gas_kwh + ENERGY_PRICES.electricity_kwh) / 2;
  return Math.round(extraKwh * avgPrice);
}

// Calcola dettagli per trasparenza
export function calculateDetails(
  consumption: number | null,
  squareMeters: number | null,
  billConfidence: number,
  heatingConfidence: number,
  externalConfidence: number
): CalculationDetails {
  const epIndex = consumption && squareMeters ? consumption / squareMeters : null;
  
  // Calcola confidence complessiva
  const weights = { bill: 0.4, heating: 0.3, external: 0.3 };
  const overall = (billConfidence * weights.bill) + 
                  (heatingConfidence * weights.heating) + 
                  (externalConfidence * weights.external);
  
  return {
    energy_index_kwh_m2: epIndex ? Math.round(epIndex) : null,
    square_meters: squareMeters,
    annual_consumption_kwh: consumption,
    calculation_method: consumption ? 'measured' : 'estimated',
    reference_standard: 'DM 26/06/2015 - Linee guida nazionali certificazione energetica',
    energy_prices: {
      electricity_kwh: ENERGY_PRICES.electricity_kwh,
      gas_smc: ENERGY_PRICES.gas_smc,
      source: ENERGY_PRICES.source,
      date: ENERGY_PRICES.date
    },
    confidence_factors: {
      bill_data: billConfidence,
      heating_data: heatingConfidence,
      external_data: externalConfidence,
      overall: Math.round(overall * 100) / 100
    }
  };
}

// Funzione principale: genera raccomandazioni
export function generateRecommendations(
  bill: BillAnalysis | null,
  heating: HeatingAnalysis | null,
  external: ExternalAnalysis | null,
  squareMeters?: number | null
): Recommendation[] {
  const consumption = bill?.annual_consumption || 3000;
  const area = squareMeters || null;
  
  const recommendations: Recommendation[] = [];

  const heatingRec = calculateHeatingReplacement(consumption, area, heating);
  if (heatingRec) recommendations.push(heatingRec);

  const windowRec = calculateWindowReplacement(consumption, area, external);
  if (windowRec) recommendations.push(windowRec);

  const insulationRec = calculateInsulation(consumption, area, external);
  if (insulationRec) recommendations.push(insulationRec);

  const solarRec = calculateSolarPanels(consumption, area, external);
  if (solarRec) recommendations.push(solarRec);

  // Ordina per priorità poi per ROI
  recommendations.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.roi_years - b.roi_years;
  });

  return recommendations.slice(0, 3);
}
