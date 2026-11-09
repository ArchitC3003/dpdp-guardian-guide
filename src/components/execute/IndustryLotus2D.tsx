import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { SunburstNode } from "@/types/execute";
import { petalColor, type DonutSegment } from "./lotusSegments";

/**
 * 2.5D organic lotus: layered SVG planes under CSS perspective. The flower tilts
 * toward the cursor, and the background "camera" (aura, horizon grid, particles)
 * pans toward and recolours for the hovered/selected industry.
 */

type Exposure = DonutSegment["exposure"];
const AURA: Record<Exposure, string> = { High: "350 85% 55%", Medium: "38 95% 55%", Low: "168 76% 45%" };
const VB = 600;
const C = VB / 2;

function leafIds(n: SunburstNode, out: string[] = []) {
  if (n.industry) out.push(n.industry.PrivCybHub_Sector_ID);
  (n.children ?? []).forEach((c) => leafIds(c, out));
  return out;
}


/** Deterministic per-petal variation in [-1, 1]. */
const jitter = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.cos(i * 4.1 + k) * 0.5;

/** Organic asymmetric petal pointing up (-y): uneven flanks and a swept tip. */
function petalPath(len: number, w: number, i = 0) {
  const lw = w * (1 + jitter(i, 1) * 0.18);
  const rw = w * (1 - jitter(i, 1) * 0.18);
  const tip = w * 0.22 * jitter(i, 2);
  const tl = -len * (1 + jitter(i, 3) * 0.04);
  return `M0,0 C${rw * 1.15},${-len * 0.22} ${rw * 0.9},${-len * (0.72 + jitter(i, 4) * 0.06)} ${tip},${tl}
          C${-lw * 0.85},${-len * (0.8 + jitter(i, 5) * 0.06)} ${-lw * 1.1},${-len * 0.32} 0,0Z`;
}

interface Props {
  segments: DonutSegment[];
  selectedIds: Set<string>;
  onSelect: (n: SunburstNode, additive: boolean) => void;
  onHover?: (node: SunburstNode | null, breadcrumb: string[]) => void;
  /** Sector ids to keep lit (e.g. search matches); null = no highlight. */
  highlightIds?: Set<string> | null;
  /** Touch layout: square stage, no side card. */
  compact?: boolean;
  /** Extra controls drawn over the stage (e.g. back / add-all while a sector is open). */
  overlay?: ReactNode;
}

export function IndustryLotus2D({ segments, selectedIds, onSelect, onHover, highlightIds = null, compact = false, overlay }: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0, px: 0.5, py: 0.5, tpx: 0.5, tpy: 0.5 });
  const [, force] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const reduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );

  const n = segments.length || 1;
  const selectedIdx = useMemo(() => {
    const set = new Set<number>();
    segments.forEach((s, i) => {
      if (leafIds(s.node).some((id) => selectedIds.has(id))) set.add(i);
    });
    return set;
  }, [segments, selectedIds]);

  const focus = hover ?? (selectedIdx.size ? [...selectedIdx][selectedIdx.size - 1] : null);
  const focusSeg = focus !== null ? segments[focus] : null;
  const focusAngle = focus !== null ? (focus / n) * Math.PI * 2 : 0;

  useEffect(() => {
    onHover?.(hover !== null ? segments[hover].node : null, hover !== null ? [segments[hover].name] : []);
  }, [hover, segments, onHover]);

  // Damped spring loop for cursor tilt + camera pan.
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const t = tilt.current;
      const k = reduced ? 1 : 0.08;
      t.x += (t.tx - t.x) * k;
      t.y += (t.ty - t.y) * k;
      t.px += (t.tpx - t.px) * k;
      t.py += (t.tpy - t.py) * k;
      const el = stage.current;
      if (el) {
        el.style.setProperty("--rx", `${t.x}deg`);
        el.style.setProperty("--ry", `${t.y}deg`);
        el.style.setProperty("--px", `${t.px}`);
        el.style.setProperty("--py", `${t.py}`);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  // Camera target follows focused petal when the cursor isn't steering.
  useEffect(() => {
    const t = tilt.current;
    if (focus !== null) {
      t.tpx = 0.5 + Math.sin(focusAngle) * 0.25;
      t.tpy = 0.5 - Math.cos(focusAngle) * 0.25;
    }
    force((v) => v + 1);
  }, [focus, focusAngle]);

  const onMove = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top) / r.height;
    const t = tilt.current;
    if (!reduced) {
      t.ty = (nx - 0.5) * 18;
      t.tx = -(ny - 0.5) * 14 + 8;
    }
    if (hover === null) { t.tpx = nx; t.tpy = ny; }
    setTip({ x: e.clientX - r.left, y: e.clientY - r.top });
  };
  const onLeave = () => {
    const t = tilt.current;
    t.tx = 8; t.ty = 0;
    if (focus === null) { t.tpx = 0.5; t.tpy = 0.5; }
    setHover(null);
    setTip(null);
  };

  const aura = focusSeg ? AURA[focusSeg.exposure] : "168 76% 45%";
  const counts = segments.reduce<Record<Exposure, number>>((m, s) => ((m[s.exposure] += 1), m), { High: 0, Medium: 0, Low: 0 });

  const petals = segments.map((s, i) => {
    const ang = (i / n) * 360;
    // Petal length = data-protection risk (0.3 all-Low … 1 all-High).
    const len = 150 + ((s.risk - 0.3) / 0.7) * 105;
    const w = Math.min(62, (Math.PI * 2 * 95) / n * 0.62);
    const lit = !highlightIds || leafIds(s.node).some((id) => highlightIds.has(id));
    const active = hover === i || selectedIdx.has(i);
    const color = petalColor(i);
    return { s, i, ang: ang + jitter(i, 6) * 4, len, w, lit, active, color };
  });

  return (
    <div
      ref={stage}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      className={`lotus-stage relative mx-auto ${compact ? "aspect-square touch-manipulation" : "aspect-[16/10]"} w-full overflow-hidden rounded-2xl border border-border bg-background`}
      style={{ ["--aura" as string]: aura, ["--rx" as string]: "8deg", ["--ry" as string]: "0deg", ["--px" as string]: 0.5, ["--py" as string]: 0.5 }}
    >
      {/* Background camera: aura, horizon grid, particles */}
      <div aria-hidden className="lotus-aura absolute inset-0" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[55%] [perspective:600px]">
        <div className="lotus-grid absolute inset-[-40%_-30%_0_-30%]" />
      </div>
      <div aria-hidden className="absolute inset-0">
        {Array.from({ length: 28 }).map((_, k) => (
          <span
            key={k}
            className="lotus-dust absolute rounded-full"
            style={{
              left: `${(k * 37) % 100}%`, top: `${(k * 53) % 100}%`,
              width: 2 + (k % 3), height: 2 + (k % 3),
              animationDelay: `${(k % 7) * -1.3}s`, animationDuration: `${9 + (k % 5) * 2}s`,
              ["--depth" as string]: (k % 4) + 1,
            }}
          />
        ))}
      </div>

      {/* HUD */}
      <div className="pointer-events-none absolute left-4 top-4 z-20 flex gap-2 font-mono text-[10px] uppercase tracking-widest">
        {(["High", "Medium", "Low"] as Exposure[]).map((e) => (
          <span key={e} className="rounded-full border border-border bg-card/60 px-2.5 py-1 backdrop-blur" style={{ color: `hsl(${AURA[e]})` }}>
            {e} · {counts[e]}
          </span>
        ))}
      </div>
      {focusSeg && !compact && (
        <div className="pointer-events-none absolute right-4 top-4 z-20 max-w-[16rem] rounded-xl border border-border bg-card/70 p-3 text-right backdrop-blur">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{hover !== null ? "Exploring" : "Selected"}</p>
          <p className="text-sm font-semibold text-foreground">{focusSeg.name}</p>
          <p className="font-mono text-[11px]" style={{ color: `hsl(${AURA[focusSeg.exposure]})` }}>{focusSeg.exposure} DPDP exposure</p>
        </div>
      )}

      {overlay && <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2">{overlay}</div>}

      {/* 2.5D flower */}
      <div className="absolute inset-0 grid place-items-center [perspective:1400px]">
        <div
          className="lotus-flower relative aspect-square h-[92%] [transform-style:preserve-3d]"
          style={{ transform: "rotateX(var(--rx)) rotateY(var(--ry))" }}
        >
          {/* Back plane: sepals */}
          <svg viewBox={`0 0 ${VB} ${VB}`} className="absolute inset-0 h-full w-full" style={{ transform: "translateZ(-40px)" }} aria-hidden>
            <g transform={`translate(${C} ${C})`}><g className={reduced ? "" : "lotus-spin-slow"}>
              {petals.map(({ i, ang, len, w }) => (
                <path key={i} d={petalPath(len * 0.82, w * 0.8, i + 7)} transform={`rotate(${ang + 180 / n})`}
                  className="fill-primary/10 stroke-primary/25" strokeWidth={1} />
              ))}
            </g></g>
          </svg>

          {/* Main plane: interactive petals */}
          <svg viewBox={`0 0 ${VB} ${VB}`} className="absolute inset-0 h-full w-full overflow-visible" style={{ transform: "translateZ(0px)" }}>
            <defs>
              {petals.map(({ i, color }) => (
                <linearGradient key={i} id={`lp-${i}`} x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="55%" stopColor={color} stopOpacity={0.75} />
                  <stop offset="100%" stopColor={color} stopOpacity={1} />
                </linearGradient>
              ))}
              <filter id="lp-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            <g transform={`translate(${C} ${C})`}>
              {petals.map(({ s, i, ang, len, w, lit, active, color }) => (
                <g key={s.name + i} transform={`rotate(${ang})`}>
                  <g className={reduced ? "" : "lotus-bloom"} style={{ animationDelay: `${i * (0.45 / n)}s` }}>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={`${s.name}, ${s.count > 1 ? `${s.count} sub-sectors, ` : ""}${s.exposure} DPDP exposure`}
                    aria-pressed={selectedIdx.has(i)}
                    className="lotus-petal cursor-pointer outline-none"
                    style={{
                      transform: `translateY(${active ? -18 : 0}px) scale(${hover === i ? 1.07 : 1})`,
                      opacity: lit ? 1 : 0.18,
                      filter: active ? "url(#lp-glow)" : undefined,
                    }}
                    onPointerEnter={() => setHover(i)}
                    onPointerLeave={() => setHover((h) => (h === i ? null : h))}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    onClick={(e) => onSelect(s.node, e.shiftKey || e.metaKey || e.ctrlKey)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(s.node, e.shiftKey); }
                    }}
                  >
                    <path d={petalPath(len, w, i)} fill={`url(#lp-${i})`} stroke={color} strokeOpacity={active ? 1 : 0.6} strokeWidth={active ? 2 : 1} />
                    {/* veins */}
                    <path d={`M0,-14 Q${w * 0.12 + w * 0.1 * jitter(i, 2)},${-len * 0.5} ${w * 0.2 * jitter(i, 2)},${-len * 0.93}`} fill="none" className="stroke-foreground/30" strokeWidth={1} />
                    <path d={`M0,-30 Q${w * 0.55},${-len * 0.45} ${w * 0.35},${-len * 0.78}`} fill="none" className="stroke-foreground/15" strokeWidth={0.8} />
                    <path d={`M0,-30 Q${-w * 0.55},${-len * 0.45} ${-w * 0.35},${-len * 0.78}`} fill="none" className="stroke-foreground/15" strokeWidth={0.8} />
                    {selectedIdx.has(i) && <circle cx={w * 0.22 * jitter(i, 2)} cy={-len - 12} r={4} fill={color} className="lotus-pulse" />}
                  </g>
                  </g>
                </g>
              ))}
            </g>
          </svg>

          {/* Front plane: core */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center" style={{ transform: "translateZ(60px)" }}>
            <div className="lotus-core grid h-[24%] w-[24%] place-items-center rounded-full text-center">
              <div>
                <p className="font-mono text-2xl font-bold text-foreground">
                  {focusSeg ? (focusSeg.count > 1 ? focusSeg.count : focusSeg.exposure) : segments.length}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                  {focusSeg ? (focusSeg.count > 1 ? "sub-sectors" : "exposure") : segments[0]?.count === 1 ? "sub-sectors" : "sectors"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cursor tooltip */}
      {hover !== null && tip && (
        <div
          className="pointer-events-none absolute z-30 rounded-lg border border-border bg-popover/90 px-3 py-2 text-xs shadow-lg backdrop-blur"
          style={{ left: tip.x + 16, top: tip.y + 16 }}
        >
          <p className="font-semibold text-popover-foreground">{segments[hover].name}</p>
          {segments[hover].subtitle && <p className="max-w-[14rem] text-[11px] text-muted-foreground">{segments[hover].subtitle}</p>}
          <p className="font-mono text-muted-foreground">
            {segments[hover].count > 1 ? `${segments[hover].count} sub-sectors · ` : ""}
            <span style={{ color: `hsl(${AURA[segments[hover].exposure]})` }}>{segments[hover].exposure}</span>
          </p>
        </div>
      )}
    </div>
  );
}
