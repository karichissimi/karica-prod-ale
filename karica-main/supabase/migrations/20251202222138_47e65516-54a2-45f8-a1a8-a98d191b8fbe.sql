-- Allow authenticated users to insert their own partner profile
CREATE POLICY "Users can create their partner profile" 
ON public.partners 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow partners to update their own partner profile (by email match)
CREATE POLICY "Partners can update their own profile" 
ON public.partners 
FOR UPDATE 
USING (contact_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Allow authenticated users with partner role to insert specializations
CREATE POLICY "Partners can insert their specializations" 
ON public.partner_specializations 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);