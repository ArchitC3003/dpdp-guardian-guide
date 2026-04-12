
CREATE TABLE public.framework_special_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES public.assessment_frameworks(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  flag_label TEXT NOT NULL,
  flag_hint TEXT,
  triggers_domain TEXT,
  triggers_requirement TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (framework_id, flag_key)
);

ALTER TABLE public.framework_special_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active special flags"
  ON public.framework_special_flags
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert special flags"
  ON public.framework_special_flags
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update special flags"
  ON public.framework_special_flags
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete special flags"
  ON public.framework_special_flags
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
