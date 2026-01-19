-- Add onboarding fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS pod TEXT,
ADD COLUMN IF NOT EXISTS energy_supplier TEXT,
ADD COLUMN IF NOT EXISTS annual_consumption_kwh NUMERIC,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create user_consents table for granular consent management
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_consent BOOLEAN NOT NULL DEFAULT FALSE,
  monitoring_consent BOOLEAN NOT NULL DEFAULT FALSE,
  marketing_consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_consents
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_consents
CREATE POLICY "Users can view own consents"
ON public.user_consents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
ON public.user_consents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consents"
ON public.user_consents
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating user_consents updated_at
CREATE TRIGGER update_user_consents_updated_at
BEFORE UPDATE ON public.user_consents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create bill_uploads table to store uploaded bills
CREATE TABLE IF NOT EXISTS public.bill_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  ocr_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on bill_uploads
ALTER TABLE public.bill_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for bill_uploads
CREATE POLICY "Users can view own bills"
ON public.bill_uploads
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bills"
ON public.bill_uploads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for bill uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('bills', 'bills', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for bills bucket
CREATE POLICY "Users can upload their own bills"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'bills' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own bills"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'bills' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);