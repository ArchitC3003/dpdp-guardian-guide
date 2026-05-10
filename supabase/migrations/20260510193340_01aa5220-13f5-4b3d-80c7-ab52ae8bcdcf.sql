CREATE TABLE public.execute_workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  org_name TEXT NOT NULL,
  trade_name TEXT,
  group_structure TEXT,
  footprint TEXT[] NOT NULL DEFAULT '{}',
  employee_band TEXT NOT NULL,
  principals_band TEXT NOT NULL,
  primary_role TEXT NOT NULL,
  selected_sector_ids TEXT[] NOT NULL DEFAULT '{}',
  triggered_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  crosswalk_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.execute_workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own workspaces"
ON public.execute_workspaces FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own workspaces"
ON public.execute_workspaces FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own workspaces"
ON public.execute_workspaces FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own workspaces"
ON public.execute_workspaces FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_execute_workspaces_updated_at
BEFORE UPDATE ON public.execute_workspaces
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_execute_workspaces_user_id ON public.execute_workspaces(user_id);