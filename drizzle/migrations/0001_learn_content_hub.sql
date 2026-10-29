CREATE TABLE public.content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL DEFAULT 'blog' CHECK (content_type IN ('blog','article','landing')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','in_review','scheduled','published','archived')),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text NOT NULL,
  excerpt text,
  body_md text NOT NULL DEFAULT '',
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_summary text,
  category text,
  tags text[] NOT NULL DEFAULT '{}',
  cover_image_url text,
  author_name text,
  seo_title text,
  seo_description text,
  focus_keyword text,
  canonical_url text,
  og_image_url text,
  noindex boolean NOT NULL DEFAULT false,
  featured boolean NOT NULL DEFAULT false,
  reading_minutes integer NOT NULL DEFAULT 1,
  published_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_posts_public_idx ON public.content_posts (status, published_at DESC);
CREATE INDEX content_posts_tags_idx ON public.content_posts USING gin (tags);
GRANT SELECT ON public.content_posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_posts TO authenticated;
GRANT ALL ON public.content_posts TO service_role;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads live content" ON public.content_posts FOR SELECT TO anon, authenticated
  USING (status IN ('published','scheduled') AND published_at IS NOT NULL AND published_at <= now());
CREATE POLICY "Staff read all content" ON public.content_posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator') OR public.has_role(auth.uid(),'auditor'));
CREATE POLICY "Editors create content" ON public.content_posts FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Editors update content" ON public.content_posts FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Admins delete content" ON public.content_posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER content_posts_updated_at BEFORE UPDATE ON public.content_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.content_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
  snapshot jsonb NOT NULL,
  status text NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX content_versions_post_idx ON public.content_versions (post_id, created_at DESC);
GRANT SELECT, INSERT ON public.content_versions TO authenticated;
GRANT ALL ON public.content_versions TO service_role;
ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read versions" ON public.content_versions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator') OR public.has_role(auth.uid(),'auditor'));
CREATE POLICY "Editors add versions" ON public.content_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));

CREATE TABLE public.marketing_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_type text NOT NULL DEFAULT 'contact' CHECK (lead_type IN ('contact','newsletter','demo')),
  name text,
  email text NOT NULL,
  organisation text,
  message text,
  source_slug text,
  consent_given boolean NOT NULL,
  consent_text text NOT NULL,
  consent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','closed')),
  user_agent text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX marketing_leads_created_idx ON public.marketing_leads (created_at DESC);
CREATE INDEX marketing_leads_rate_idx ON public.marketing_leads (ip_hash, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.marketing_leads TO authenticated;
GRANT ALL ON public.marketing_leads TO service_role;
ALTER TABLE public.marketing_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read leads" ON public.marketing_leads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Admins update leads" ON public.marketing_leads FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "Admins delete leads" ON public.marketing_leads FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));