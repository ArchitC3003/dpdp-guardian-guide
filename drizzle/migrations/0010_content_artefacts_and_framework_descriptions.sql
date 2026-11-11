-- Learn: artefacts readers can build (publisher-managed vocabulary, like frameworks), and a one-line description per framework.
ALTER TABLE public.content_frameworks ADD COLUMN description text;
UPDATE public.content_frameworks f SET description = v.d FROM (VALUES
 ('DPDP','India''s Digital Personal Data Protection Act, 2023.'),
 ('GDPR','The European Union''s General Data Protection Regulation.'),
 ('RBI','Reserve Bank of India directions for regulated entities.'),
 ('SEBI','Securities and Exchange Board of India cyber and data requirements.'),
 ('CERT-In','Indian Computer Emergency Response Team directions on incident reporting.'),
 ('ISO 27001','The international standard for information security management.'),
 ('ISO 27701','The privacy extension to ISO 27001.'),
 ('ISO 42001','The international standard for AI management systems.')
) AS v(c, d) WHERE f.code = v.c;

CREATE TABLE public.content_artefacts (
  code text PRIMARY KEY,
  label text NOT NULL,
  kind text NOT NULL DEFAULT 'Template',
  description text,
  -- Document type the Policy and SOP Builder opens on for this artefact (a value from its DOCUMENT_TYPES list); null opens the builder without a preset.
  builder_type text,
  display_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_artefacts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_artefacts TO authenticated;
GRANT ALL ON public.content_artefacts TO service_role;
ALTER TABLE public.content_artefacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active artefacts" ON public.content_artefacts FOR SELECT TO anon, authenticated USING (is_active OR public.is_content_staff(auth.uid()));
CREATE POLICY "Publishers insert artefacts" ON public.content_artefacts FOR INSERT TO authenticated WITH CHECK (public.is_content_publisher(auth.uid()));
CREATE POLICY "Publishers update artefacts" ON public.content_artefacts FOR UPDATE TO authenticated USING (public.is_content_publisher(auth.uid())) WITH CHECK (public.is_content_publisher(auth.uid()));
CREATE POLICY "Publishers delete artefacts" ON public.content_artefacts FOR DELETE TO authenticated USING (public.is_content_publisher(auth.uid()));
-- Starter list mirrors what the Policy and SOP Builder can produce today, so every artefact shown has somewhere to be built.
INSERT INTO public.content_artefacts (code, label, kind, builder_type, description, display_order) VALUES
 ('data-privacy-policy','Data privacy policy','Policy','data-privacy-policy','How the organisation collects, uses, shares and protects personal data.',10),
 ('info-security-policy','Information security policy','Policy','info-security-policy','The rules and responsibilities that keep information secure.',20),
 ('data-classification-policy','Data classification policy','Policy','data-classification-policy','How data is labelled by sensitivity, and how each class is handled.',30),
 ('access-control-policy','Access control policy','Policy','access-control-policy','Who may access which systems and data, and how access is approved.',40),
 ('acceptable-use-policy','Acceptable use policy','Policy','acceptable-use-policy','What staff may and may not do with company systems and data.',50),
 ('vendor-risk-policy','Vendor risk management policy','Policy','vendor-risk-policy','How vendors and processors are assessed, contracted and monitored.',60),
 ('incident-response-policy','Incident response policy','Policy','incident-response-policy','How security and privacy incidents are identified, escalated and closed.',70),
 ('business-continuity-policy','Business continuity policy','Policy','business-continuity-policy','How critical services keep running through a disruption.',80),
 ('sop-breach-notification','Data breach notification SOP','SOP','sop-breach-notification','Steps for telling regulators and affected people about a personal data breach.',90),
 ('sop-incident-response','Incident response SOP','SOP','sop-incident-response','Step-by-step handling of an incident from detection to review.',100),
 ('sop-access-provisioning','Access provisioning SOP','SOP','sop-access-provisioning','Steps for granting, changing and removing access.',110),
 ('sop-third-party-onboarding','Third party onboarding SOP','SOP','sop-third-party-onboarding','Steps for bringing a new vendor or processor on board.',120),
 ('sop-vuln-management','Vulnerability management SOP','SOP','sop-vuln-management','Steps for finding, ranking and fixing vulnerabilities.',130);

ALTER TABLE public.content_posts ADD COLUMN artefacts text[] NOT NULL DEFAULT '{}';
CREATE OR REPLACE FUNCTION public.content_posts_validate_artefacts() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE bad text;
BEGIN
  SELECT x INTO bad FROM unnest(coalesce(NEW.artefacts,'{}')) x WHERE NOT EXISTS (SELECT 1 FROM public.content_artefacts a WHERE a.code = x) LIMIT 1;
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'Unknown artefact: %', bad USING ERRCODE = '22023'; END IF;
  NEW.artefacts := ARRAY(SELECT DISTINCT unnest(coalesce(NEW.artefacts,'{}')));
  RETURN NEW;
END $$;
CREATE TRIGGER content_posts_validate_artefacts BEFORE INSERT OR UPDATE OF artefacts ON public.content_posts FOR EACH ROW EXECUTE FUNCTION public.content_posts_validate_artefacts();

-- Atomic save also sets the post's artefacts when the payload carries an "artefacts" array.
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
  IF jsonb_typeof(payload->'artefacts') = 'array' THEN
    UPDATE public.content_posts SET artefacts = ARRAY(SELECT x FROM jsonb_array_elements_text(payload->'artefacts') x WHERE EXISTS (SELECT 1 FROM public.content_artefacts a WHERE a.code = x)) WHERE id = r.id RETURNING * INTO r;
  END IF;
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
