-- Remove the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Create a SECURITY DEFINER function for system/backend notification creation
CREATE OR REPLACE FUNCTION public.create_system_notification(
  target_user_id uuid,
  notification_title text,
  notification_message text,
  notification_type text DEFAULT 'info',
  notification_action_url text DEFAULT NULL,
  notification_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_notification_id uuid;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, action_url, metadata)
  VALUES (target_user_id, notification_title, notification_message, notification_type, notification_action_url, notification_metadata)
  RETURNING id INTO new_notification_id;
  
  RETURN new_notification_id;
END;
$$;

-- Revoke default execute from public, only service_role can call this
REVOKE EXECUTE ON FUNCTION public.create_system_notification FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_system_notification FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_system_notification FROM authenticated;

-- Create a restricted insert policy - users can only insert notifications for themselves (if needed for self-notifications)
CREATE POLICY "Users can insert own notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);