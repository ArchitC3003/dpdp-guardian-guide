
-- Table: policy_documents
CREATE TABLE public.policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  document_type text NOT NULL DEFAULT 'policy',
  document_ref text NOT NULL,
  current_version text NOT NULL DEFAULT '1.0',
  status text NOT NULL DEFAULT 'Draft',
  classification text NOT NULL DEFAULT 'Confidential',
  selected_frameworks text[] DEFAULT '{}',
  industry_vertical text,
  org_size text,
  maturity_level integer DEFAULT 2,
  owner_name text,
  approver_name text,
  effective_date date,
  review_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: policy_versions
CREATE TABLE public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.policy_documents(id) ON DELETE CASCADE,
  version text NOT NULL DEFAULT '1.0',
  content text NOT NULL,
  change_summary text,
  generated_by text NOT NULL DEFAULT 'AI',
  ai_model text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_current boolean NOT NULL DEFAULT true
);

-- Table: policy_audit_log
CREATE TABLE public.policy_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.policy_documents(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.policy_versions(id) ON DELETE SET NULL,
  action text NOT NULL,
  action_detail text,
  performed_by uuid NOT NULL,
  performed_by_name text,
  performed_at timestamptz NOT NULL DEFAULT now(),
  ip_address text
);

-- Enable RLS
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: policy_documents
CREATE POLICY "Users can view own policy_documents" ON public.policy_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own policy_documents" ON public.policy_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own policy_documents" ON public.policy_documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own policy_documents" ON public.policy_documents FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can select all policy_documents" ON public.policy_documents FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all policy_documents" ON public.policy_documents FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete all policy_documents" ON public.policy_documents FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- RLS: policy_versions
CREATE POLICY "Users can view own policy_versions" ON public.policy_versions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.policy_documents WHERE id = policy_versions.document_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own policy_versions" ON public.policy_versions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.policy_documents WHERE id = policy_versions.document_id AND user_id = auth.uid())
);
CREATE POLICY "Users can update own policy_versions" ON public.policy_versions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.policy_documents WHERE id = policy_versions.document_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can select all policy_versions" ON public.policy_versions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update all policy_versions" ON public.policy_versions FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- RLS: policy_audit_log
CREATE POLICY "Users can view own audit_log" ON public.policy_audit_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.policy_documents WHERE id = policy_audit_log.document_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own audit_log" ON public.policy_audit_log FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.policy_documents WHERE id = policy_audit_log.document_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can select all audit_log" ON public.policy_audit_log FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER policy_documents_updated_at
  BEFORE UPDATE ON public.policy_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
