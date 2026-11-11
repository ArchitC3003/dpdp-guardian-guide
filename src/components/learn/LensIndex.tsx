import { useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, PlayCircle, Presentation, ArrowRight } from "lucide-react";
import { FONT_DISPLAY, piecesLabel, publicPath } from "@/lib/content";

export type LensItem = {
  key: string;
  /** Shown before the name. Only for sets that really are numbered, such as the ten domains. */
  marker?: string;
  label: string;
  href: string;
  blurb: string;
  chips: { label: string; href: string }[];
  /** Plain supporting line, used when there are no chips to show. */
  note?: string;
  posts: { slug: string; title: string; content_type: string }[];
  moreLabel: string;
  emptyText: string;
  cta?: { label: string; href: string };
};

export function FormatGlyph({ type, className = "h-4 w-4" }: { type: string; className?: string }) {
  const Icon = type === "video" ? PlayCircle : type === "presentation" ? Presentation : FileText;
  return <Icon className={className} aria-hidden="true" />;
}

/** One arc per item. The ring turns so the active item's arc sits at nine o'clock, beside the list. */
function Ring({ count, active }: { count: number; active: number }) {
  const turn = useRef(0);
  const last = useRef(active);
  const step = 360 / count;
  // Take the short way round so the ring never spins the long way between neighbours.
  let delta = (last.current - active) * step;
  delta = ((delta + 540) % 360) - 180;
  turn.current += delta;
  last.current = active;

  const R = 270, C = 300, gap = count > 1 ? 5 : 0;
  const pt = (deg: number, r = R) => { const a = ((deg - 90) * Math.PI) / 180; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  return (
    <svg className="lrn-ring" viewBox="0 0 600 600" aria-hidden="true">
      <circle cx={C} cy={C} r={206} className="lrn-ring-inner" />
      <circle cx={C} cy={C} r={150} className="lrn-ring-core" />
      <g style={{ transform: `rotate(${turn.current + 270}deg)`, transformOrigin: "300px 300px" }} className="lrn-ring-turn">
        {Array.from({ length: count }, (_, i) => {
          const from = i * step - step / 2 + gap / 2, to = i * step + step / 2 - gap / 2;
          const [x1, y1] = pt(from), [x2, y2] = pt(to);
          const [tx, ty] = pt(i * step, R + 22);
          return (
            <g key={i} data-active={i === active}>
              <path d={`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`} className="lrn-ring-arc" />
              <circle cx={tx} cy={ty} r={2.5} className="lrn-ring-tick" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/**
 * A set of things to browse (domains, frameworks, artefacts) as one index. A glass lens glides to the row
 * being pointed at or focused, the ring turns to match, and the panel shows what that row holds.
 */
export function LensIndex({ items, label }: { items: LensItem[]; label: string }) {
  const [active, setActive] = useState(items[0]?.key);
  const rows = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [lens, setLens] = useState<{ y: number; h: number } | null>(null);
  const curIndex = Math.max(0, items.findIndex((d) => d.key === active));
  const cur = items[curIndex];

  // Keep the lens on the active row, including after fonts load or the window resizes.
  useLayoutEffect(() => {
    const place = () => { const el = cur ? rows.current[cur.key] : null; if (el) setLens({ y: el.offsetTop, h: el.offsetHeight }); };
    place();
    window.addEventListener("resize", place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [cur, items]);

  if (!cur) return null;
  const numbered = items.some((d) => d.marker);

  return (
    <div className="relative grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] gap-x-20 gap-y-8 items-start">
      <nav aria-label={label} className="relative">
        {lens && <div className="lrn-lens" aria-hidden="true" style={{ transform: `translateY(${lens.y}px)`, height: lens.h }} />}
        <ol className="relative m-0 p-0 list-none">
          {items.map((d, i) => (
            <li key={d.key}>
              <Link to={d.href} ref={(el) => { rows.current[d.key] = el; }} data-active={d.key === cur.key} data-plain={!numbered}
                onMouseEnter={() => setActive(d.key)} onFocus={() => setActive(d.key)}
                className="lrn-row" style={{ "--i": i } as React.CSSProperties}>
                {numbered && <span className="lrn-row-no">{d.marker}</span>}
                <span className="lrn-row-name" style={{ fontFamily: FONT_DISPLAY }}>{d.label}</span>
                {d.posts.length > 0 && <span className="lrn-row-count">{piecesLabel(d.posts.length)}</span>}
              </Link>
            </li>
          ))}
        </ol>
      </nav>

      <div className="hidden lg:block sticky top-28" aria-live="polite">
        <Ring count={items.length} active={curIndex} />
        <section key={cur.key} className="lrn-panel relative">
          <h2 className="text-[2.6rem] leading-[1.05] font-semibold text-foreground" style={{ fontFamily: FONT_DISPLAY }}>{cur.label}</h2>
          <p className="mt-3 text-[1.05rem] leading-relaxed text-muted-foreground max-w-md">{cur.blurb}</p>

          {cur.chips.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2 list-none p-0">
              {cur.chips.map((c) => <li key={c.href}><Link to={c.href} className="lrn-chip">{c.label}</Link></li>)}
            </ul>
          ) : cur.note ? <p className="mt-6 text-sm text-muted-foreground max-w-md">{cur.note}</p> : null}

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
              <Link to={cur.href} className="lrn-more mt-5">{cur.moreLabel}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </>
          ) : (
            <p className="mt-7 text-sm text-foreground/80 max-w-md">{cur.emptyText} <a href="#updates" className="text-primary underline underline-offset-4">Get an email when the first piece lands.</a></p>
          )}
          {cur.cta && <div className="mt-6"><Link to={cur.cta.href} className="lrn-cta">{cur.cta.label}</Link></div>}
        </section>
      </div>
    </div>
  );
}
