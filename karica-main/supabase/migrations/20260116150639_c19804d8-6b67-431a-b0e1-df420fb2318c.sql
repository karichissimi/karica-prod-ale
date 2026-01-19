-- Add message length constraint to lead_messages table
ALTER TABLE public.lead_messages 
ADD CONSTRAINT message_length_check 
CHECK (char_length(message) <= 5000);

-- Add a constraint to ensure message is not empty after trimming
ALTER TABLE public.lead_messages
ADD CONSTRAINT message_not_empty_check
CHECK (length(trim(message)) > 0);