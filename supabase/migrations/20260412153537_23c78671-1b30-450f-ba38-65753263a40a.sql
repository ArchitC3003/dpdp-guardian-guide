
CREATE TABLE public.framework_policy_artefacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES public.assessment_frameworks(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  category_name TEXT NOT NULL,
  item_code TEXT NOT NULL,
  artefact_name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (framework_id, item_code)
);

ALTER TABLE public.framework_policy_artefacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active policy artefacts"
  ON public.framework_policy_artefacts
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert policy artefacts"
  ON public.framework_policy_artefacts
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update policy artefacts"
  ON public.framework_policy_artefacts
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete policy artefacts"
  ON public.framework_policy_artefacts
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
