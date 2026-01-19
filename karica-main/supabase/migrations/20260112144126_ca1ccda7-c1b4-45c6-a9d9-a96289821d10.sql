-- Create partner_type enum
CREATE TYPE public.partner_type AS ENUM (
  'cer_president',
  'intervention',
  'marketplace'
);

-- Add partner_type column to partners table
ALTER TABLE public.partners
ADD COLUMN partner_type public.partner_type NOT NULL DEFAULT 'intervention';

-- Create index for faster queries
CREATE INDEX idx_partners_type ON public.partners(partner_type);

-- Add partner_type column to partner_requests table
ALTER TABLE public.partner_requests
ADD COLUMN partner_type public.partner_type NOT NULL DEFAULT 'intervention';

-- Create cer_managers table for CER Presidents
CREATE TABLE public.cer_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES public.cer_communities(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'president',
  cer_name TEXT,
  cer_fiscal_code TEXT,
  cer_address TEXT,
  member_count INTEGER,
  statute_document_url TEXT,
  appointment_document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(partner_id)
);

-- Enable RLS on cer_managers
ALTER TABLE public.cer_managers ENABLE ROW LEVEL SECURITY;

-- RLS policies for cer_managers
CREATE POLICY "Partners can view their own CER manager record"
ON public.cer_managers
FOR SELECT
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Partners can update their own CER manager record"
ON public.cer_managers
FOR UPDATE
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Partners or admins can insert CER manager records"
ON public.cer_managers
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage all CER manager records"
ON public.cer_managers
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on cer_managers
CREATE TRIGGER update_cer_managers_updated_at
  BEFORE UPDATE ON public.cer_managers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create marketplace_partners table
CREATE TABLE public.marketplace_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL UNIQUE,
  store_name TEXT NOT NULL,
  store_description TEXT,
  store_logo_url TEXT,
  shipping_policy TEXT,
  return_policy TEXT,
  fiscal_documents_url TEXT,
  product_categories TEXT[],
  catalog_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on marketplace_partners
ALTER TABLE public.marketplace_partners ENABLE ROW LEVEL SECURITY;

-- RLS policies for marketplace_partners
CREATE POLICY "Partners can view their own marketplace record"
ON public.marketplace_partners
FOR SELECT
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Partners can update their own marketplace record"
ON public.marketplace_partners
FOR UPDATE
USING (
  partner_id IN (
    SELECT id FROM public.partners WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Partners or admins can insert marketplace records"
ON public.marketplace_partners
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'partner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage all marketplace records"
ON public.marketplace_partners
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view approved marketplace partners"
ON public.marketplace_partners
FOR SELECT
USING (catalog_approved = true);

-- Create trigger for updated_at on marketplace_partners
CREATE TRIGGER update_marketplace_partners_updated_at
  BEFORE UPDATE ON public.marketplace_partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();