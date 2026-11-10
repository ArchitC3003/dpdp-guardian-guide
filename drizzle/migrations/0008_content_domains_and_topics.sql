-- Learn repository: ten privacy domains, each holding topics. A post is filed under one primary topic
-- and may be cross-listed under others (any domain).
CREATE TABLE public.content_domains (
  code text PRIMARY KEY,
  number integer NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.content_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_code text NOT NULL REFERENCES public.content_domains(code) ON UPDATE CASCADE ON DELETE RESTRICT,
  slug text NOT NULL,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (domain_code, slug)
);
CREATE TABLE public.content_post_topics (
  post_id uuid NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES public.content_topics(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (post_id, topic_id)
);
CREATE UNIQUE INDEX content_post_topics_one_primary ON public.content_post_topics(post_id) WHERE is_primary;
CREATE INDEX content_post_topics_topic_idx ON public.content_post_topics(topic_id);

GRANT SELECT ON public.content_domains, public.content_topics, public.content_post_topics TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_domains, public.content_topics, public.content_post_topics TO authenticated;
GRANT ALL ON public.content_domains, public.content_topics, public.content_post_topics TO service_role;
ALTER TABLE public.content_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_post_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active domains" ON public.content_domains FOR SELECT TO anon, authenticated USING (is_active OR public.is_content_staff(auth.uid()));
CREATE POLICY "Publishers manage domains" ON public.content_domains FOR ALL TO authenticated
  USING (public.is_content_publisher(auth.uid())) WITH CHECK (public.is_content_publisher(auth.uid()));
-- Topics are shown to visitors only when a live post is filed under them (same rule as 0007 lookup reads); staff see all.
CREATE POLICY "Read topics of live content" ON public.content_topics FOR SELECT TO anon, authenticated USING (
  public.is_content_staff(auth.uid()) OR (is_active AND EXISTS (
    SELECT 1 FROM public.content_post_topics pt JOIN public.content_posts p ON p.id = pt.post_id
    WHERE pt.topic_id = content_topics.id
      AND ((p.status='published' AND COALESCE(p.published_at, now()) <= now()) OR (p.status='scheduled' AND p.scheduled_for IS NOT NULL AND p.scheduled_for <= now())))));
CREATE POLICY "Publishers manage topics" ON public.content_topics FOR ALL TO authenticated
  USING (public.is_content_publisher(auth.uid())) WITH CHECK (public.is_content_publisher(auth.uid()));
-- A filing is visible only when its post is visible to the reader (content_posts RLS applies inside the subquery).
CREATE POLICY "Filing visible with its post" ON public.content_post_topics FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.content_posts p WHERE p.id = post_id));
CREATE POLICY "Writers insert post topics" ON public.content_post_topics FOR INSERT TO authenticated WITH CHECK (public.is_content_writer(auth.uid()));
CREATE POLICY "Writers update post topics" ON public.content_post_topics FOR UPDATE TO authenticated USING (public.is_content_writer(auth.uid())) WITH CHECK (public.is_content_writer(auth.uid()));
CREATE POLICY "Writers delete post topics" ON public.content_post_topics FOR DELETE TO authenticated USING (public.is_content_writer(auth.uid()));

INSERT INTO public.content_domains (code, number, name) VALUES
 ('management',1,'Management'),('notice',2,'Notice'),('choice-consent',3,'Choice and Consent'),('collection',4,'Collection'),
 ('use-retention-disposal',5,'Use, Retention and Disposal'),('access',6,'Access'),('third-party-disclosure',7,'Third-party Disclosure'),
 ('security',8,'Security for Privacy'),('quality',9,'Quality'),('monitoring-enforcement',10,'Monitoring and Enforcement');

INSERT INTO public.content_topics (domain_code, slug, name, display_order)
SELECT d.code, trim(both '-' from regexp_replace(lower(t.name), '[^a-z0-9]+', '-', 'g')), t.name, (t.ord * 10)::int
FROM (VALUES
 ('management', ARRAY['Governance','Accountability','DPO','Policies','Training','Risk management']),
 ('notice', ARRAY['Transparency','Privacy notices','Layered notices','Communication']),
 ('choice-consent', ARRAY['Consent','Lawful basis','Preferences','Withdrawal','Objection']),
 ('collection', ARRAY['Purpose limitation','Minimisation','Collection restrictions','Sensitive data']),
 ('use-retention-disposal', ARRAY['Processing limitations','Secondary use','Retention','Deletion','Anonymisation']),
 ('access', ARRAY['Access rights','Correction','Erasure','Portability','Restriction','Grievance']),
 ('third-party-disclosure', ARRAY['Processors','Controllers','Vendors','Contracts','Subprocessors','Transfers']),
 ('security', ARRAY['Security safeguards','Access controls','Encryption','Breaches','Incident response']),
 ('quality', ARRAY['Accuracy','Completeness','Data integrity','Validation']),
 ('monitoring-enforcement', ARRAY['Audits','Assessments','Complaints','Regulatory cooperation','Accountability monitoring'])
) AS d(code, names), unnest(d.names) WITH ORDINALITY AS t(name, ord);

-- Atomic save now also files the post under its topics when the payload carries "topic_ids"
-- (optional "primary_topic_id"; defaults to the first). Payloads without the key leave the filing untouched.
CREATE OR REPLACE FUNCTION public.rpc_save_content_post(payload jsonb, tag_ids uuid[] DEFAULT '{}'::uuid[])
 RETURNS content_posts
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  r public.content_posts;
  pid uuid := NULLIF(payload->>'id','')::uuid;
  v_author text; v_cat text; v_tags text[]; v_topics uuid[]; v_primary uuid;
BEGIN
  SELECT name INTO v_author FROM public.content_authors WHERE id = NULLIF(payload->>'author_id','')::uuid;
  SELECT name INTO v_cat FROM public.content_categories WHERE id = NULLIF(payload->>'category_id','')::uuid;
  SELECT coalesce(array_agg(name ORDER BY name), '{}') INTO v_tags FROM public.content_tags WHERE id = ANY(coalesce(tag_ids,'{}'));
  IF pid IS NULL THEN
    INSERT INTO public.content_posts (content_type, status, slug, title, excerpt, body_md, blocks, faq, ai_summary,
      cover_image_url, seo_title, seo_description, focus_keyword, canonical_url, og_image_url, noindex, featured,
      reading_minutes, published_at, scheduled_for, author_id, category_id, author_name, category, tags, updated_by,
      media_url, media_kind, media_mime, media_size, media_duration_seconds, transcript, allow_download)
    VALUES (coalesce(payload->>'content_type','blog'), coalesce(payload->>'status','draft'), payload->>'slug', payload->>'title',
      payload->>'excerpt', coalesce(payload->>'body_md',''), coalesce(payload->'blocks','[]'), coalesce(payload->'faq','[]'),
      payload->>'ai_summary', payload->>'cover_image_url', payload->>'seo_title', payload->>'seo_description',
      payload->>'focus_keyword', payload->>'canonical_url', payload->>'og_image_url',
      coalesce((payload->>'noindex')::boolean,false), coalesce((payload->>'featured')::boolean,false),
      coalesce((payload->>'reading_minutes')::int,1), NULLIF(payload->>'published_at','')::timestamptz,
      NULLIF(payload->>'scheduled_for','')::timestamptz, NULLIF(payload->>'author_id','')::uuid,
      NULLIF(payload->>'category_id','')::uuid, v_author, v_cat, v_tags, auth.uid(),
      NULLIF(payload->>'media_url',''), NULLIF(payload->>'media_kind',''), NULLIF(payload->>'media_mime',''),
      NULLIF(payload->>'media_size','')::bigint, NULLIF(payload->>'media_duration_seconds','')::int,
      NULLIF(payload->>'transcript',''), coalesce((payload->>'allow_download')::boolean,true))
    RETURNING * INTO r;
  ELSE
    UPDATE public.content_posts SET
      content_type = coalesce(payload->>'content_type', content_type), status = coalesce(payload->>'status', status),
      slug = payload->>'slug', title = payload->>'title', excerpt = payload->>'excerpt', body_md = coalesce(payload->>'body_md',''),
      blocks = coalesce(payload->'blocks','[]'), faq = coalesce(payload->'faq','[]'), ai_summary = payload->>'ai_summary',
      cover_image_url = payload->>'cover_image_url', seo_title = payload->>'seo_title', seo_description = payload->>'seo_description',
      focus_keyword = payload->>'focus_keyword', canonical_url = payload->>'canonical_url', og_image_url = payload->>'og_image_url',
      noindex = coalesce((payload->>'noindex')::boolean,false), featured = coalesce((payload->>'featured')::boolean,false),
      reading_minutes = coalesce((payload->>'reading_minutes')::int,1),
      published_at = NULLIF(payload->>'published_at','')::timestamptz, scheduled_for = NULLIF(payload->>'scheduled_for','')::timestamptz,
      author_id = NULLIF(payload->>'author_id','')::uuid, category_id = NULLIF(payload->>'category_id','')::uuid,
      author_name = v_author, category = v_cat, tags = v_tags, updated_by = auth.uid(),
      media_url = NULLIF(payload->>'media_url',''), media_kind = NULLIF(payload->>'media_kind',''),
      media_mime = NULLIF(payload->>'media_mime',''), media_size = NULLIF(payload->>'media_size','')::bigint,
      media_duration_seconds = NULLIF(payload->>'media_duration_seconds','')::int,
      transcript = NULLIF(payload->>'transcript',''), allow_download = coalesce((payload->>'allow_download')::boolean,true),
      current_version = current_version + 1
    WHERE id = pid RETURNING * INTO r;
    IF NOT FOUND THEN RAISE EXCEPTION 'Post not found or not editable' USING ERRCODE = '42501'; END IF;
  END IF;
  DELETE FROM public.content_post_tags WHERE post_id = r.id AND NOT (tag_id = ANY(coalesce(tag_ids,'{}')));
  INSERT INTO public.content_post_tags (post_id, tag_id) SELECT r.id, unnest(coalesce(tag_ids,'{}')) ON CONFLICT DO NOTHING;
  IF jsonb_typeof(payload->'topic_ids') = 'array' THEN
    SELECT coalesce(array_agg(t.id ORDER BY x.ord), '{}') INTO v_topics
      FROM jsonb_array_elements_text(payload->'topic_ids') WITH ORDINALITY AS x(val, ord)
      JOIN public.content_topics t ON t.id::text = x.val;
    IF cardinality(v_topics) > 6 THEN RAISE EXCEPTION 'A post can be filed under at most 6 topics' USING ERRCODE = '22023'; END IF;
    v_primary := NULLIF(payload->>'primary_topic_id','')::uuid;
    IF v_primary IS NULL OR NOT (v_primary = ANY(v_topics)) THEN v_primary := v_topics[1]; END IF;
    DELETE FROM public.content_post_topics WHERE post_id = r.id AND NOT (topic_id = ANY(v_topics));
    UPDATE public.content_post_topics SET is_primary = false WHERE post_id = r.id AND is_primary AND topic_id IS DISTINCT FROM v_primary;
    INSERT INTO public.content_post_topics (post_id, topic_id, is_primary)
      SELECT r.id, t, t = v_primary FROM unnest(v_topics) AS t
      ON CONFLICT (post_id, topic_id) DO UPDATE SET is_primary = EXCLUDED.is_primary;
  END IF;
  INSERT INTO public.content_versions (post_id, snapshot, status, version_number)
    VALUES (r.id, to_jsonb(r) || jsonb_build_object('tag_ids', to_jsonb(coalesce(tag_ids,'{}')),
      'topic_ids', (SELECT coalesce(jsonb_agg(pt.topic_id ORDER BY pt.is_primary DESC, pt.topic_id), '[]'::jsonb) FROM public.content_post_topics pt WHERE pt.post_id = r.id),
      'primary_topic_id', (SELECT pt.topic_id FROM public.content_post_topics pt WHERE pt.post_id = r.id AND pt.is_primary)),
      r.status, r.current_version);
  RETURN r;
END $function$;
