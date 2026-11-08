CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. shared_reports: hash codes
ALTER TABLE public.shared_reports ADD COLUMN IF NOT EXISTS share_code_hash text;
UPDATE public.shared_reports SET share_code_hash = encode(extensions.digest(upper(trim(share_code)), 'sha256'), 'hex') WHERE share_code_hash IS NULL AND share_code IS NOT NULL;
ALTER TABLE public.shared_reports ALTER COLUMN share_code DROP NOT NULL;
UPDATE public.shared_reports SET share_code = NULL WHERE share_code IS NOT NULL;
COMMENT ON COLUMN public.shared_reports.share_code IS 'DEPRECATED: plaintext no longer stored; use share_code_hash';
CREATE UNIQUE INDEX IF NOT EXISTS shared_reports_share_code_hash_key ON public.shared_reports(share_code_hash);
DROP POLICY IF EXISTS "Anyone can view active shared reports by code" ON public.shared_reports;

-- 2. access log
CREATE TABLE IF NOT EXISTS public.shared_report_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shared_report_id uuid NOT NULL REFERENCES public.shared_reports(id) ON DELETE CASCADE,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  ip_hash text,
  user_agent text
);
GRANT SELECT ON public.shared_report_access_log TO authenticated;
GRANT ALL ON public.shared_report_access_log TO service_role;
ALTER TABLE public.shared_report_access_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view share access log" ON public.shared_report_access_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. drop shared child policies
DROP POLICY IF EXISTS "Shared assessment_checks read" ON public.assessment_checks;
DROP POLICY IF EXISTS "Shared assessment_departments read" ON public.assessment_departments;
DROP POLICY IF EXISTS "Shared dept_grid read" ON public.dept_grid;
DROP POLICY IF EXISTS "Shared dept_question_responses read" ON public.dept_question_responses;
DROP POLICY IF EXISTS "Shared dept_app_inventory read" ON public.dept_app_inventory;
DROP POLICY IF EXISTS "Shared file_references read" ON public.file_references;
DROP POLICY IF EXISTS "Shared assessment_versions read" ON public.assessment_versions;
DROP POLICY IF EXISTS "Shared policy_items read" ON public.policy_items;
DROP POLICY IF EXISTS "Shared assessment read via share code" ON public.assessments;

-- 4. RPCs
CREATE OR REPLACE FUNCTION public.get_shared_report(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_hash text; r record; h jsonb; ip text; ua text;
BEGIN
  IF p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RAISE EXCEPTION 'Invalid or expired share code' USING ERRCODE = 'P0002';
  END IF;
  v_hash := encode(extensions.digest(upper(trim(p_code)), 'sha256'), 'hex');
  SELECT sr.id, sr.shared_at, sr.expires_at, a.org_name, a.status INTO r
  FROM public.shared_reports sr JOIN public.assessments a ON a.id = sr.assessment_id
  WHERE sr.share_code_hash = v_hash AND sr.is_active AND (sr.expires_at IS NULL OR sr.expires_at > now());
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired share code' USING ERRCODE = 'P0002';
  END IF;
  BEGIN
    h := nullif(current_setting('request.headers', true), '')::jsonb;
    ip := coalesce(split_part(h->>'x-forwarded-for', ',', 1), h->>'cf-connecting-ip');
    ua := left(h->>'user-agent', 512);
  EXCEPTION WHEN OTHERS THEN ip := NULL; ua := NULL; END;
  INSERT INTO public.shared_report_access_log (shared_report_id, ip_hash, user_agent)
  VALUES (r.id, CASE WHEN ip IS NULL THEN NULL ELSE encode(extensions.digest(trim(ip), 'sha256'), 'hex') END, ua);
  RETURN jsonb_build_object('id', r.id, 'shared_at', r.shared_at, 'expires_at', r.expires_at, 'org_name', r.org_name, 'status', r.status);
END $$;
REVOKE EXECUTE ON FUNCTION public.get_shared_report(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_report(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.create_shared_report(p_assessment_id uuid, p_expires_at timestamptz DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE v_code text; alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea; i int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.assessments WHERE id = p_assessment_id AND (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  b := extensions.gen_random_bytes(12); v_code := '';
  FOR i IN 0..11 LOOP v_code := v_code || substr(alphabet, (get_byte(b,i) % 32) + 1, 1); END LOOP;
  INSERT INTO public.shared_reports (assessment_id, share_code_hash, shared_by, expires_at)
  VALUES (p_assessment_id, encode(extensions.digest(v_code, 'sha256'), 'hex'), auth.uid(), coalesce(p_expires_at, now() + interval '30 days'));
  RETURN v_code;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_shared_report(uuid, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_shared_report(uuid, timestamptz) TO authenticated;

-- 5. has_role lockdown + current_user_has_role
CREATE OR REPLACE FUNCTION public.current_user_has_role(_role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = _role)
$$;
REVOKE EXECUTE ON FUNCTION public.current_user_has_role(app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(app_role) TO authenticated;

-- policies on {public} that call has_role -> authenticated only (anon would fail after revoke)
ALTER POLICY "Admins can select all policy_documents" ON public.policy_documents TO authenticated;
ALTER POLICY "Admins can update all policy_documents" ON public.policy_documents TO authenticated;
ALTER POLICY "Admins can delete all policy_documents" ON public.policy_documents TO authenticated;
ALTER POLICY "Admins can select all policy_versions" ON public.policy_versions TO authenticated;
ALTER POLICY "Admins can update all policy_versions" ON public.policy_versions TO authenticated;
ALTER POLICY "Admins can select all audit_log" ON public.policy_audit_log TO authenticated;
ALTER POLICY "Admins can insert user_roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can update user_roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can delete user_roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can select all user_roles" ON public.user_roles TO authenticated;
ALTER POLICY "Admins can manage snapshots" ON public.policy_builder_snapshots TO authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;