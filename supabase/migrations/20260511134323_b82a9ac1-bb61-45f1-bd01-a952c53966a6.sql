
-- 1. universal_question_templates
CREATE TABLE public.universal_question_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id text UNIQUE NOT NULL,
  category text NOT NULL,
  display_order int NOT NULL,
  question_text text NOT NULL,
  processor_text text,
  joint_text text,
  dual_note text,
  applicable_to_roles text[] DEFAULT '{fiduciary,processor,joint}',
  dept_specific_only text,
  dpdp_section_ref text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.universal_question_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read universal_question_templates"
  ON public.universal_question_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert universal_question_templates"
  ON public.universal_question_templates FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update universal_question_templates"
  ON public.universal_question_templates FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete universal_question_templates"
  ON public.universal_question_templates FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. dept_templates
CREATE TABLE public.dept_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_code text UNIQUE NOT NULL,
  dept_name text NOT NULL,
  doc_ref text,
  is_system boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  ai_generated boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dept_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read dept_templates"
  ON public.dept_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins or owners insert dept_templates"
  ON public.dept_templates FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role)
              OR (created_by = auth.uid() AND is_system = false));
CREATE POLICY "Admins or owners update dept_templates"
  ON public.dept_templates FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)
         OR (created_by = auth.uid() AND is_system = false));
CREATE POLICY "Admins or owners delete dept_templates"
  ON public.dept_templates FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)
         OR (created_by = auth.uid() AND is_system = false));

-- 3. dept_question_extras
CREATE TABLE public.dept_question_extras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dept_code text NOT NULL REFERENCES public.dept_templates(dept_code) ON DELETE CASCADE,
  question_id text NOT NULL,
  category text NOT NULL,
  display_order int NOT NULL,
  question_text text NOT NULL,
  processor_text text,
  dpdp_section_ref text,
  UNIQUE (dept_code, question_id)
);
ALTER TABLE public.dept_question_extras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read dept_question_extras"
  ON public.dept_question_extras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert dept_question_extras"
  ON public.dept_question_extras FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update dept_question_extras"
  ON public.dept_question_extras FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete dept_question_extras"
  ON public.dept_question_extras FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. assessment_departments
CREATE TABLE public.assessment_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  dept_code text NOT NULL REFERENCES public.dept_templates(dept_code),
  dept_name text NOT NULL,
  rep_name text,
  rep_email text,
  interview_date date,
  interviewer_name text,
  status text NOT NULL DEFAULT 'not_started',
  completion_pct int NOT NULL DEFAULT 0,
  high_risk_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view assessment_departments"
  ON public.assessment_departments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = assessment_departments.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners insert assessment_departments"
  ON public.assessment_departments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a
                      WHERE a.id = assessment_departments.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners update assessment_departments"
  ON public.assessment_departments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = assessment_departments.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners delete assessment_departments"
  ON public.assessment_departments FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = assessment_departments.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Admins all assessment_departments"
  ON public.assessment_departments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Shared assessment_departments read"
  ON public.assessment_departments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shared_reports sr
                 WHERE sr.assessment_id = assessment_departments.assessment_id AND sr.is_active = true));
CREATE TRIGGER trg_assessment_departments_updated
  BEFORE UPDATE ON public.assessment_departments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. dept_question_responses
CREATE TABLE public.dept_question_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  dept_assessment_id uuid NOT NULL REFERENCES public.assessment_departments(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  response_text text,
  status text,
  risk_level text,
  evidence_tools text,
  assessor_notes text,
  role_context text,
  ai_suggested_response text,
  ai_risk_flag text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dept_question_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view dept_question_responses"
  ON public.dept_question_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = dept_question_responses.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners insert dept_question_responses"
  ON public.dept_question_responses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a
                      WHERE a.id = dept_question_responses.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners update dept_question_responses"
  ON public.dept_question_responses FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = dept_question_responses.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners delete dept_question_responses"
  ON public.dept_question_responses FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = dept_question_responses.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Admins all dept_question_responses"
  ON public.dept_question_responses FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Shared dept_question_responses read"
  ON public.dept_question_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shared_reports sr
                 WHERE sr.assessment_id = dept_question_responses.assessment_id AND sr.is_active = true));
CREATE TRIGGER trg_dept_question_responses_updated
  BEFORE UPDATE ON public.dept_question_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. dept_app_inventory
CREATE TABLE public.dept_app_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  dept_assessment_id uuid NOT NULL REFERENCES public.assessment_departments(id) ON DELETE CASCADE,
  dept_code text,
  app_vendor_name text NOT NULL,
  type text,
  function_supported text,
  data_processed_description text,
  personal_data_categories text[] DEFAULT '{}',
  dpa_status text,
  security_assessment_status text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dept_app_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners view dept_app_inventory"
  ON public.dept_app_inventory FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = dept_app_inventory.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners insert dept_app_inventory"
  ON public.dept_app_inventory FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a
                      WHERE a.id = dept_app_inventory.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners update dept_app_inventory"
  ON public.dept_app_inventory FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = dept_app_inventory.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners delete dept_app_inventory"
  ON public.dept_app_inventory FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.assessments a
                 WHERE a.id = dept_app_inventory.assessment_id AND a.user_id = auth.uid()));
CREATE POLICY "Admins all dept_app_inventory"
  ON public.dept_app_inventory FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Shared dept_app_inventory read"
  ON public.dept_app_inventory FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shared_reports sr
                 WHERE sr.assessment_id = dept_app_inventory.assessment_id AND sr.is_active = true));

CREATE INDEX idx_assessment_departments_assessment ON public.assessment_departments(assessment_id);
CREATE INDEX idx_dept_question_responses_dept_assessment ON public.dept_question_responses(dept_assessment_id);
CREATE INDEX idx_dept_app_inventory_dept_assessment ON public.dept_app_inventory(dept_assessment_id);
