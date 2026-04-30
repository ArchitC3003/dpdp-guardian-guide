-- Global department list (admin-managed, app-wide)
CREATE TABLE public.global_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.global_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active global_departments"
  ON public.global_departments FOR SELECT
  TO authenticated
  USING (is_active = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert global_departments"
  ON public.global_departments FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update global_departments"
  ON public.global_departments FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete global_departments"
  ON public.global_departments FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_global_departments_updated_at
  BEFORE UPDATE ON public.global_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with current built-in list
INSERT INTO public.global_departments (name, display_order) VALUES
  ('HR', 0),
  ('IT/Engg', 1),
  ('Legal/Compliance', 2),
  ('Marketing', 3),
  ('Product', 4),
  ('Operations', 5),
  ('Finance', 6),
  ('Admin', 7),
  ('Customer Service', 8);

-- Per-assessment custom departments (any assessment owner can add)
CREATE TABLE public.assessment_custom_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL,
  name text NOT NULL,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, name)
);

ALTER TABLE public.assessment_custom_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select all assessment_custom_departments"
  ON public.assessment_custom_departments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert assessment_custom_departments"
  ON public.assessment_custom_departments FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete assessment_custom_departments"
  ON public.assessment_custom_departments FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own assessment_custom_departments"
  ON public.assessment_custom_departments FOR SELECT
  USING (EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_custom_departments.assessment_id AND assessments.user_id = auth.uid()));

CREATE POLICY "Users can insert own assessment_custom_departments"
  ON public.assessment_custom_departments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_custom_departments.assessment_id AND assessments.user_id = auth.uid()));

CREATE POLICY "Users can delete own assessment_custom_departments"
  ON public.assessment_custom_departments FOR DELETE
  USING (EXISTS (SELECT 1 FROM assessments WHERE assessments.id = assessment_custom_departments.assessment_id AND assessments.user_id = auth.uid()));

CREATE POLICY "Shared assessment_custom_departments read"
  ON public.assessment_custom_departments FOR SELECT
  USING (EXISTS (SELECT 1 FROM shared_reports WHERE shared_reports.assessment_id = assessment_custom_departments.assessment_id AND shared_reports.is_active = true));
