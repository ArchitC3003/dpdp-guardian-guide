
-- 1. ai_prompt_config table
CREATE TABLE public.ai_prompt_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL UNIQUE,
  system_prompt text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  temperature numeric(3,2) NOT NULL DEFAULT 0.3,
  max_tokens integer NOT NULL DEFAULT 65536,
  output_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  banned_phrases jsonb NOT NULL DEFAULT '[]'::jsonb,
  assessment_template jsonb DEFAULT NULL,
  scoring_rubric jsonb DEFAULT NULL,
  updated_by uuid DEFAULT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_prompt_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select ai_prompt_config" ON public.ai_prompt_config
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ai_prompt_config" ON public.ai_prompt_config
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ai_prompt_config" ON public.ai_prompt_config
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ai_prompt_config" ON public.ai_prompt_config
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Edge functions need to read config without auth
CREATE POLICY "Service role can select ai_prompt_config" ON public.ai_prompt_config
  FOR SELECT TO anon USING (true);

-- 2. ai_training_examples table
CREATE TABLE public.ai_training_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  input_context text NOT NULL DEFAULT '',
  expected_output text NOT NULL DEFAULT '',
  doc_type text NOT NULL DEFAULT 'Policy',
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_training_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select ai_training_examples" ON public.ai_training_examples
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ai_training_examples" ON public.ai_training_examples
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ai_training_examples" ON public.ai_training_examples
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ai_training_examples" ON public.ai_training_examples
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can select ai_training_examples" ON public.ai_training_examples
  FOR SELECT TO anon USING (true);

-- 3. framework_clause_library table
CREATE TABLE public.framework_clause_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_name text NOT NULL,
  clause_ref text NOT NULL,
  clause_text text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.framework_clause_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select framework_clause_library" ON public.framework_clause_library
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert framework_clause_library" ON public.framework_clause_library
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update framework_clause_library" ON public.framework_clause_library
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete framework_clause_library" ON public.framework_clause_library
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anon can select framework_clause_library" ON public.framework_clause_library
  FOR SELECT TO anon USING (true);

-- 4. ai_output_feedback table
CREATE TABLE public.ai_output_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  prompt_version text DEFAULT NULL,
  rating text NOT NULL DEFAULT 'up',
  comment text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_output_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select ai_output_feedback" ON public.ai_output_feedback
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ai_output_feedback" ON public.ai_output_feedback
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ai_output_feedback" ON public.ai_output_feedback
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 5. ai_config_audit_log table
CREATE TABLE public.ai_config_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name text NOT NULL,
  changed_by uuid DEFAULT NULL,
  changed_at timestamp with time zone NOT NULL DEFAULT now(),
  old_prompt text DEFAULT NULL,
  new_prompt text DEFAULT NULL,
  change_summary text DEFAULT NULL
);

ALTER TABLE public.ai_config_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select ai_config_audit_log" ON public.ai_config_audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert ai_config_audit_log" ON public.ai_config_audit_log
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
