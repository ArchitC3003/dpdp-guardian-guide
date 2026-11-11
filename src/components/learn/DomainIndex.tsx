import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, PlayCircle, Presentation, ArrowRight } from "lucide-react";
import { DOMAIN_BLURBS, FONT_DISPLAY, domainPath, publicPath, topicPath } from "@/lib/content";

export type IndexDomain = {
  code: string; number: number; name: string;
  /** Topics that have something published under them. */
  topics: { id: string; slug: string; name: string }[];
  /** Topic names this part covers, shown as plain text when nothing is published yet. */
  covers: string[];
  posts: { slug: string; title: string; content_type: string }[];
};

export function FormatGlyph({ type, className = "h-4 w-4" }: { type: string; className?: string }) {
  const Icon = type === "video" ? PlayCircle : type === "presentation" ? Presentation : FileText;
  return <Icon className={className} aria-hidden="true" />;
}
const pieces = (n: number) => (n === 1 ? "1 piece" : `${n} pieces`);

/**
 * The ten parts of the Learn repository as one index. A glass lens glides to the part being pointed at
 * (or focused), and the panel beside it shows what that part holds.
 */
export function DomainIndex({ domains, initial }: { domains: IndexDomain[]; initial?: string }) {
  const [active, setActive] = useState(initial && domains.some((d) => d.code === initial) ? initial : domains[0]?.code);
  const stage = useRef<HTMLDivElement>(null);
  const rows = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [lens, setLens] = useState<{ y: number; h: number } | null>(null);

  useEffect(() => { if (initial && domains.some((d) => d.code === initial)) setActive(initial); }, [initial, domains]);

  // Keep the lens on the active row, including after fonts load or the window resizes.
  useLayoutEffect(() => {
    const place = () => { const el = active ? rows.current[active] : null; if (el) setLens({ y: el.offsetTop, h: el.offsetHeight }); };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [active, domains]);

  // The glow under the glass trails the pointer.
  const onMove = (e: React.PointerEvent) => {
    const el = stage.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  const cur = domains.find((d) => d.code === active) || domains[0];
  if (!cur) return null;

  return (
    <div ref={stage} onPointerMove={onMove} className="lrn-stage grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-x-14 gap-y-8 items-start">
      <div className="lrn-aurora" aria-hidden="true"><i /></div>
      <nav aria-label="Parts of the privacy programme" className="relative">
        {lens && <div className="lrn-lens" aria-hidden="true" style={{ transform: `translateY(${lens.y}px)`, height: lens.h }} />}
        <ol className="relative m-0 p-0 list-none">
          {domains.map((d, i) => (
            <li key={d.code}>
              <Link to={domainPath(d.code)} ref={(el) => { rows.current[d.code] = el; }} data-active={d.code === cur.code}
                onMouseEnter={() => setActive(d.code)} onFocus={() => setActive(d.code)}
                className="lrn-row" style={{ "--i": i } as React.CSSProperties}>
                <span className="lrn-row-no">{d.number}</span>
                <span className="lrn-row-name" style={{ fontFamily: FONT_DISPLAY }}>{d.name}</span>
                {d.posts.length > 0 && <span className="lrn-row-count">{pieces(d.posts.length)}</span>}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="hidden lg:block sticky top-28" aria-live="polite">
        <section key={cur.code} className="lrn-panel">
          <h2 className="text-[2.6rem] leading-[1.05] font-semibold text-foreground" style={{ fontFamily: FONT_DISPLAY }}>{cur.name}</h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground max-w-md">{DOMAIN_BLURBS[cur.code]}</p>

          {cur.topics.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2 list-none p-0">
              {cur.topics.map((t) => <li key={t.id}><Link to={topicPath(cur.code, t.slug)} className="lrn-chip">{t.name}</Link></li>)}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground max-w-md">Covers {cur.covers.join(", ").toLowerCase()}.</p>
          )}

          {cur.posts.length > 0 ? (
            <>
              <ul className="mt-7 list-none p-0 border-t border-border/70">
                {cur.posts.slice(0, 3).map((p) => (
                  <li key={p.slug} className="border-b border-border/70">
                    <Link to={publicPath(p)} className="lrn-item py-3">
                      <span className="lrn-glyph"><FormatGlyph type={p.content_type} /></span>
                      <span className="lrn-item-title text-[0.98rem] font-medium leading-snug">{p.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={domainPath(cur.code)} className="lrn-more mt-5">Everything in {cur.name}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </>
          ) : (
            <p className="mt-7 text-sm text-foreground/80 max-w-md">Nothing is published in this part yet. <a href="#updates" className="text-primary underline underline-offset-4">Get an email when the first piece lands.</a></p>
          )}
        </section>
      </div>
    </div>
  );
}
