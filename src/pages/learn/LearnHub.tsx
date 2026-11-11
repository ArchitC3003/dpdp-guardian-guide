import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/learn/PublicShell";
import { LeadForm } from "@/components/learn/LeadForm";
import { FormatGlyph, LensIndex, type LensItem } from "@/components/learn/LensIndex";
import { loadAllFilings, loadLivePosts, useArtefacts, useContentTaxonomy } from "@/hooks/useContentTaxonomy";
import {
  DEFAULT_DOMAINS, DEFAULT_FRAMEWORKS, DOMAIN_BLURBS, FONT_DISPLAY, FORMAT_FILTERS, FRAMEWORK_BLURBS, SITE_URL,
  artefactPath, domainPath, frameworkPath, homeDomainOf, isLive, liveDate, matchesLearnFilters, piecesLabel, postIdsFiledUnder, postsCarrying, publicPath, topicPath,
  type FormatFilter,
} from "@/lib/content";

type Row = { id: string; slug: string; title: string; excerpt: string | null; content_type: string; category: string | null; tags: string[]; frameworks: string[]; artefacts?: string[]; cover_image_url: string | null; published_at: string; scheduled_for: string | null; status: string; reading_minutes: number; featured: boolean };
type Filing = { post_id: string; topic_id: string; is_primary: boolean };
type Framework = { code: string; label: string; description?: string | null };
type Mode = "domains" | "frameworks" | "artefacts";

const effort = (r: Row) => (r.content_type === "video" ? "Watch" : r.content_type === "presentation" ? "Slides" : `${r.reading_minutes} min read`);

export default function LearnHub() {
  const { tag, domain: domainCode, topic: topicSlug, framework: frameworkCode, artefact: artefactCode } = useParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>(DEFAULT_FRAMEWORKS.map((c) => ({ code: c, label: c })));
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<FormatFilter>("all");
  const [fw, setFw] = useState<string>("All");
  const [mode, setMode] = useState<Mode>("domains");
  const taxonomy = useContentTaxonomy();
  const { artefacts, available: artefactsAvailable } = useArtefacts();
  const hero = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("content_frameworks").select("*").eq("is_active", true).order("display_order")
      .then(({ data }) => { if (data?.length) setFrameworks(data as Framework[]); });
    loadAllFilings().then((f) => { if (f) setFilings(f); });
  }, []);

  useEffect(() => {
    loadLivePosts(tag).then((data) => {
      const live = (data as Row[]).filter((r) => isLive(r)).sort((a, b) => new Date(liveDate(b)).getTime() - new Date(liveDate(a)).getTime());
      setRows(live); setLoading(false);
    });
  }, [tag]);

  // The glow and the lit dots trail the pointer anywhere in the hero.
  const onMove = (e: React.PointerEvent) => {
    const el = hero.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const allTopics = useMemo(() => taxonomy.domains.flatMap((d) => d.topics), [taxonomy.domains]);
  const domainName = (code: string | null) => taxonomy.domains.find((d) => d.code === code)?.name || DEFAULT_DOMAINS.find((d) => d.code === code)?.name;

  // Each way in is built from live data, so anything added in the Content Studio shows up here without a code change.
  const domainItems: LensItem[] = useMemo(() => DEFAULT_DOMAINS.map((seed) => {
    const live = taxonomy.domains.find((d) => d.code === seed.code);
    const ids = postIdsFiledUnder(filings, allTopics, seed.code);
    const name = live?.name || seed.name;
    return { key: seed.code, marker: String(seed.number), label: name, href: domainPath(seed.code), blurb: DOMAIN_BLURBS[seed.code],
      chips: (live?.topics || []).map((t) => ({ label: t.name, href: topicPath(seed.code, t.slug) })),
      note: `Covers ${seed.topics.join(", ").toLowerCase()}.`,
      posts: rows.filter((r) => ids.has(r.id)), moreLabel: `Everything in ${name}`, emptyText: "Nothing is published in this domain yet." };
  }), [taxonomy.domains, filings, allTopics, rows]);
  const frameworkItems: LensItem[] = useMemo(() => frameworks.map((f) => ({
    key: f.code, label: f.label || f.code, href: frameworkPath(f.code), blurb: f.description || FRAMEWORK_BLURBS[f.code] || `Guides, videos and slides that explain or apply ${f.label || f.code}.`,
    chips: [], posts: postsCarrying(rows, "frameworks", f.code), moreLabel: `Everything on ${f.label || f.code}`, emptyText: "Nothing is published on this yet.",
  })), [frameworks, rows]);
  const artefactItems: LensItem[] = useMemo(() => artefacts.map((a) => ({
    key: a.code, label: a.label, href: artefactPath(a.code), blurb: a.description || `A ${a.kind.toLowerCase()} you can prepare in PrivcybHub.`,
    chips: [], note: `${a.kind}. Read how it works here, then prepare your own.`,
    posts: postsCarrying(rows, "artefacts", a.code), moreLabel: `More on the ${a.label}`, emptyText: "No guide is published for this yet.",
    cta: { label: "Sign in to build it", href: "/auth" },
  })), [artefacts, rows]);
  const modes: [Mode, string, LensItem[]][] = [["domains", "Domains", domainItems], ["frameworks", "Regulations and standards", frameworkItems],
    ...(artefactsAvailable && artefactItems.length ? [["artefacts", "Artefacts to build", artefactItems] as [Mode, string, LensItem[]]] : [])];
  const current = modes.find(([m]) => m === mode) || modes[0];

  // What this page is scoped to, if anything.
  const scopeDomain = domainCode ? domainItems.find((d) => d.key === domainCode) : undefined;
  const scopeTopic = scopeDomain && topicSlug ? scopeDomain.chips.find((c) => c.href === topicPath(scopeDomain.key, topicSlug)) : undefined;
  const scopeFramework = frameworkCode ? frameworkItems.find((f) => f.key === frameworkCode) : undefined;
  const scopeArtefact = artefactCode ? artefactItems.find((a) => a.key === artefactCode) : undefined;
  const isHub = !tag && !domainCode && !frameworkCode && !artefactCode;
  const scoped = useMemo(() => {
    if (domainCode) { const ids = postIdsFiledUnder(filings, allTopics, domainCode, topicSlug); return rows.filter((r) => ids.has(r.id)); }
    if (frameworkCode) return postsCarrying(rows, "frameworks", frameworkCode);
    if (artefactCode) return postsCarrying(rows, "artefacts", artefactCode);
    return rows;
  }, [rows, filings, allTopics, domainCode, topicSlug, frameworkCode, artefactCode]);
  const filtered = useMemo(() => scoped.filter((r) => matchesLearnFilters(r, kind, frameworkCode ? "All" : fw, q)), [scoped, q, kind, fw, frameworkCode]);
  const filtering = !!q || kind !== "all" || fw !== "All";

  const heading = scopeTopic?.label || scopeDomain?.label || scopeFramework?.label || scopeArtefact?.label || tag || "Ten domains of privacy";
  const lede = scopeTopic ? `Domain ${scopeDomain!.marker} of ten, ${scopeDomain!.label}. ${scopeDomain!.blurb}`
    : scopeDomain?.blurb || scopeFramework?.blurb || scopeArtefact?.blurb
    || (tag ? "Everything we have published with this tag."
      : "Every regulation we explain, every guide we publish and every artefact you can build is filed under one of them. Start with the domain you are working on.");
  const path = scopeTopic?.href || scopeDomain?.href || scopeFramework?.href || scopeArtefact?.href || (tag ? `/learn/topic/${tag}` : "/learn");
  const url = SITE_URL + path;
  const title = isHub ? "Learn: ten domains of privacy, DPDP and compliance | PrivcybHub" : `${heading}: guides, videos and slides | PrivcybHub Learn`;
  const desc = isHub ? "Practical guides, videos and slides on India's DPDP Act 2023, global privacy laws and standards, organised into ten domains of privacy with the artefacts you can build from them."
    : `${lede} Guides, videos and slides from PrivcybHub.`;
  const kindIndex = FORMAT_FILTERS.findIndex(([k]) => k === kind);
  const crumb = scopeDomain || scopeFramework || scopeArtefact;

  return (
    <PublicShell>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} /><meta property="og:description" content={desc} /><meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "Blog", name: "PrivcybHub Learn", url,
          blogPost: scoped.slice(0, 20).map((r) => ({ "@type": "BlogPosting", headline: r.title, url: SITE_URL + publicPath(r), datePublished: liveDate(r) })) })}</script>
        {crumb && <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Learn", item: `${SITE_URL}/learn` },
          { "@type": "ListItem", position: 2, name: crumb.label, item: SITE_URL + crumb.href },
          ...(scopeTopic ? [{ "@type": "ListItem", position: 3, name: scopeTopic.label, item: url }] : [])] })}</script>}
      </Helmet>

      <div ref={hero} onPointerMove={onMove} className="lrn-hero">
        <div className="lrn-hero-bg" aria-hidden="true"><i /></div>
        <div className="lrn-dots" aria-hidden="true" /><div className="lrn-dots-lit" aria-hidden="true" />
        <div className="lrn-hero-fade" aria-hidden="true" />

        <section className="lrn-wrap pt-14 md:pt-20">
          {!isHub && (
            <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-5">
              <Link to="/learn" className="text-primary underline-offset-4 hover:underline">Learn</Link>
              {scopeTopic && <> / <Link to={scopeDomain!.href} className="text-primary underline-offset-4 hover:underline">{scopeDomain!.label}</Link></>}
            </nav>
          )}
          <h1 className="text-[clamp(2.6rem,6.4vw,5.5rem)] leading-[0.98] font-semibold tracking-[-0.01em] max-w-5xl" style={{ fontFamily: FONT_DISPLAY }}>{heading}</h1>
          <p className="mt-5 text-lg leading-relaxed text-foreground/75 max-w-2xl">{lede}</p>
          {scopeDomain && scopeDomain.chips.length > 0 && (
            <ul className="mt-7 flex flex-wrap gap-2 list-none p-0">
              {scopeDomain.chips.map((c) => <li key={c.href}><Link to={c.href} aria-current={c.href === scopeTopic?.href ? "page" : undefined} className="lrn-chip">{c.label}</Link></li>)}
            </ul>
          )}
          {scopeArtefact?.cta && <div className="mt-7"><Link to={scopeArtefact.cta.href} className="lrn-cta">{scopeArtefact.cta.label}</Link></div>}
        </section>

        {isHub ? (
          <section className="lrn-wrap mt-10 md:mt-12 pb-20" aria-label="Browse Learn">
            <div role="group" aria-label="Browse by" className="lrn-seg mb-8 max-w-full" style={{ "--count": modes.length, "--n": modes.indexOf(current) } as React.CSSProperties}>
              <span className="lrn-seg-thumb" aria-hidden="true" />
              {modes.map(([m, l]) => <button key={m} type="button" aria-pressed={current[0] === m} onClick={() => setMode(m)}>{l}</button>)}
            </div>
            <LensIndex key={current[0]} items={current[2]} label={current[1]} />
          </section>
        ) : <div className="pb-16" />}
      </div>

      <section className={`lrn-wrap ${isHub ? "mt-6" : "mt-2"}`} aria-labelledby="learn-list">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <h2 id="learn-list" className="text-4xl font-semibold" style={{ fontFamily: FONT_DISPLAY }}>{isHub ? "Newest" : `${piecesLabel(scoped.length)} here`}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Format" className="lrn-seg" style={{ "--count": FORMAT_FILTERS.length, "--n": kindIndex } as React.CSSProperties}>
              <span className="lrn-seg-thumb" aria-hidden="true" />
              {FORMAT_FILTERS.map(([k, l]) => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{l}</button>)}
            </div>
            <label className="relative block">
              <span className="sr-only">Search resources</span>
              <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" type="search"
                className="h-11 w-56 rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
          </div>
        </div>
        {!frameworkCode && (
          <div role="group" aria-label="Regulation or standard" className="mt-5 flex flex-wrap gap-2">
            {["All", ...frameworks.map((f) => f.code)].map((k) => <button key={k} type="button" aria-pressed={fw === k} onClick={() => setFw(k)} className="lrn-chip">{k === "All" ? "All regulations and standards" : k}</button>)}
          </div>
        )}

        <div className="mt-8">
          {loading ? <p className="text-muted-foreground">Loading…</p> : scoped.length === 0 ? (
            <p className="text-foreground/80 border-t border-border pt-8 max-w-xl">
              {isHub ? "The first pieces are being prepared. " : "Nothing is published here yet. "}
              <a href="#updates" className="text-primary underline underline-offset-4">Get an email when they go live.</a>
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-foreground/80 border-t border-border pt-8">
              Nothing matches those filters. <button type="button" className="text-primary underline underline-offset-4" onClick={() => { setQ(""); setKind("all"); setFw("All"); }}>Clear filters</button>
            </p>
          ) : (
            <ul className="list-none p-0 border-t border-border">
              {filtered.map((r) => {
                const home = domainName(homeDomainOf(r.id, filings, allTopics));
                return (
                  <li key={r.id} className="border-b border-border">
                    <Link to={publicPath(r)} className="lrn-item py-6 md:grid-cols-[auto_minmax(0,1fr)_14rem]">
                      <span className="lrn-glyph"><FormatGlyph type={r.content_type} className="h-[1.15rem] w-[1.15rem]" /></span>
                      <span className="min-w-0">
                        <span className="lrn-item-title block text-[1.65rem] leading-tight font-semibold" style={{ fontFamily: FONT_DISPLAY }}>{r.title}</span>
                        {r.excerpt && <span className="block mt-1.5 text-[0.95rem] leading-relaxed text-muted-foreground line-clamp-2 max-w-2xl">{r.excerpt}</span>}
                      </span>
                      <span className="col-start-2 md:col-start-3 mt-2 md:mt-0 md:text-right text-sm text-muted-foreground">
                        {home && <span className="block text-foreground/80">{home}</span>}
                        <span className="block">{effort(r)}{!filtering && r.featured ? ", editor's pick" : ""}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section id="updates" className="max-w-xl mx-auto px-5 mt-24 scroll-mt-28">
        <LeadForm type="newsletter" compact heading="Get new DPDP insights by email" sourceSlug="learn-hub" />
      </section>
    </PublicShell>
  );
}
