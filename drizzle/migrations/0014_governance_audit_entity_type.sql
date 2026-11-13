CREATE OR REPLACE FUNCTION public.rpc_publish_governance_document(doc_id uuid)
RETURNS public.site_governance_documents
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE d public.site_governance_documents; prev uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_content_publisher(auth.uid()) THEN
    RAISE EXCEPTION 'Only Super Admins and GRC Managers can publish' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO d FROM public.site_governance_documents WHERE id = doc_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Document not found'; END IF;
  IF d.status <> 'draft' THEN RAISE EXCEPTION 'Only drafts can be published' USING ERRCODE = '22023'; END IF;
  IF jsonb_array_length(d.sections) = 0 THEN RAISE EXCEPTION 'Add at least one section before publishing' USING ERRCODE = '22023'; END IF;
  UPDATE public.site_governance_documents SET status = 'archived' WHERE slug = d.slug AND status = 'published' RETURNING id INTO prev;
  UPDATE public.site_governance_documents SET status = 'published', published_at = now(), published_by = auth.uid(),
    effective_date = coalesce(effective_date, (now() AT TIME ZONE 'Asia/Kolkata')::date)
    WHERE id = doc_id RETURNING * INTO d;
  INSERT INTO public.consent_audit_log (actor_id, actor_type, action, entity_type, entity_id, previous_state, new_state, notes)
    VALUES (auth.uid(), 'admin', 'governance_document_published', 'Notice', d.id,
      prev::text, d.slug || ' ' || d.version, d.summary_of_changes);
  RETURN d;
END $$;

CREATE OR REPLACE FUNCTION public.rpc_unpublish_governance_document(doc_id uuid)
RETURNS public.site_governance_documents
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE d public.site_governance_documents;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_content_publisher(auth.uid()) THEN
    RAISE EXCEPTION 'Only Super Admins and GRC Managers can withdraw' USING ERRCODE = '42501';
  END IF;
  UPDATE public.site_governance_documents SET status = 'archived' WHERE id = doc_id AND status = 'published' RETURNING * INTO d;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Document is not published'; END IF;
  INSERT INTO public.consent_audit_log (actor_id, actor_type, action, entity_type, entity_id, previous_state, new_state)
    VALUES (auth.uid(), 'admin', 'governance_document_withdrawn', 'Notice', d.id, 'published', 'archived');
  RETURN d;
END $$;