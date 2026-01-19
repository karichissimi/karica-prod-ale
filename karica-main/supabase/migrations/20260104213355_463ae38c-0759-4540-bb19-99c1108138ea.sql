
-- =====================================================
-- FASE 1: CORREZIONI CRITICHE
-- =====================================================

-- 1.1 Aggiungere user_id alla tabella partners per collegamento utente-partner
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1.2 Creare indici per performance su colonne frequentemente filtrate
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_partner_id ON public.leads(partner_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_energy_readings_user_id ON public.energy_readings(user_id);
CREATE INDEX IF NOT EXISTS idx_energy_readings_timestamp ON public.energy_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_energy_readings_device_id ON public.energy_readings(device_id);

CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_type ON public.devices(type);

CREATE INDEX IF NOT EXISTS idx_interventions_user_id ON public.interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_interventions_status ON public.interventions(status);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(onboarding_completed);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

CREATE INDEX IF NOT EXISTS idx_partner_requests_status ON public.partner_requests(status);
CREATE INDEX IF NOT EXISTS idx_partner_requests_user_id ON public.partner_requests(user_id);

-- 1.3 Aggiornare policy RLS per partners con user_id
DROP POLICY IF EXISTS "Partners can update their own profile" ON public.partners;
CREATE POLICY "Partners can update their own profile" 
ON public.partners 
FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partners can view their own profile" ON public.partners;
CREATE POLICY "Partners can view their own profile" 
ON public.partners 
FOR SELECT 
USING (auth.uid() = user_id);

-- =====================================================
-- FASE 2: MIGLIORAMENTI STRUTTURALI
-- =====================================================

-- 2.1 Creare tabella notifiche
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info', -- info, success, warning, error, lead, cer
  read boolean NOT NULL DEFAULT false,
  action_url text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone
);

-- Indici per notifiche
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS per notifiche
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- 2.2 Aggiungere colonne updated_at mancanti
ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.automation_rules 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.cer_memberships 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.bill_uploads 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.lead_messages 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.intervention_types 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2.3 Aggiungere soft delete (deleted_at) alle tabelle principali
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.interventions 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.devices 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS deleted_at timestamp with time zone;

-- Indici per soft delete
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON public.leads(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_interventions_deleted_at ON public.interventions(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_devices_deleted_at ON public.devices(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_partners_deleted_at ON public.partners(deleted_at) WHERE deleted_at IS NULL;

-- 2.4 Creare trigger per aggiornamento automatico updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Applicare trigger a tutte le tabelle con updated_at
DROP TRIGGER IF EXISTS set_updated_at ON public.devices;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.devices
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.interventions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.interventions
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.automation_rules;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.automation_rules
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.cer_memberships;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.cer_memberships
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.bill_uploads;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bill_uploads
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.lead_messages;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.lead_messages
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.leads;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.partners;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- =====================================================
-- FASE 3: SCALABILITÀ
-- =====================================================

-- 3.1 Creare vista per statistiche utente (evita query ripetitive)
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.email,
  p.onboarding_completed,
  p.cer_onboarding_completed,
  COALESCE(up.points, 0) as total_points,
  COALESCE(up.level, 1) as level,
  (SELECT COUNT(*) FROM public.leads l WHERE l.user_id = p.id AND l.deleted_at IS NULL) as total_leads,
  (SELECT COUNT(*) FROM public.leads l WHERE l.user_id = p.id AND l.status = 'completed' AND l.deleted_at IS NULL) as completed_leads,
  (SELECT COUNT(*) FROM public.interventions i WHERE i.user_id = p.id AND i.deleted_at IS NULL) as total_interventions,
  (SELECT COUNT(*) FROM public.devices d WHERE d.user_id = p.id AND d.deleted_at IS NULL) as total_devices,
  (SELECT COALESCE(SUM(er.consumption_kwh), 0) FROM public.energy_readings er WHERE er.user_id = p.id) as total_consumption_kwh
FROM public.profiles p
LEFT JOIN public.user_points up ON up.user_id = p.id;

-- RLS per la vista (gli utenti vedono solo le proprie statistiche)
-- Le viste ereditano le RLS delle tabelle sottostanti

-- 3.2 Creare vista per dashboard partner
CREATE OR REPLACE VIEW public.partner_dashboard AS
SELECT 
  pa.id as partner_id,
  pa.company_name,
  pa.user_id,
  pa.rating,
  pa.is_active,
  (SELECT COUNT(*) FROM public.leads l WHERE l.partner_id = pa.id AND l.deleted_at IS NULL) as total_leads,
  (SELECT COUNT(*) FROM public.leads l WHERE l.partner_id = pa.id AND l.status = 'new' AND l.deleted_at IS NULL) as new_leads,
  (SELECT COUNT(*) FROM public.leads l WHERE l.partner_id = pa.id AND l.status = 'in_progress' AND l.deleted_at IS NULL) as in_progress_leads,
  (SELECT COUNT(*) FROM public.leads l WHERE l.partner_id = pa.id AND l.status = 'completed' AND l.deleted_at IS NULL) as completed_leads,
  (SELECT array_agg(DISTINCT it.name) FROM public.partner_specializations ps 
   JOIN public.intervention_types it ON it.id = ps.intervention_type_id 
   WHERE ps.partner_id = pa.id) as specializations
FROM public.partners pa
WHERE pa.deleted_at IS NULL;

-- 3.3 Creare vista per statistiche CER
CREATE OR REPLACE VIEW public.cer_statistics AS
SELECT 
  c.id as community_id,
  c.name as community_name,
  c.total_members,
  c.total_energy_shared,
  (SELECT COUNT(*) FROM public.cer_memberships cm WHERE cm.community_id = c.id) as active_members,
  (SELECT COALESCE(SUM(cm.energy_contributed), 0) FROM public.cer_memberships cm WHERE cm.community_id = c.id) as total_contributed
FROM public.cer_communities c;

-- 3.4 Funzione per calcolare statistiche aggregate (ottimizzata)
CREATE OR REPLACE FUNCTION public.get_user_dashboard_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_consumption_kwh', COALESCE((
      SELECT SUM(consumption_kwh) 
      FROM energy_readings 
      WHERE user_id = p_user_id 
      AND timestamp >= date_trunc('month', CURRENT_DATE)
    ), 0),
    'total_cost_eur', COALESCE((
      SELECT SUM(cost_eur) 
      FROM energy_readings 
      WHERE user_id = p_user_id 
      AND timestamp >= date_trunc('month', CURRENT_DATE)
    ), 0),
    'active_devices', (
      SELECT COUNT(*) 
      FROM devices 
      WHERE user_id = p_user_id 
      AND deleted_at IS NULL
    ),
    'pending_interventions', (
      SELECT COUNT(*) 
      FROM interventions 
      WHERE user_id = p_user_id 
      AND status = 'pending' 
      AND deleted_at IS NULL
    ),
    'unread_notifications', (
      SELECT COUNT(*) 
      FROM notifications 
      WHERE user_id = p_user_id 
      AND read = false
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 3.5 Abilitare realtime per notifiche
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
