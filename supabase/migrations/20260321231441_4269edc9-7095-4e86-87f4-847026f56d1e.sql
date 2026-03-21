
-- Add new columns to artefact_files
ALTER TABLE artefact_files
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS framework text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS author text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS file_size bigint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mime_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS version_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS parent_id uuid DEFAULT NULL REFERENCES artefact_files(id),
  ADD COLUMN IF NOT EXISTS is_current_version boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS collection text DEFAULT NULL;

-- Create artefact_pins table
CREATE TABLE IF NOT EXISTS artefact_pins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  artefact_id uuid NOT NULL REFERENCES artefact_files(id) ON DELETE CASCADE,
  pin_type text NOT NULL DEFAULT 'pin',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, artefact_id, pin_type)
);
ALTER TABLE artefact_pins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pins" ON artefact_pins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create artefact_comments table
CREATE TABLE IF NOT EXISTS artefact_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artefact_id uuid NOT NULL REFERENCES artefact_files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE artefact_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth users can view comments" ON artefact_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON artefact_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON artefact_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins manage comments" ON artefact_comments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
