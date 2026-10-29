import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/learn/PublicShell";
import { LeadForm } from "@/components/learn/LeadForm";
import { Markdown } from "@/components/learn/Markdown";
import { FONT_DISPLAY, SITE_URL, headings, publicPath, type FaqItem } from "@/lib/content";

export default function LearnArticle() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");

  useEffect(() => {
    setState("loading");
    supabase.from("content_posts").select("*").eq("slug", slug!).neq("content_type", "landing").maybeSingle()
      .then(async ({ data }) => {
        if (!data || !data.published_at || new Date(data.published_at) > new Date() || !["published", "scheduled"].includes(data.status)) { setState("missing"); return; }
        setPost(data); setState("ok");
        const { data: rel } = await supabase.from("content_posts").select("slug,title,content_type,excerpt")
          .in("status", ["published", "scheduled"]).lte("published_at", new Date().toISOString())
          .neq("content_type", "landing").neq("id", data.id).overlaps("tags", data.tags.length ? data.tags : ["__none"]).limit(3);
        setRelated(rel || []);
      });
  }, [slug]);

  if (state === "loading") return <PublicShell><p className="max-w-3xl mx-auto px-5 py-24 text-muted-foreground">Loading…</p></PublicShell>;
  if (state === "missing") return (
    <PublicShell>
      <Helmet><title>Article not found — PrivcybHub</title><meta name="robots" content="noindex" /></Helmet>
      <div className="max-w-3xl mx-auto px-5 py-24"><h1 className="text-3xl font-semibold">Article not found</h1><Link to="/learn" className="text-primary mt-4 inline-block">Back to Learn</Link></div>
    </PublicShell>
  );

  const url = post.canonical_url || `${SITE_URL}${publicPath(post)}`;
  const title = post.seo_title || post.title;
  const desc = post.seo_description || post.excerpt || "";
  const faq: FaqItem[] = Array.isArray(post.faq) ? post.faq : [];
  const toc = headings(post.body_md);
  const date = new Date(post.published_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "long" });
  const ld: any[] = [
    { "@context": "https://schema.org", "@type": post.content_type === "article" ? "Article" : "BlogPosting", headline: post.title, description: desc,
      datePublished: post.published_at, dateModified: post.updated_at, author: { "@type": post.author_name ? "Person" : "Organization", name: post.author_name || "PrivcybHub" },
      publisher: { "@type": "Organization", name: "PrivcybHub", url: SITE_URL }, mainEntityOfPage: url, image: post.og_image_url || post.cover_image_url || undefined,
      keywords: post.tags?.join(", "), abstract: post.ai_summary || undefined },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Learn", item: `${SITE_URL}/learn` },
      { "@type": "ListItem", position: 2, name: post.title, item: url }] },
  ];
  if (faq.length) ld.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });

  return (
    <PublicShell>
      <Helmet>
        <title>{title} | PrivcybHub</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        {post.noindex && <meta name="robots" content="noindex" />}
        <meta property="og:type" content="article" /><meta property="og:title" content={title} /><meta property="og:description" content={desc} /><meta property="og:url" content={url} />
        {(post.og_image_url || post.cover_image_url) && <meta property="og:image" content={post.og_image_url || post.cover_image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="article:published_time" content={post.published_at} />
        {ld.map((x, i) => <script key={i} type="application/ld+json">{JSON.stringify(x)}</script>)}
      </Helmet>
      <article className="max-w-6xl mx-auto px-5 pt-12 grid lg:grid-cols-[1fr_260px] gap-12">
        <div className="max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground"><Link to="/learn">Learn</Link> / {post.category || "Article"}</nav>
          <h1 className="text-4xl md:text-5xl font-semibold mt-4 leading-tight" style={{ fontFamily: FONT_DISPLAY }}>{post.title}</h1>
          {post.excerpt && <p className="text-lg text-muted-foreground mt-4">{post.excerpt}</p>}
          <p className="text-sm text-muted-foreground mt-4">{post.author_name || "PrivcybHub"} · <time dateTime={post.published_at}>{date}</time> · {post.reading_minutes} min read</p>
          {post.cover_image_url && <img src={post.cover_image_url} alt="" className="rounded-xl mt-8 w-full max-h-[420px] object-cover" />}
          {post.ai_summary && (
            <aside className="mt-8 rounded-xl border border-primary/30 bg-primary/5 p-5" aria-label="Summary">
              <p className="font-mono text-xs uppercase text-primary mb-1">Key takeaway</p><p className="text-sm">{post.ai_summary}</p>
            </aside>
          )}
          <div className="mt-6"><Markdown>{post.body_md}</Markdown></div>
          {faq.length > 0 && (
            <section className="mt-12"><h2 className="text-3xl font-semibold mb-4" style={{ fontFamily: FONT_DISPLAY }}>Frequently asked questions</h2>
              {faq.map((f, i) => <details key={i} className="border-b border-border py-4"><summary className="font-medium cursor-pointer">{f.q}</summary><p className="text-muted-foreground mt-2">{f.a}</p></details>)}
            </section>
          )}
          {post.tags?.length > 0 && <div className="flex flex-wrap gap-2 mt-10">{post.tags.map((t: string) => <Link key={t} to={`/learn/topic/${encodeURIComponent(t)}`} className="text-xs border border-border rounded-full px-3 py-1">{t}</Link>)}</div>}
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            {toc.length > 0 && <nav aria-label="Contents"><p className="font-mono text-xs uppercase text-muted-foreground mb-2">Contents</p>
              <ul className="space-y-2 text-sm">{toc.map((h) => <li key={h.id} className={h.level === 3 ? "pl-3" : ""}><a href={`#${h.id}`} className="text-muted-foreground hover:text-primary">{h.text}</a></li>)}</ul></nav>}
            <LeadForm compact type="newsletter" heading="Get updates" sourceSlug={post.slug} />
          </div>
        </aside>
      </article>
      <section className="max-w-3xl mx-auto px-5 mt-16"><LeadForm sourceSlug={post.slug} /></section>
      {related.length > 0 && (
        <section className="max-w-6xl mx-auto px-5 mt-16"><h2 className="text-2xl font-semibold mb-4" style={{ fontFamily: FONT_DISPLAY }}>Related reading</h2>
          <div className="grid md:grid-cols-3 gap-5">{related.map((r) => <Link key={r.slug} to={publicPath(r)} className="border border-border rounded-xl p-5 hover:border-primary"><h3 className="font-semibold">{r.title}</h3><p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.excerpt}</p></Link>)}</div>
        </section>
      )}
    </PublicShell>
  );
}
