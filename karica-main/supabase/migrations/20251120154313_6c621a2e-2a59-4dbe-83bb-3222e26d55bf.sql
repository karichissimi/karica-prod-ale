-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('consumer', 'partner');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to assign default consumer role
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'consumer');
  RETURN NEW;
END;
$$;

-- Create trigger to assign default role on user creation
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles during signup"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Update leads RLS policies to allow partners to view assigned leads
CREATE POLICY "Partners can view their assigned leads"
  ON public.leads
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'partner'::app_role) 
    AND partner_id IN (
      SELECT id FROM partners WHERE id = partner_id
    )
  );

CREATE POLICY "Partners can update their assigned leads"
  ON public.leads
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'partner'::app_role)
    AND partner_id IN (
      SELECT id FROM partners WHERE id = partner_id
    )
  );

-- Update lead_messages RLS for partners
CREATE POLICY "Partners can send messages on assigned leads"
  ON public.lead_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'partner'
    AND EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_messages.lead_id
      AND public.has_role(auth.uid(), 'partner'::app_role)
    )
  );

CREATE POLICY "Partners can view messages on assigned leads"
  ON public.lead_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = lead_messages.lead_id
      AND (
        leads.user_id = auth.uid()
        OR (
          public.has_role(auth.uid(), 'partner'::app_role)
          AND leads.partner_id IN (SELECT id FROM partners)
        )
      )
    )
  );