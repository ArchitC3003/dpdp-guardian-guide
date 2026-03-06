-- Create artefact_files table for admin-uploaded documents
CREATE TABLE public.artefact_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  description text DEFAULT '',
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.artefact_files ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view (read-only for frontend users)
CREATE POLICY "Authenticated users can view artefact files"
  ON public.artefact_files FOR SELECT
  TO authenticated
  USING (true);

-- Create storage bucket for artefact files (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('artefact-files', 'artefact-files', true);

-- Allow authenticated users to download artefact files
CREATE POLICY "Authenticated users can read artefact files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'artefact-files');

-- Allow service role to upload (admin backend)
CREATE POLICY "Service role can upload artefact files"
  ON storage.objects FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'artefact-files');

CREATE POLICY "Service role can delete artefact files"
  ON storage.objects FOR DELETE
  TO service_role
  USING (bucket_id = 'artefact-files');