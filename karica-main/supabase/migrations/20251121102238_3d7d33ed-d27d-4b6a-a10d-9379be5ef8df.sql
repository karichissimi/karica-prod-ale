-- Add CER onboarding status to profiles
ALTER TABLE public.profiles 
ADD COLUMN cer_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN cer_onboarding_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cer_onboarding_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cer_eligible BOOLEAN DEFAULT false;

-- Add CER specific consents table
CREATE TABLE IF NOT EXISTS public.cer_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_sharing_consent BOOLEAN NOT NULL DEFAULT false,
  terms_conditions_consent BOOLEAN NOT NULL DEFAULT false,
  cer_rules_consent BOOLEAN NOT NULL DEFAULT false,
  strong_id_completed BOOLEAN NOT NULL DEFAULT false,
  strong_id_method TEXT,
  strong_id_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on cer_consents
ALTER TABLE public.cer_consents ENABLE ROW LEVEL SECURITY;

-- RLS policies for cer_consents
CREATE POLICY "Users can view their own CER consents"
  ON public.cer_consents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CER consents"
  ON public.cer_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CER consents"
  ON public.cer_consents
  FOR UPDATE
  USING (auth.uid() = user_id);