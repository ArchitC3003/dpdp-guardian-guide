DROP POLICY IF EXISTS "Anyone reads authors" ON public.content_authors;
DROP POLICY IF EXISTS "Anyone reads categories" ON public.content_categories;
DROP POLICY IF EXISTS "Anyone reads tags" ON public.content_tags;
DROP POLICY IF EXISTS "Anyone reads post tags" ON public.content_post_tags;
DROP POLICY IF EXISTS "content-media readable" ON storage.objects;

CREATE POLICY "Read authors of live content" ON public.content_authors FOR SELECT TO anon, authenticated
USING (public.is_content_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.content_posts p WHERE p.author_id = content_authors.id
  AND ((p.status='published' AND COALESCE(p.published_at, now()) <= now()) OR (p.status='scheduled' AND p.scheduled_for IS NOT NULL AND p.scheduled_for <= now()))));

CREATE POLICY "Read categories of live content" ON public.content_categories FOR SELECT TO anon, authenticated
USING (public.is_content_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.content_posts p WHERE p.category_id = content_categories.id
  AND ((p.status='published' AND COALESCE(p.published_at, now()) <= now()) OR (p.status='scheduled' AND p.scheduled_for IS NOT NULL AND p.scheduled_for <= now()))));

CREATE POLICY "Read post tags of live content" ON public.content_post_tags FOR SELECT TO anon, authenticated
USING (public.is_content_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.content_posts p WHERE p.id = content_post_tags.post_id
  AND ((p.status='published' AND COALESCE(p.published_at, now()) <= now()) OR (p.status='scheduled' AND p.scheduled_for IS NOT NULL AND p.scheduled_for <= now()))));

CREATE POLICY "Read tags of live content" ON public.content_tags FOR SELECT TO anon, authenticated
USING (public.is_content_staff(auth.uid()) OR EXISTS (SELECT 1 FROM public.content_post_tags pt JOIN public.content_posts p ON p.id = pt.post_id
  WHERE pt.tag_id = content_tags.id
  AND ((p.status='published' AND COALESCE(p.published_at, now()) <= now()) OR (p.status='scheduled' AND p.scheduled_for IS NOT NULL AND p.scheduled_for <= now()))));

CREATE POLICY "Content staff read content-media" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'content-media' AND public.is_content_staff(auth.uid()));