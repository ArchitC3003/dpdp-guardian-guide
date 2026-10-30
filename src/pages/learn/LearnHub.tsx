import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/learn/PublicShell";
import { LeadForm } from "@/components/learn/LeadForm";
import { Input } from "@/components/ui/input";
import { FONT_DISPLAY, SITE_URL, publicPath, isLive, liveDate, TOPIC_PILLS } from "@/lib/content";

type Row = { id: string; slug: string; title: string; excerpt: string | null; content_type: string; category: string | null; tags: string[]; cover_image_url: string | null; published_at: string; scheduled_for: string | null; status: string; reading_minutes: number; featured: boolean };

export default function LearnHub() {
  const { tag } = useParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    let query = supabase.from("content_posts")
      .select("id,slug,title,excerpt,content_type,category,tags,cover_image_url,published_at,scheduled_for,status,reading_minutes,featured")
      .in("status", ["published", "scheduled"]).neq("content_type", "landing")
      .order("updated_at", { ascending: false }).limit(200);
    if (tag) query = query.contains("tags", [tag]);
    query.then(({ data }) => {
      const live = ((data as Row[]) || []).filter((r) => isLive(r))
        .sort((a, b) => new Date(liveDate(b)).getTime() - new Date(liveDate(a)).getTime());
      setRows(live); setLoading(false);
    });
  }, [tag]);

  const filtered = useMemo(() => rows.filter((r) => !q || (r.title + " " + (r.excerpt || "")).toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const allTags = useMemo(() => Array.from(new Set([...TOPIC_PILLS, ...rows.flatMap((r) => r.tags)])).slice(0, 16), [rows]);
  const featured = !tag && !q ? filtered.find((r) => r.featured) || filtered[0] : undefined;
  const rest = filtered.filter((r) => r !== featured);
  const url = `${SITE_URL}/learn${tag ? `/topic/${tag}` : ""}`;
  const title = tag ? `${tag} — PrivcybHub Learn` : "Learn — DPDP & privacy compliance insights | PrivcybHub";
  const desc = "Practical guides, articles and analysis on India's DPDP Act 2023, global privacy laws and cyber compliance from PrivcybHub.";

  return (
    <PublicShell>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} /><meta property="og:description" content={desc} /><meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "Blog", name: "PrivcybHub Learn", url,
          blogPost: rows.slice(0, 20).map((r) => ({ "@type": "BlogPosting", headline: r.title, url: SITE_URL + publicPath(r), datePublished: liveDate(r) })) })}</script>
      </Helmet>
      <section className="max-w-6xl mx-auto px-5 pt-16 pb-10">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">PrivcybHub Learn</p>
        <h1 className="text-5xl md:text-6xl font-semibold mt-3 max-w-3xl" style={{ fontFamily: FONT_DISPLAY }}>{tag ? `Topic: ${tag}` : "Clear thinking on privacy, DPDP and cyber compliance"}</h1>
        <div className="mt-8 flex flex-wrap gap-3 items-center">
          <Input placeholder="Search articles" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" aria-label="Search articles" />
          {tag && <Link to="/learn" className="text-sm text-primary">All topics</Link>}
          {allTags.map((t) => <Link key={t} to={`/learn/topic/${encodeURIComponent(t)}`} aria-current={t === tag ? "page" : undefined} className={`text-xs border rounded-full px-3 py-1 hover:border-primary ${t === tag ? "border-primary text-primary" : "border-border"}`}>{t}</Link>)}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5">
        {loading ? <p className="text-muted-foreground">Loading…</p> : filtered.length === 0 ? (
          <p className="text-muted-foreground border border-dashed border-border rounded-xl p-10 text-center">No articles published yet. Check back soon.</p>
        ) : (
          <>
            {featured && (
              <Link to={publicPath(featured)} className="grid md:grid-cols-2 gap-8 border border-border rounded-2xl overflow-hidden bg-card hover:border-primary transition-colors mb-12">
                {featured.cover_image_url ? <img src={featured.cover_image_url} alt="" className="w-full h-72 object-cover" /> : <div className="h-72 bg-gradient-to-br from-primary/30 to-accent/20" />}
                <div className="p-8 flex flex-col justify-center">
                  <span className="font-mono text-xs text-primary uppercase">{featured.category || "Featured"}</span>
                  <h2 className="text-3xl font-semibold mt-2" style={{ fontFamily: FONT_DISPLAY }}>{featured.title}</h2>
                  <p className="text-muted-foreground mt-3">{featured.excerpt}</p>
                  <span className="text-xs text-muted-foreground mt-4">{new Date(liveDate(featured)).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium" })} · {featured.reading_minutes} min read</span>
                </div>
              </Link>
            )}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((r) => (
                <Link key={r.id} to={publicPath(r)} className="border border-border rounded-xl overflow-hidden bg-card hover:border-primary transition-colors flex flex-col">
                  {r.cover_image_url ? <img src={r.cover_image_url} alt="" loading="lazy" className="h-44 w-full object-cover" /> : <div className="h-2 bg-primary/40" />}
                  <div className="p-5 flex-1 flex flex-col">
                    <span className="font-mono text-[11px] text-primary uppercase">{r.category || (r.content_type === "article" ? "Guide" : "Blog")}</span>
                    <h3 className="text-xl font-semibold mt-1" style={{ fontFamily: FONT_DISPLAY }}>{r.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3 flex-1">{r.excerpt}</p>
                    <span className="text-xs text-muted-foreground mt-4">{r.reading_minutes} min read</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
      <section className="max-w-xl mx-auto px-5 mt-20">
        <LeadForm type="newsletter" compact heading="Get new DPDP insights by email" sourceSlug="learn-hub" />
      </section>
    </PublicShell>
  );
}
