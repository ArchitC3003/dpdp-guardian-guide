
-- 1A. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 1B. KM Artefact Index table
CREATE TABLE km_artefact_index (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  content_embedding VECTOR(1536),
  doc_type TEXT NOT NULL,
  industry_verticals TEXT[] DEFAULT '{}',
  sub_sectors TEXT[] DEFAULT '{}',
  jurisdictions TEXT[] DEFAULT '{}',
  frameworks TEXT[] DEFAULT '{}',
  source_authority TEXT,
  source_url TEXT,
  version TEXT DEFAULT 'v1.0',
  effective_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1C. Regulatory Source Map table
CREATE TABLE regulatory_source_map (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  industry_vertical TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  framework TEXT NOT NULL,
  authority TEXT NOT NULL,
  source_url TEXT NOT NULL,
  description TEXT,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- 1D. KM Query Log
CREATE TABLE km_query_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  query_type TEXT,
  industries TEXT[],
  sub_sector TEXT,
  artefacts_used UUID[],
  sources_used TEXT[],
  generated_output_preview TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1E. Vector similarity search function
CREATE OR REPLACE FUNCTION match_km_artefacts(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5,
  filter_industries TEXT[] DEFAULT NULL,
  filter_jurisdictions TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID, title TEXT, content TEXT, doc_type TEXT,
  industry_verticals TEXT[], frameworks TEXT[],
  source_authority TEXT, source_url TEXT, version TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id, a.title, a.content, a.doc_type,
    a.industry_verticals, a.frameworks,
    a.source_authority, a.source_url, a.version,
    1 - (a.content_embedding <=> query_embedding) AS similarity
  FROM km_artefact_index a
  WHERE a.is_active = TRUE
    AND (filter_industries IS NULL OR a.industry_verticals && filter_industries)
    AND (filter_jurisdictions IS NULL OR a.jurisdictions && filter_jurisdictions)
  ORDER BY a.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 1F. Enable RLS
ALTER TABLE km_artefact_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_source_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE km_query_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Read km artefacts" ON km_artefact_index FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admin write km artefacts" ON km_artefact_index FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update km artefacts" ON km_artefact_index FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete km artefacts" ON km_artefact_index FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Read regulatory sources" ON regulatory_source_map FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "Admin write regulatory sources" ON regulatory_source_map FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin update regulatory sources" ON regulatory_source_map FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin delete regulatory sources" ON regulatory_source_map FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Insert km logs" ON km_query_log FOR INSERT TO authenticated WITH CHECK (TRUE);
CREATE POLICY "Admin read km logs" ON km_query_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
