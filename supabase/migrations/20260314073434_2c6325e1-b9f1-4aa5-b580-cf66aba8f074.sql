
-- Fix overly permissive INSERT policies on consent_audit_log
DROP POLICY "System can insert audit_log" ON public.consent_audit_log;
DROP POLICY "Anon can insert audit_log" ON public.consent_audit_log;

-- Only authenticated users or admins can insert audit log entries
CREATE POLICY "Authenticated can insert audit_log" ON public.consent_audit_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
