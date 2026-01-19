-- Crea tabella tipi di intervento
CREATE TABLE IF NOT EXISTS public.intervention_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Crea tabella partners
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  description TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  rating NUMERIC DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crea tabella partner_specializations (many-to-many)
CREATE TABLE IF NOT EXISTS public.partner_specializations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  intervention_type_id UUID REFERENCES public.intervention_types(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id, intervention_type_id)
);

-- Crea tabella leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  intervention_type_id UUID REFERENCES public.intervention_types(id),
  partner_id UUID REFERENCES public.partners(id),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  calculator_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crea tabella lead_messages
CREATE TABLE IF NOT EXISTS public.lead_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'partner')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS per intervention_types (pubblico, tutti possono leggere)
ALTER TABLE public.intervention_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view intervention types"
ON public.intervention_types FOR SELECT
USING (true);

-- RLS per partners (pubblico, tutti possono leggere)
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active partners"
ON public.partners FOR SELECT
USING (is_active = true);

-- RLS per partner_specializations (pubblico)
ALTER TABLE public.partner_specializations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view partner specializations"
ON public.partner_specializations FOR SELECT
USING (true);

-- RLS per leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own leads"
ON public.leads FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads"
ON public.leads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
ON public.leads FOR UPDATE
USING (auth.uid() = user_id);

-- RLS per lead_messages
ALTER TABLE public.lead_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their leads"
ON public.lead_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_messages.lead_id
    AND leads.user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages on their leads"
ON public.lead_messages FOR INSERT
WITH CHECK (
  sender_type = 'user' AND
  EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_messages.lead_id
    AND leads.user_id = auth.uid()
  )
);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_partners_updated_at
BEFORE UPDATE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
BEFORE UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Popola i tipi di intervento
INSERT INTO public.intervention_types (name, description, icon) VALUES
('Pompa di Calore', 'Sostituzione della caldaia tradizionale con una pompa di calore ad alta efficienza', '🔥'),
('Isolamento Termico', 'Cappotto termico e isolamento delle pareti per ridurre dispersione termica', '🏠'),
('Pannelli Solari', 'Installazione di pannelli fotovoltaici per produzione energia pulita', '☀️'),
('Sostituzione Infissi', 'Sostituzione di finestre e porte con infissi ad alta efficienza energetica', '🪟'),
('Audit Energetico', 'Analisi completa dell''efficienza energetica dell''abitazione con report dettagliato', '📊'),
('Batterie di Accumulo', 'Sistema di accumulo energia per massimizzare l''autoconsumo fotovoltaico', '🔋');

-- Crea storage bucket per avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies per avatars bucket
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Popola i 3 partners
DO $$
DECLARE
  pippo_id uuid;
  pluto_id uuid;
  paperino_id uuid;
  pompa_calore_id uuid;
  isolamento_id uuid;
  pannelli_id uuid;
  infissi_id uuid;
  audit_id uuid;
  batterie_id uuid;
BEGIN
  -- Ottieni gli ID dei tipi di intervento
  SELECT id INTO pompa_calore_id FROM intervention_types WHERE name = 'Pompa di Calore';
  SELECT id INTO isolamento_id FROM intervention_types WHERE name = 'Isolamento Termico';
  SELECT id INTO pannelli_id FROM intervention_types WHERE name = 'Pannelli Solari';
  SELECT id INTO infissi_id FROM intervention_types WHERE name = 'Sostituzione Infissi';
  SELECT id INTO audit_id FROM intervention_types WHERE name = 'Audit Energetico';
  SELECT id INTO batterie_id FROM intervention_types WHERE name = 'Batterie di Accumulo';

  -- Crea partner Pippo (gestisce tutti gli interventi)
  INSERT INTO partners (company_name, description, contact_email, contact_phone, rating, is_active)
  VALUES (
    'Pippo Energia S.r.l.',
    'Azienda leader nell''efficienza energetica con oltre 20 anni di esperienza. Gestiamo tutti i tipi di interventi con professionalità e qualità certificata.',
    'info@pippoenergia.it',
    '+39 02 1234567',
    4.8,
    true
  )
  RETURNING id INTO pippo_id;

  -- Specializzazioni Pippo (tutti gli interventi)
  INSERT INTO partner_specializations (partner_id, intervention_type_id) VALUES
    (pippo_id, pompa_calore_id),
    (pippo_id, isolamento_id),
    (pippo_id, pannelli_id),
    (pippo_id, infissi_id),
    (pippo_id, audit_id),
    (pippo_id, batterie_id);

  -- Crea partner Pluto (pompe di calore, pannelli solari, batterie)
  INSERT INTO partners (company_name, description, contact_email, contact_phone, rating, is_active)
  VALUES (
    'Pluto Renewables',
    'Specialisti in energie rinnovabili e sistemi di riscaldamento innovativi. Focus su pompe di calore e fotovoltaico.',
    'contatti@plutorenewables.it',
    '+39 02 2345678',
    4.6,
    true
  )
  RETURNING id INTO pluto_id;

  -- Specializzazioni Pluto
  INSERT INTO partner_specializations (partner_id, intervention_type_id) VALUES
    (pluto_id, pompa_calore_id),
    (pluto_id, pannelli_id),
    (pluto_id, batterie_id);

  -- Crea partner Paperino (isolamento, infissi, audit)
  INSERT INTO partners (company_name, description, contact_email, contact_phone, rating, is_active)
  VALUES (
    'Paperino Edil Termo',
    'Esperti in riqualificazione energetica degli edifici. Specializzati in isolamenti termici e sostituzione infissi.',
    'info@paperinoedil.it',
    '+39 02 3456789',
    4.5,
    true
  )
  RETURNING id INTO paperino_id;

  -- Specializzazioni Paperino
  INSERT INTO partner_specializations (partner_id, intervention_type_id) VALUES
    (paperino_id, isolamento_id),
    (paperino_id, infissi_id),
    (paperino_id, audit_id);

END $$;