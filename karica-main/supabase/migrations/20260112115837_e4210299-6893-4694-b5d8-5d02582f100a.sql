-- Add partner onboarding tracking columns to partners table
ALTER TABLE public.partners 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
ADD COLUMN IF NOT EXISTS business_document_url text,
ADD COLUMN IF NOT EXISTS vat_number text,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- Create index for faster queries on onboarding status
CREATE INDEX IF NOT EXISTS idx_partners_onboarding ON public.partners(user_id, onboarding_completed);

COMMENT ON COLUMN public.partners.onboarding_completed IS 'Whether the partner has completed the onboarding process';
COMMENT ON COLUMN public.partners.business_document_url IS 'URL to uploaded business registration document';
COMMENT ON COLUMN public.partners.vat_number IS 'Partner VAT number (Partita IVA)';
COMMENT ON COLUMN public.partners.terms_accepted_at IS 'When partner accepted B2B terms and conditions';