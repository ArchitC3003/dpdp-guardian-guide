
ALTER TABLE public.policy_items
  ADD COLUMN IF NOT EXISTS framework_id UUID REFERENCES public.assessment_frameworks(id);
