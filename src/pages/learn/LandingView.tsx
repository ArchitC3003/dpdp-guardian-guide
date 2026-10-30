import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/learn/PublicShell";
import { LeadForm } from "@/components/learn/LeadForm";
import { Markdown } from "@/components/learn/Markdown";
import { FONT_DISPLAY, SITE_URL, type LandingBlock, isLive } from "@/lib/content";

const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);

export default function LandingView() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  useEffect(() => {
    supabase.from("content_posts").select("*").eq("slug", slug!).eq("content_type", "landing").maybeSingle().then(({ data }) => {
      if (!data || !isLive(data)) { setState("missing"); return; }
      setPost(data); setState("ok");
    });
  }, [slug]);
  if (state === "loading") return <PublicShell><p className="max-w-3xl mx-auto px-5 py-24 text-muted-foreground">Loading…</p></PublicShell>;
  if (state === "missing") return <PublicShell><Helmet><meta name="robots" content="noindex" /></Helmet><div className="max-w-3xl mx-auto px-5 py-24"><h1 className="text-3xl font-semibold">Page not found</h1><Link to="/" className="text-primary">Home</Link></div></PublicShell>;

  const url = post.canonical_url || `${SITE_URL}/lp/${post.slug}`;
  const blocks: LandingBlock[] = Array.isArray(post.blocks) ? post.blocks : [];
  const title = post.seo_title || post.title;
  return (
    <PublicShell>
      <Helmet>
        <title>{title} | PrivcybHub</title>
        <meta name="description" content={post.seo_description || post.excerpt || ""} />
        <link rel="canonical" href={url} />
        {post.noindex && <meta name="robots" content="noindex" />}
        <meta property="og:title" content={title} /><meta property="og:url" content={url} /><meta property="og:description" content={post.seo_description || post.excerpt || ""} />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: title, url, description: post.seo_description || post.excerpt })}</script>
      </Helmet>
      {blocks.length === 0 && <section className="max-w-4xl mx-auto px-5 py-20"><h1 className="text-5xl font-semibold" style={{ fontFamily: FONT_DISPLAY }}>{post.title}</h1><Markdown>{post.body_md}</Markdown></section>}
      {blocks.map((b, i) => {
        if (b.type === "hero") return (
          <section key={i} className="max-w-5xl mx-auto px-5 pt-20 pb-12 text-center">
            <h1 className="text-5xl md:text-6xl font-semibold leading-tight" style={{ fontFamily: FONT_DISPLAY }}>{b.heading || post.title}</h1>
            {b.body && <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">{b.body}</p>}
            <a href="#lp-form" className="inline-block mt-8 rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium">Get started</a>
          </section>);
        if (b.type === "benefits") return (
          <section key={i} className="max-w-6xl mx-auto px-5 py-12">{b.heading && <h2 className="text-3xl font-semibold mb-8 text-center" style={{ fontFamily: FONT_DISPLAY }}>{b.heading}</h2>}
            <div className="grid md:grid-cols-3 gap-5">{lines(b.body).map((l, j) => { const [h, d] = l.split("|"); return <div key={j} className="border border-border rounded-xl p-6 bg-card"><h3 className="font-semibold">{h?.trim()}</h3>{d && <p className="text-sm text-muted-foreground mt-2">{d.trim()}</p>}</div>; })}</div>
          </section>);
        if (b.type === "faq") return (
          <section key={i} className="max-w-3xl mx-auto px-5 py-12"><h2 className="text-3xl font-semibold mb-4" style={{ fontFamily: FONT_DISPLAY }}>{b.heading || "Questions"}</h2>
            {lines(b.body).map((l, j) => { const [q, a] = l.split("|"); return <details key={j} className="border-b border-border py-4"><summary className="font-medium cursor-pointer">{q?.trim()}</summary><p className="text-muted-foreground mt-2">{a?.trim()}</p></details>; })}
          </section>);
        if (b.type === "cta") return (
          <section key={i} id="lp-form" className="max-w-xl mx-auto px-5 py-12 scroll-mt-24">{b.body && <p className="text-center text-muted-foreground mb-4">{b.body}</p>}<LeadForm type="demo" heading={b.heading || "Book a walkthrough"} sourceSlug={post.slug} /></section>);
        return <section key={i} className="max-w-3xl mx-auto px-5 py-8">{b.heading && <h2 className="text-3xl font-semibold" style={{ fontFamily: FONT_DISPLAY }}>{b.heading}</h2>}<Markdown>{b.body}</Markdown></section>;
      })}
      {!blocks.some((b) => b.type === "cta") && <section id="lp-form" className="max-w-xl mx-auto px-5 py-12"><LeadForm type="demo" sourceSlug={post.slug} /></section>}
    </PublicShell>
  );
}
