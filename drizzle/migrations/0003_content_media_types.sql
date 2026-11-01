ALTER TABLE public.content_posts DROP CONSTRAINT IF EXISTS content_posts_content_type_check;
ALTER TABLE public.content_posts ADD CONSTRAINT content_posts_content_type_check CHECK (content_type IN ('blog','article','landing','presentation','video'));
ALTER TABLE public.content_posts
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_kind text CHECK (media_kind IS NULL OR media_kind IN ('pdf','pptx','video_file','youtube','vimeo')),
  ADD COLUMN IF NOT EXISTS media_mime text,
  ADD COLUMN IF NOT EXISTS media_size bigint,
  ADD COLUMN IF NOT EXISTS media_duration_seconds integer,
  ADD COLUMN IF NOT EXISTS transcript text,
  ADD COLUMN IF NOT EXISTS allow_download boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.rpc_save_content_post(payload jsonb, tag_ids uuid[] DEFAULT '{}'::uuid[])
 RETURNS content_posts
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
  INSERT INTO public.content_versions (post_id, snapshot, status, version_number)
    VALUES (r.id, to_jsonb(r) || jsonb_build_object('tag_ids', to_jsonb(coalesce(tag_ids,'{}'))), r.status, r.current_version);
  RETURN r;
END $function$;