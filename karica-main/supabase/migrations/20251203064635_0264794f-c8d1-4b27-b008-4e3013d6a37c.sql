-- Allow admins to update partners
CREATE POLICY "Admins can update partners"
ON public.partners
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to view all partners (including inactive)
CREATE POLICY "Admins can view all partners"
ON public.partners
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));