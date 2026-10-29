import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SITE = "https://privcybhub.com";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const pathFor = (p: { content_type: string; slug: string }) => (p.content_type === "landing" ? `/lp/${p.slug}` : `/learn/${p.slug}`);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const format = new URL(req.url).searchParams.get("format") || "sitemap";
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data, error } = await db.from("content_posts")
    .select("slug,title,excerpt,content_type,published_at,updated_at,ai_summary,noindex")
    .order("published_at", { ascending: false }).limit(1000);
  if (error) return new Response("error", { status: 500, headers: corsHeaders });
  const posts = (data || []).filter((p) => !p.noindex);

  if (format === "rss") {
    const items = posts.filter((p) => p.content_type !== "landing").slice(0, 50).map((p) => `
  <item><title>${esc(p.title)}</title><link>${SITE}${pathFor(p)}</link><guid>${SITE}${pathFor(p)}</guid>
  <pubDate>${new Date(p.published_at).toUTCString()}</pubDate><description>${esc(p.excerpt || "")}</description></item>`).join("");
    return new Response(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel><title>PrivcybHub Learn</title><link>${SITE}/learn</link>
<description>DPDP, privacy and cyber compliance insights from PrivcybHub.</description>${items}
</channel></rss>`, { headers: { ...corsHeaders, "Content-Type": "application/rss+xml; charset=utf-8" } });
  }
  if (format === "llms") {
    const lines = posts.map((p) => `- [${p.title}](${SITE}${pathFor(p)}): ${(p.ai_summary || p.excerpt || "").replace(/\s+/g, " ").slice(0, 240)}`);
    return new Response(`# PrivcybHub Learn\n\n> Guides and articles on India's DPDP Act, global privacy laws and cyber compliance.\n\n## Articles\n\n${lines.join("\n")}\n`,
      { headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" } });
  }
  const urls = [`<url><loc>${SITE}/learn</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`,
    ...posts.map((p) => `<url><loc>${SITE}${pathFor(p)}</loc><lastmod>${new Date(p.updated_at).toISOString()}</lastmod></url>`)];
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`,
    { headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" } });
});
