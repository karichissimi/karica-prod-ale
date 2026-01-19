
-- Correzione Security Definer View
-- Le viste devono usare SECURITY INVOKER (default) per rispettare RLS dell'utente

-- Ricreare le viste con SECURITY INVOKER esplicito

DROP VIEW IF EXISTS public.user_statistics;
CREATE VIEW public.user_statistics 
WITH (security_invoker = true)
AS
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

DROP VIEW IF EXISTS public.partner_dashboard;
CREATE VIEW public.partner_dashboard 
WITH (security_invoker = true)
AS
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

DROP VIEW IF EXISTS public.cer_statistics;
CREATE VIEW public.cer_statistics 
WITH (security_invoker = true)
AS
SELECT 
  c.id as community_id,
  c.name as community_name,
  c.total_members,
  c.total_energy_shared,
  (SELECT COUNT(*) FROM public.cer_memberships cm WHERE cm.community_id = c.id) as active_members,
  (SELECT COALESCE(SUM(cm.energy_contributed), 0) FROM public.cer_memberships cm WHERE cm.community_id = c.id) as total_contributed
FROM public.cer_communities c;
