CREATE TABLE public.policy_builder_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_type TEXT,
  org_context JSONB,
  generated_content TEXT,
  version_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  change_notes TEXT
);
ALTER TABLE public.policy_builder_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own snapshots" ON public.policy_builder_snapshots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own snapshots" ON public.policy_builder_snapshots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own snapshots" ON public.policy_builder_snapshots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage snapshots" ON public.policy_builder_snapshots FOR ALL USING (public.has_role(auth.uid(), 'admin'));