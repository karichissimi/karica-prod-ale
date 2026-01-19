-- Remove the insecure INSERT policy from user_roles
DROP POLICY IF EXISTS "Users can insert their own roles during signup" ON public.user_roles;

-- Create admin-only management policy for user_roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create partner_requests table for pending partner applications
CREATE TABLE IF NOT EXISTS public.partner_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  company_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  description text,
  intervention_types uuid[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on partner_requests
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

-- Users can create their own partner request
CREATE POLICY "Users can create their own partner request"
ON public.partner_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own partner request
CREATE POLICY "Users can view their own partner request"
ON public.partner_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view and manage all partner requests
CREATE POLICY "Admins can manage all partner requests"
ON public.partner_requests
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update trigger for partner_requests
CREATE TRIGGER update_partner_requests_updated_at
BEFORE UPDATE ON public.partner_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update partners INSERT policy to require partner role
DROP POLICY IF EXISTS "Users can create their partner profile" ON public.partners;
CREATE POLICY "Partners or admins can create partner profiles"
ON public.partners
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'partner') OR public.has_role(auth.uid(), 'admin'));

-- Update partner_specializations INSERT policy
DROP POLICY IF EXISTS "Partners can insert their specializations" ON public.partner_specializations;
CREATE POLICY "Partners or admins can insert specializations"
ON public.partner_specializations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'partner') OR public.has_role(auth.uid(), 'admin'));