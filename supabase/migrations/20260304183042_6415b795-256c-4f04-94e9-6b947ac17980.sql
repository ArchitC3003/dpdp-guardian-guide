
-- Create storage bucket for repository file uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('repository-files', 'repository-files', false);

-- Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload repository files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'repository-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own repository files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'repository-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own repository files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'repository-files' AND (storage.foldername(name))[1] = auth.uid()::text);
