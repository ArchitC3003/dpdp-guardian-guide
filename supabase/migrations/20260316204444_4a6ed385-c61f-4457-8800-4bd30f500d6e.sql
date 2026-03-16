
-- Fix function search_path for match_km_artefacts
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
LANGUAGE plpgsql
SET search_path = public
AS $$
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
