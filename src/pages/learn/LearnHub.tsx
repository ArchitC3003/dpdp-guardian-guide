import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PublicShell } from "@/components/learn/PublicShell";
import { LeadForm } from "@/components/learn/LeadForm";
import { DomainIndex, FormatGlyph, type IndexDomain } from "@/components/learn/DomainIndex";
import { loadAllFilings, useContentTaxonomy } from "@/hooks/useContentTaxonomy";
import {
  DEFAULT_DOMAINS, DOMAIN_BLURBS, FONT_DISPLAY, FORMAT_FILTERS, FRAMEWORK_FILTERS, SITE_URL,
  domainPath, homeDomainOf, isLive, liveDate, matchesLearnFilters, postIdsFiledUnder, publicPath, topicPath, type FormatFilter,
} from "@/lib/content";

type Row = { id: string; slug: string; title: string; excerpt: string | null; content_type: string; category: string | null; tags: string[]; frameworks: string[]; cover_image_url: string | null; published_at: string; scheduled_for: string | null; status: string; reading_minutes: number; featured: boolean };
type Filing = { post_id: string; topic_id: string; is_primary: boolean };

const effort = (r: Row) => (r.content_type === "video" ? "Watch" : r.content_type === "presentation" ? "Slides" : `${r.reading_minutes} min read`);

export default function LearnHub() {
  const { tag, domain: domainCode, topic: topicSlug } = useParams();
  const [rows, setRows] = useState<Row[]>([]);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<FormatFilter>("all");
  const [fw, setFw] = useState<string>("All");
  const [fwChips, setFwChips] = useState<string[]>(FRAMEWORK_FILTERS);
  const taxonomy = useContentTaxonomy();

  useEffect(() => {
    supabase.from("content_frameworks").select("code").eq("is_active", true).order("display_order")
      .then(({ data }) => { if (data?.length) setFwChips(["All", ...data.map((d) => d.code)]); });
    loadAllFilings().then((f) => { if (f) setFilings(f); });
  }, []);

  useEffect(() => {
    let query = supabase.from("content_posts")
      .select("id,slug,title,excerpt,content_type,category,tags,frameworks,cover_image_url,published_at,scheduled_for,status,reading_minutes,featured")
      .in("status", ["published", "scheduled"]).neq("content_type", "landing")
      .order("updated_at", { ascending: false }).limit(200);
    if (tag) query = query.contains("tags", [tag]);
    query.then(({ data }) => {
      const live = ((data as Row[]) || []).filter((r) => isLive(r))
        .sort((a, b) => new Date(liveDate(b)).getTime() - new Date(liveDate(a)).getTime());
      setRows(live); setLoading(false);
    });
  }, [tag]);

  // The ten parts always show, even before the database has them or before anything is filed.
  const domains: IndexDomain[] = useMemo(() => {
    const allTopics = taxonomy.domains.flatMap((d) => d.topics);
    return DEFAULT_DOMAINS.map((seed) => {
      const live = taxonomy.domains.find((d) => d.code === seed.code);
      const ids = postIdsFiledUnder(filings, allTopics, seed.code);
      return { code: seed.code, number: seed.number, name: live?.name || seed.name, covers: seed.topics,
        topics: (live?.topics || []).map((t) => ({ id: t.id, slug: t.slug, name: t.name })),
        posts: rows.filter((r) => ids.has(r.id)) };
    });
  }, [taxonomy.domains, filings, rows]);
  const allTopics = useMemo(() => taxonomy.domains.flatMap((d) => d.topics), [taxonomy.domains]);
  const domainName = (code: string | null) => domains.find((d) => d.code === code)?.name;

  const scopeDomain = domainCode ? domains.find((d) => d.code === domainCode) : undefined;
  const scopeTopic = scopeDomain && topicSlug ? scopeDomain.topics.find((t) => t.slug === topicSlug) : undefined;
  const scoped = useMemo(() => {
    if (!domainCode) return rows;
    const ids = postIdsFiledUnder(filings, allTopics, domainCode, topicSlug);
    return rows.filter((r) => ids.has(r.id));
  }, [rows, filings, allTopics, domainCode, topicSlug]);
  const filtered = useMemo(() => scoped.filter((r) => matchesLearnFilters(r, kind, fw, q)), [scoped, q, kind, fw]);
  const filtering = !!q || kind !== "all" || fw !== "All";

  const heading = scopeTopic ? scopeTopic.name : scopeDomain ? scopeDomain.name : tag ? tag : "Privacy practice, in ten parts";
  const lede = scopeTopic ? `Part ${scopeDomain!.number} of ten, ${scopeDomain!.name}. ${DOMAIN_BLURBS[scopeDomain!.code]}`
    : scopeDomain ? DOMAIN_BLURBS[scopeDomain.code]
    : tag ? "Everything we have published with this tag."
    : "Every guide, video and deck we publish sits in one of ten parts of a privacy programme. Start with the part you are working on.";
  const path = scopeTopic ? topicPath(scopeDomain!.code, scopeTopic.slug) : scopeDomain ? domainPath(scopeDomain.code) : tag ? `/learn/topic/${tag}` : "/learn";
  const url = SITE_URL + path;
  const title = scopeTopic ? `${scopeTopic.name}: guides, videos and slides | PrivcybHub Learn`
    : scopeDomain ? `${scopeDomain.name}: privacy guides and resources | PrivcybHub Learn`
    : tag ? `${tag} | PrivcybHub Learn` : "Learn: DPDP and privacy compliance, in ten parts | PrivcybHub";
  const desc = scopeDomain ? `${DOMAIN_BLURBS[scopeDomain.code]} Guides, videos and slides from PrivcybHub.`
    : "Practical guides, videos and slides on India's DPDP Act 2023, global privacy laws and cyber compliance, organised into ten parts of a privacy programme.";
  const listHeading = scopeTopic || scopeDomain || tag ? `${scoped.length === 1 ? "1 piece" : `${scoped.length} pieces`} here` : "Newest";
  const kindIndex = FORMAT_FILTERS.findIndex(([k]) => k === kind);

  return (
    <PublicShell>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={title} /><meta property="og:description" content={desc} /><meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "Blog", name: "PrivcybHub Learn", url,
          blogPost: scoped.slice(0, 20).map((r) => ({ "@type": "BlogPosting", headline: r.title, url: SITE_URL + publicPath(r), datePublished: liveDate(r) })) })}</script>
        {scopeDomain && <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
          { "@type": "ListItem", position: 1, name: "Learn", item: `${SITE_URL}/learn` },
          { "@type": "ListItem", position: 2, name: scopeDomain.name, item: SITE_URL + domainPath(scopeDomain.code) },
          ...(scopeTopic ? [{ "@type": "ListItem", position: 3, name: scopeTopic.name, item: url }] : [])] })}</script>}
      </Helmet>

      <section className="max-w-6xl mx-auto px-5 pt-14 md:pt-20">
        {(scopeDomain || tag) && (
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-5">
            <Link to="/learn" className="text-primary underline-offset-4 hover:underline">Learn</Link>
            {scopeTopic && <> / <Link to={domainPath(scopeDomain!.code)} className="text-primary underline-offset-4 hover:underline">{scopeDomain!.name}</Link></>}
          </nav>
        )}
        <h1 className="text-[clamp(2.6rem,6.2vw,5rem)] leading-[0.98] font-semibold tracking-[-0.01em] max-w-4xl" style={{ fontFamily: FONT_DISPLAY }}>{heading}</h1>
        <p className="mt-5 text-lg leading-relaxed text-muted-foreground max-w-xl">{lede}</p>
        {scopeDomain && scopeDomain.topics.length > 0 && (
          <ul className="mt-7 flex flex-wrap gap-2 list-none p-0">
            {scopeDomain.topics.map((t) => <li key={t.id}><Link to={topicPath(scopeDomain.code, t.slug)} aria-current={t.slug === topicSlug ? "page" : undefined} className="lrn-chip">{t.name}</Link></li>)}
          </ul>
        )}
      </section>

      {!tag && !domainCode && (
        <div className="overflow-x-clip py-10 -my-10">
          <section className="max-w-6xl mx-auto px-5 mt-12 md:mt-16" aria-label="The ten parts">
            <DomainIndex domains={domains} />
          </section>
        </div>
      )}

      <section className={`max-w-6xl mx-auto px-5 ${tag || domainCode ? "mt-14" : "mt-20 md:mt-28"}`} aria-labelledby="learn-list">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <h2 id="learn-list" className="text-4xl font-semibold" style={{ fontFamily: FONT_DISPLAY }}>{listHeading}</h2>
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
        <div role="group" aria-label="Framework" className="mt-5 flex flex-wrap gap-2">
          {fwChips.map((k) => <button key={k} type="button" aria-pressed={fw === k} onClick={() => setFw(k)} className="lrn-chip">{k === "All" ? "All frameworks" : k}</button>)}
        </div>

        <div className="mt-8">
          {loading ? <p className="text-muted-foreground">Loading…</p> : scoped.length === 0 ? (
            <p className="text-foreground/80 border-t border-border pt-8 max-w-xl">
              {scopeDomain || tag ? "Nothing is published here yet. " : "The first pieces are being prepared. "}
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
