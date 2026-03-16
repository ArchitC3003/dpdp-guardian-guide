import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { queryText, industries, maxResults = 5 } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    // Keyword/tag-based search fallback (works without embeddings)
    // Search by industry overlap and text matching
    let query = sb
      .from("km_artefact_index")
      .select("id, title, content, doc_type, industry_verticals, frameworks, source_authority, source_url, version")
      .eq("is_active", true)
      .limit(maxResults);

    // Filter by industries if provided
    if (industries && industries.length > 0) {
      // Use overlaps to find artefacts matching any of the industries
      query = query.overlaps("industry_verticals", industries);
    }

    // Text search via ilike on title/content
    if (queryText) {
      const keywords = queryText
        .split(/[\s,]+/)
        .filter((w: string) => w.length > 3)
        .slice(0, 5);

      if (keywords.length > 0) {
        // Search title or content for any keyword
        const orFilters = keywords
          .map((kw: string) => `title.ilike.%${kw}%,content.ilike.%${kw}%`)
          .join(",");
        query = query.or(orFilters);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("KM search error:", error);
      return new Response(
        JSON.stringify({ artefacts: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const artefacts = (data || []).map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content.substring(0, 500),
      docType: row.doc_type,
      sourceAuthority: row.source_authority || "",
      sourceUrl: row.source_url || "",
      version: row.version || "v1.0",
      similarity: 0.5, // placeholder score for keyword search
    }));

    return new Response(
      JSON.stringify({ artefacts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("km-search error:", e);
    return new Response(
      JSON.stringify({ artefacts: [], error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
