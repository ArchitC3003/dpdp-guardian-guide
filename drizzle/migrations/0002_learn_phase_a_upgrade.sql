-- Helper: staff role checks
CREATE OR REPLACE FUNCTION public.is_content_publisher(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'admin') OR public.has_role(_uid,'moderator')
$$;
CREATE OR REPLACE FUNCTION public.is_content_writer(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'admin') OR public.has_role(_uid,'moderator') OR public.has_role(_uid,'user')
$$;
CREATE OR REPLACE FUNCTION public.is_content_staff(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_uid,'admin') OR public.has_role(_uid,'moderator') OR public.has_role(_uid,'user') OR public.has_role(_uid,'auditor')
$$;

-- Lookup tables
CREATE TABLE public.content_authors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  title text,
  bio text,
  avatar_url text,
  linkedin_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.content_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.content_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_authors, public.content_categories, public.content_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_authors, public.content_categories, public.content_tags TO authenticated;
GRANT ALL ON public.content_authors, public.content_categories, public.content_tags TO service_role;
ALTER TABLE public.content_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads authors" ON public.content_authors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Publishers manage authors" ON public.content_authors FOR ALL TO authenticated
  USING (public.is_content_publisher(auth.uid())) WITH CHECK (public.is_content_publisher(auth.uid()));
CREATE POLICY "Anyone reads categories" ON public.content_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Publishers manage categories" ON public.content_categories FOR ALL TO authenticated
  USING (public.is_content_publisher(auth.uid())) WITH CHECK (public.is_content_publisher(auth.uid()));
CREATE POLICY "Anyone reads tags" ON public.content_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Publishers manage tags" ON public.content_tags FOR ALL TO authenticated
  USING (public.is_content_publisher(auth.uid())) WITH CHECK (public.is_content_publisher(auth.uid()));

-- New post columns
ALTER TABLE public.content_posts
  ADD COLUMN author_id uuid REFERENCES public.content_authors(id) ON DELETE SET NULL,
  ADD COLUMN category_id uuid REFERENCES public.content_categories(id) ON DELETE SET NULL,
  ADD COLUMN scheduled_for timestamptz,
  ADD COLUMN current_version integer NOT NULL DEFAULT 1;

CREATE TABLE public.content_post_tags (
  post_id uuid NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.content_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
GRANT SELECT ON public.content_post_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_post_tags TO authenticated;
GRANT ALL ON public.content_post_tags TO service_role;
ALTER TABLE public.content_post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads post tags" ON public.content_post_tags FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Writers insert post tags" ON public.content_post_tags FOR INSERT TO authenticated WITH CHECK (public.is_content_writer(auth.uid()));
CREATE POLICY "Writers update post tags" ON public.content_post_tags FOR UPDATE TO authenticated USING (public.is_content_writer(auth.uid())) WITH CHECK (public.is_content_writer(auth.uid()));
CREATE POLICY "Writers delete post tags" ON public.content_post_tags FOR DELETE TO authenticated USING (public.is_content_writer(auth.uid()));

-- Backfill lookups from existing text columns
INSERT INTO public.content_authors (name) SELECT DISTINCT trim(author_name) FROM public.content_posts WHERE coalesce(trim(author_name),'') <> '' ON CONFLICT DO NOTHING;
INSERT INTO public.content_categories (name, slug)
  SELECT DISTINCT trim(category), trim(both '-' from regexp_replace(lower(trim(category)),'[^a-z0-9]+','-','g'))
  FROM public.content_posts WHERE coalesce(trim(category),'') <> '' ON CONFLICT DO NOTHING;
INSERT INTO public.content_tags (name, slug) VALUES
  ('DPDP','dpdp'),('GDPR','gdpr'),('RBI','rbi'),('SEBI','sebi'),('CERT-In','cert-in'),('ISO 27701','iso-27701')
  ON CONFLICT DO NOTHING;
INSERT INTO public.content_tags (name, slug)
  SELECT DISTINCT trim(t), trim(both '-' from regexp_replace(lower(trim(t)),'[^a-z0-9]+','-','g'))
  FROM public.content_posts, unnest(tags) t WHERE trim(t) <> '' ON CONFLICT DO NOTHING;
UPDATE public.content_posts p SET author_id = a.id FROM public.content_authors a WHERE a.name = trim(p.author_name);
UPDATE public.content_posts p SET category_id = c.id FROM public.content_categories c WHERE c.name = trim(p.category);
UPDATE public.content_posts SET scheduled_for = published_at WHERE status = 'scheduled';
INSERT INTO public.content_post_tags (post_id, tag_id)
  SELECT p.id, tg.id FROM public.content_posts p, unnest(p.tags) t JOIN public.content_tags tg ON tg.name = trim(t) ON CONFLICT DO NOTHING;
COMMENT ON COLUMN public.content_posts.author_name IS 'DEPRECATED: replaced by author_id (kept in sync by rpc_save_content_post)';
COMMENT ON COLUMN public.content_posts.category IS 'DEPRECATED: replaced by category_id (kept in sync by rpc_save_content_post)';
COMMENT ON COLUMN public.content_posts.tags IS 'DEPRECATED: replaced by content_post_tags (kept in sync by rpc_save_content_post)';

-- Post policies
DROP POLICY "Public reads live content" ON public.content_posts;
DROP POLICY "Staff read all content" ON public.content_posts;
DROP POLICY "Editors create content" ON public.content_posts;
DROP POLICY "Editors update content" ON public.content_posts;
CREATE POLICY "Public reads live content" ON public.content_posts FOR SELECT TO anon, authenticated
  USING ((status = 'published' AND COALESCE(published_at, now()) <= now())
      OR (status = 'scheduled' AND scheduled_for IS NOT NULL AND scheduled_for <= now()));
CREATE POLICY "Staff read all content" ON public.content_posts FOR SELECT TO authenticated
  USING (public.is_content_staff(auth.uid()));
CREATE POLICY "Writers create content" ON public.content_posts FOR INSERT TO authenticated
  WITH CHECK (public.is_content_writer(auth.uid()));
CREATE POLICY "Writers update content" ON public.content_posts FOR UPDATE TO authenticated
  USING (public.is_content_writer(auth.uid())) WITH CHECK (public.is_content_writer(auth.uid()));

-- Publish guard: only admin/moderator can schedule, publish, archive or touch live posts
CREATE OR REPLACE FUNCTION public.content_posts_publish_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR public.is_content_publisher(auth.uid()) THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('draft','in_review') THEN
    RAISE EXCEPTION 'Only Super Admins and GRC Managers can schedule, publish or archive content' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status NOT IN ('draft','in_review') THEN
    RAISE EXCEPTION 'Only Super Admins and GRC Managers can change scheduled, published or archived content' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER content_posts_publish_guard BEFORE INSERT OR UPDATE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.content_posts_publish_guard();

-- Versions
DROP POLICY "Staff read versions" ON public.content_versions;
DROP POLICY "Editors add versions" ON public.content_versions;
ALTER TABLE public.content_versions ADD COLUMN version_number integer;
CREATE POLICY "Staff read versions" ON public.content_versions FOR SELECT TO authenticated
  USING (public.is_content_staff(auth.uid()));
CREATE POLICY "Writers add versions" ON public.content_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_content_writer(auth.uid()));

-- Atomic save
CREATE OR REPLACE FUNCTION public.rpc_save_content_post(payload jsonb, tag_ids uuid[] DEFAULT '{}')
RETURNS public.content_posts LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE
  r public.content_posts;
  pid uuid := NULLIF(payload->>'id','')::uuid;
  v_author text; v_cat text; v_tags text[];
BEGIN
  SELECT name INTO v_author FROM public.content_authors WHERE id = NULLIF(payload->>'author_id','')::uuid;
  SELECT name INTO v_cat FROM public.content_categories WHERE id = NULLIF(payload->>'category_id','')::uuid;
  SELECT coalesce(array_agg(name ORDER BY name), '{}') INTO v_tags FROM public.content_tags WHERE id = ANY(coalesce(tag_ids,'{}'));
  IF pid IS NULL THEN
    INSERT INTO public.content_posts (content_type, status, slug, title, excerpt, body_md, blocks, faq, ai_summary,
      cover_image_url, seo_title, seo_description, focus_keyword, canonical_url, og_image_url, noindex, featured,
      reading_minutes, published_at, scheduled_for, author_id, category_id, author_name, category, tags, updated_by)
    VALUES (coalesce(payload->>'content_type','blog'), coalesce(payload->>'status','draft'), payload->>'slug', payload->>'title',
      payload->>'excerpt', coalesce(payload->>'body_md',''), coalesce(payload->'blocks','[]'), coalesce(payload->'faq','[]'),
      payload->>'ai_summary', payload->>'cover_image_url', payload->>'seo_title', payload->>'seo_description',
      payload->>'focus_keyword', payload->>'canonical_url', payload->>'og_image_url',
      coalesce((payload->>'noindex')::boolean,false), coalesce((payload->>'featured')::boolean,false),
      coalesce((payload->>'reading_minutes')::int,1), NULLIF(payload->>'published_at','')::timestamptz,
      NULLIF(payload->>'scheduled_for','')::timestamptz, NULLIF(payload->>'author_id','')::uuid,
      NULLIF(payload->>'category_id','')::uuid, v_author, v_cat, v_tags, auth.uid())
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
      current_version = current_version + 1
    WHERE id = pid RETURNING * INTO r;
    IF NOT FOUND THEN RAISE EXCEPTION 'Post not found or not editable' USING ERRCODE = '42501'; END IF;
  END IF;
  DELETE FROM public.content_post_tags WHERE post_id = r.id AND NOT (tag_id = ANY(coalesce(tag_ids,'{}')));
  INSERT INTO public.content_post_tags (post_id, tag_id) SELECT r.id, unnest(coalesce(tag_ids,'{}')) ON CONFLICT DO NOTHING;
  INSERT INTO public.content_versions (post_id, snapshot, status, version_number)
    VALUES (r.id, to_jsonb(r) || jsonb_build_object('tag_ids', to_jsonb(coalesce(tag_ids,'{}'))), r.status, r.current_version);
  RETURN r;
END $$;

-- Restore a version as a draft (or as its own status for publishers)
CREATE OR REPLACE FUNCTION public.rpc_restore_content_version(version_id uuid)
RETURNS public.content_posts LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE s jsonb; cur public.content_posts; tids uuid[];
BEGIN
  SELECT snapshot INTO s FROM public.content_versions WHERE id = version_id;
  IF s IS NULL THEN RAISE EXCEPTION 'Version not found'; END IF;
  SELECT * INTO cur FROM public.content_posts WHERE id = (s->>'id')::uuid;
  IF cur.id IS NULL THEN RAISE EXCEPTION 'Post not found'; END IF;
  SELECT coalesce(array_agg(x::uuid), '{}') INTO tids FROM jsonb_array_elements_text(coalesce(s->'tag_ids','[]')) x;
  RETURN public.rpc_save_content_post(s || jsonb_build_object('id', cur.id, 'status', cur.status,
    'published_at', cur.published_at, 'scheduled_for', cur.scheduled_for), tids);
END $$;
GRANT EXECUTE ON FUNCTION public.rpc_save_content_post(jsonb, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_restore_content_version(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.rpc_save_content_post(jsonb, uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.rpc_restore_content_version(uuid) FROM anon;

-- Image library policies (bucket is private; covers served via long-lived signed links)
CREATE POLICY "content-media readable" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'content-media');
CREATE POLICY "content-media writers upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'content-media' AND public.is_content_writer(auth.uid()));
CREATE POLICY "content-media publishers update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'content-media' AND public.is_content_publisher(auth.uid()))
  WITH CHECK (bucket_id = 'content-media' AND public.is_content_publisher(auth.uid()));
CREATE POLICY "content-media publishers delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'content-media' AND public.is_content_publisher(auth.uid()));