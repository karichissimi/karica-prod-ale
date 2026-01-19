-- Enable realtime for leads table to track status changes
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;