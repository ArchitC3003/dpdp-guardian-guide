ALTER TABLE public.artefact_files
  ADD COLUMN IF NOT EXISTS uploaded_by uuid;

COMMENT ON COLUMN public.artefact_files.uploaded_by IS
  'Authenticated owner used to scope repository metadata and storage access.';

UPDATE public.artefact_files af
SET uploaded_by = COALESCE(
  (SELECT so.owner_id::uuid FROM storage.objects so
   WHERE so.bucket_id = 'artefact-files' AND so.name = af.file_path
   LIMIT 1),
  '6f179d29-7a35-42d6-92ac-992444e82d23'::uuid
)
WHERE uploaded_by IS NULL;

ALTER TABLE public.artefact_files
  ALTER COLUMN uploaded_by SET DEFAULT auth.uid();
ALTER TABLE public.artefact_files
  ALTER COLUMN uploaded_by SET NOT NULL;

DROP POLICY IF EXISTS "Authenticated users can view artefact files" ON public.artefact_files;
CREATE POLICY "Owners and admins can view artefact files"
ON public.artefact_files FOR SELECT TO authenticated
USING (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert artefact files" ON public.artefact_files;
CREATE POLICY "Owners and admins can insert artefact files"
ON public.artefact_files FOR INSERT TO authenticated
WITH CHECK (uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Auth users can view comments" ON public.artefact_comments;
CREATE POLICY "Users can view comments for accessible files"
ON public.artefact_comments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.artefact_files af
  WHERE af.id = artefact_comments.artefact_id
    AND (af.uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));

DROP POLICY IF EXISTS "Anyone can read artefact storage files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read artefact files" ON storage.objects;
CREATE POLICY "Owners and admins can read artefact storage files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'artefact-files'
  AND EXISTS (
    SELECT 1 FROM public.artefact_files af
    WHERE af.file_path = name
      AND (af.uploaded_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  )
);

DROP POLICY IF EXISTS "Admins can upload artefact files" ON storage.objects;
CREATE POLICY "Owners and admins can upload artefact files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'artefact-files'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND (owner_id::uuid = auth.uid() OR public.has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "Read km artefacts" ON public.km_artefact_index;
CREATE POLICY "Read active km artefacts"
ON public.km_artefact_index FOR SELECT TO authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Insert km logs" ON public.km_query_log;
CREATE POLICY "Users insert own km logs"
ON public.km_query_log FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Read regulatory sources" ON public.regulatory_source_map;
CREATE POLICY "Read active regulatory sources"
ON public.regulatory_source_map FOR SELECT TO authenticated
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Authenticated read dept_templates" ON public.dept_templates;
CREATE POLICY "Authenticated read active dept templates"
ON public.dept_templates FOR SELECT TO authenticated
USING (is_active IS TRUE OR created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view mappings" ON public.cross_framework_mappings;
CREATE POLICY "Authenticated users view valid mappings"
ON public.cross_framework_mappings FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND source_requirement_id IS NOT NULL AND target_requirement_id IS NOT NULL);

DROP POLICY IF EXISTS "Service role can select ai_prompt_config" ON public.ai_prompt_config;
CREATE POLICY "Admins select ai prompt config"
ON public.ai_prompt_config FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated read dept_question_extras" ON public.dept_question_extras;
CREATE POLICY "Authenticated read extras for active departments"
ON public.dept_question_extras FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.dept_templates dt
  WHERE dt.dept_code = dept_question_extras.dept_code
    AND (dt.is_active IS TRUE OR dt.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'))
));

DROP POLICY IF EXISTS "Anyone can view template frameworks" ON public.assessment_template_frameworks;
CREATE POLICY "Authenticated users view active template frameworks"
ON public.assessment_template_frameworks FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1
  FROM public.assessment_templates at
  JOIN public.assessment_frameworks af ON af.id = assessment_template_frameworks.framework_id
  WHERE at.id = assessment_template_frameworks.template_id
    AND at.is_active IS TRUE
    AND af.is_active IS TRUE
));

DROP POLICY IF EXISTS "Anon can select framework_clause_library" ON public.framework_clause_library;
CREATE POLICY "Anon reads active framework clauses"
ON public.framework_clause_library FOR SELECT TO anon
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Anon can select ai_training_examples" ON public.ai_training_examples;
CREATE POLICY "Anon reads active ai training examples"
ON public.ai_training_examples FOR SELECT TO anon
USING (is_active IS TRUE);

DROP POLICY IF EXISTS "Auth can view translations" ON public.notice_translations;
CREATE POLICY "Authenticated users view published notice translations"
ON public.notice_translations FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.privacy_notices pn
  WHERE pn.id = notice_translations.notice_id
    AND pn.status IN ('published', 'active')
));

DROP POLICY IF EXISTS "Authenticated read universal_question_templates" ON public.universal_question_templates;
CREATE POLICY "Authenticated users read universal question templates"
ON public.universal_question_templates FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL);

ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = '';
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = '';
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = '';
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = '';
