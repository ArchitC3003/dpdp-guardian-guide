
CREATE TABLE public.framework_dept_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES public.assessment_frameworks(id) ON DELETE CASCADE,
  control_id INTEGER NOT NULL,
  control_description TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'standard',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (framework_id, control_id)
);

ALTER TABLE public.framework_dept_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active dept controls"
  ON public.framework_dept_controls
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert dept controls"
  ON public.framework_dept_controls
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update dept controls"
  ON public.framework_dept_controls
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete dept controls"
  ON public.framework_dept_controls
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
