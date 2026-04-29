ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS dpdp_role text,
  ADD COLUMN IF NOT EXISTS is_joint_fiduciary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_dual_role boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS role_identified_at timestamptz;

ALTER TABLE public.assessments
  DROP CONSTRAINT IF EXISTS assessments_dpdp_role_check;

ALTER TABLE public.assessments
  ADD CONSTRAINT assessments_dpdp_role_check
  CHECK (dpdp_role IS NULL OR dpdp_role IN ('data_fiduciary','joint_data_fiduciary','data_processor','dual_role'));