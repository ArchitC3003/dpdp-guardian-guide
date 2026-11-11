DROP POLICY IF EXISTS "Shared assessment_custom_departments read" ON public.assessment_custom_departments;
--> statement-breakpoint
CREATE POLICY "Shared assessment_custom_departments read"
  ON public.assessment_custom_departments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.shared_reports sr
                 WHERE sr.assessment_id = assessment_custom_departments.assessment_id
                   AND sr.is_active = true
                   AND (sr.expires_at IS NULL OR sr.expires_at > now())));
