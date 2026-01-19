-- Add square_meters to home_analysis
ALTER TABLE public.home_analysis 
ADD COLUMN IF NOT EXISTS square_meters integer;

-- Add confidence_details for calculation transparency
ALTER TABLE public.home_analysis 
ADD COLUMN IF NOT EXISTS calculation_details jsonb;