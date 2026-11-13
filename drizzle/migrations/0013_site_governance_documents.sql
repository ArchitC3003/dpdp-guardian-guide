CREATE TABLE public.site_governance_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'legal',
  version text NOT NULL DEFAULT 'v1.0',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  effective_date date,
  is_material_change boolean NOT NULL DEFAULT false,
  summary_of_changes text,
  intro text,
  sections jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sections) = 'array'),
  created_by uuid,
  updated_by uuid,
  published_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX site_gov_one_published ON public.site_governance_documents(slug) WHERE status = 'published';
CREATE UNIQUE INDEX site_gov_slug_version ON public.site_governance_documents(slug, version);

GRANT SELECT ON public.site_governance_documents TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_governance_documents TO authenticated;
GRANT ALL ON public.site_governance_documents TO service_role;
ALTER TABLE public.site_governance_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published governance docs are public" ON public.site_governance_documents
  FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Publishers read all governance docs" ON public.site_governance_documents
  FOR SELECT TO authenticated USING (public.is_content_publisher(auth.uid()));
CREATE POLICY "Publishers create governance drafts" ON public.site_governance_documents
  FOR INSERT TO authenticated WITH CHECK (public.is_content_publisher(auth.uid()) AND status = 'draft');
CREATE POLICY "Publishers edit drafts" ON public.site_governance_documents
  FOR UPDATE TO authenticated USING (public.is_content_publisher(auth.uid()) AND status = 'draft')
  WITH CHECK (public.is_content_publisher(auth.uid()) AND status = 'draft');
CREATE POLICY "Publishers delete drafts" ON public.site_governance_documents
  FOR DELETE TO authenticated USING (public.is_content_publisher(auth.uid()) AND status = 'draft');

CREATE TRIGGER site_gov_updated_at BEFORE UPDATE ON public.site_governance_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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
    VALUES (auth.uid(), 'admin', 'governance_document_published', 'site_governance_document', d.id,
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
    VALUES (auth.uid(), 'admin', 'governance_document_withdrawn', 'site_governance_document', d.id, 'published', 'archived');
  RETURN d;
END $$;

REVOKE ALL ON FUNCTION public.rpc_publish_governance_document(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_unpublish_governance_document(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_publish_governance_document(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_unpublish_governance_document(uuid) TO authenticated;