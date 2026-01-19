-- Tabella per risultati analisi casa Snap & Solve
CREATE TABLE public.home_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Dati bolletta (riutilizziamo quelli esistenti o nuovi)
  bill_analysis JSONB DEFAULT NULL,
  -- Es: {"pod": "IT...", "supplier": "Enel", "annual_consumption": 3500, "confidence": 0.95}
  
  -- Dati impianto riscaldamento/condizionamento
  heating_analysis JSONB DEFAULT NULL,
  -- Es: {"brand": "Vaillant", "model": "ecoTEC", "estimated_year": 2010, "fuel_type": "gas", "energy_class": "C", "confidence": 0.8}
  
  -- Dati esterni casa
  external_analysis JSONB DEFAULT NULL,
  -- Es: {"window_type": "single_pane", "facade_condition": "good", "estimated_class": "E", "confidence": 0.7}
  
  -- Risultati combinati
  combined_energy_class VARCHAR(1) DEFAULT NULL, -- A, B, C, D, E, F, G
  estimated_extra_cost_yearly DECIMAL(10,2) DEFAULT NULL,
  confidence_level DECIMAL(3,2) DEFAULT NULL, -- 0.00 - 1.00
  
  -- Raccomandazioni generate
  recommendations JSONB DEFAULT NULL,
  -- Es: [{"intervention_type_id": "...", "estimated_savings": 450, "priority": 1}]
  
  -- Stati
  status VARCHAR(20) DEFAULT 'pending', -- pending, analyzing, completed, failed
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index per performance
CREATE INDEX idx_home_analysis_user_id ON public.home_analysis(user_id);
CREATE INDEX idx_home_analysis_status ON public.home_analysis(status);

-- RLS
ALTER TABLE public.home_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own home analysis"
  ON public.home_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own home analysis"
  ON public.home_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own home analysis"
  ON public.home_analysis FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_home_analysis_updated_at
  BEFORE UPDATE ON public.home_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_updated_at();