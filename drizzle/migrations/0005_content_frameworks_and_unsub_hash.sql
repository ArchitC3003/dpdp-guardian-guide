CREATE TABLE public.content_frameworks (
  code text PRIMARY KEY,
  label text NOT NULL,
  display_order integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.content_frameworks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_frameworks TO authenticated;
GRANT ALL ON public.content_frameworks TO service_role;
ALTER TABLE public.content_frameworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone reads active frameworks" ON public.content_frameworks FOR SELECT TO anon, authenticated USING (is_active OR public.is_content_staff(auth.uid()));
CREATE POLICY "Publishers insert frameworks" ON public.content_frameworks FOR INSERT TO authenticated WITH CHECK (public.is_content_publisher(auth.uid()));
CREATE POLICY "Publishers update frameworks" ON public.content_frameworks FOR UPDATE TO authenticated USING (public.is_content_publisher(auth.uid())) WITH CHECK (public.is_content_publisher(auth.uid()));
CREATE POLICY "Publishers delete frameworks" ON public.content_frameworks FOR DELETE TO authenticated USING (public.is_content_publisher(auth.uid()));
INSERT INTO public.content_frameworks (code, label, display_order) VALUES
 ('DPDP','DPDP',10),('GDPR','GDPR',20),('RBI','RBI',30),('SEBI','SEBI',40),('CERT-In','CERT-In',50),
 ('ISO 27001','ISO 27001',60),('ISO 27701','ISO 27701',70),('ISO 42001','ISO 42001',80);

ALTER TABLE public.content_posts ADD COLUMN frameworks text[] NOT NULL DEFAULT '{}';
UPDATE public.content_posts p SET frameworks = ARRAY(SELECT f.code FROM public.content_frameworks f WHERE f.code = ANY(p.tags) OR f.code = p.category ORDER BY f.display_order);

CREATE OR REPLACE FUNCTION public.content_posts_validate_frameworks() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE bad text;
BEGIN
  SELECT x INTO bad FROM unnest(coalesce(NEW.frameworks,'{}')) x WHERE NOT EXISTS (SELECT 1 FROM public.content_frameworks f WHERE f.code = x AND f.is_active) LIMIT 1;
  IF bad IS NOT NULL THEN RAISE EXCEPTION 'Unknown framework: %', bad USING ERRCODE = '22023'; END IF;
  NEW.frameworks := ARRAY(SELECT DISTINCT unnest(NEW.frameworks));
  RETURN NEW;
END $$;
CREATE TRIGGER content_posts_validate_frameworks BEFORE INSERT OR UPDATE OF frameworks ON public.content_posts FOR EACH ROW EXECUTE FUNCTION public.content_posts_validate_frameworks();

CREATE OR REPLACE FUNCTION public.rpc_set_content_frameworks(post_id uuid, codes text[]) RETURNS void LANGUAGE sql SET search_path = public AS $$
  UPDATE public.content_posts SET frameworks = coalesce(codes,'{}') WHERE id = post_id;
$$;
GRANT EXECUTE ON FUNCTION public.rpc_set_content_frameworks(uuid, text[]) TO authenticated;

ALTER TABLE public.marketing_leads ADD COLUMN unsubscribe_token_hash text;
UPDATE public.marketing_leads SET unsubscribe_token_hash = encode(sha256(convert_to(unsubscribe_token,'UTF8')),'hex'), unsubscribe_token = NULL WHERE unsubscribe_token IS NOT NULL;
CREATE UNIQUE INDEX marketing_leads_unsub_hash_idx ON public.marketing_leads(unsubscribe_token_hash) WHERE unsubscribe_token_hash IS NOT NULL;
COMMENT ON COLUMN public.marketing_leads.unsubscribe_token IS 'DEPRECATED: replaced by unsubscribe_token_hash (SHA-256)';
REVOKE ALL ON public.marketing_leads FROM anon;