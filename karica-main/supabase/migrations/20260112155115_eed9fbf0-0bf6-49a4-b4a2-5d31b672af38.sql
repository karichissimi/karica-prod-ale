-- Create partner-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-documents', 'partner-documents', false);

-- Policy: Partners can upload their documents
CREATE POLICY "Partners can upload their documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'partner-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Partners can view their documents
CREATE POLICY "Partners can view their documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'partner-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Partners can delete their documents
CREATE POLICY "Partners can delete their documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'partner-documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);