import { useMemo, useRef, useState, type CSSProperties } from "react";
import { m, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { STAGES, isUpcoming } from "./stages";
import { RIDGES, SUN, VIEW, footPath, ridgePath, trailPath } from "./landscape";

const EASE = [0.2, 0.7, 0.2, 1] as const;
/** Seconds before the marker starts walking, so the line has finished drawing. */
const WALK_DELAY = 3.6;
const WALK_LOOP = 15;
const WHEEL_R = 13;

/** A group of the scene that shifts with the pointer; nearer layers shift further. */
function Layer({ depth, px, py, children }: { depth: number; px: MotionValue<number>; py: MotionValue<number>; children: React.ReactNode }) {
  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth * 0.5);
  return <m.g style={{ x, y }}>{children}</m.g>;
}

/**
 * The hero scene: a tangled line unknots into a trail that climbs the range to the sun.
 * The six stages are waypoints; a marker walks the trail and opens each one as it passes.
 */
export function TrailScene({ onStage }: { onStage: (index: number) => void }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const held = useRef(false);
  const trail = useRef<SVGPathElement>(null);
  const walker = useRef<SVGGElement>(null);
  const marks = useRef<number[] | null>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const px = useSpring(rawX, { stiffness: 60, damping: 18 });
  const py = useSpring(rawY, { stiffness: 60, damping: 18 });
  const d = useMemo(() => trailPath(STAGES), []);
  const ridges = useMemo(() => RIDGES.map(ridgePath), []);
  const foot = useMemo(footPath, []);

  useAnimationFrame((t) => {
    const path = trail.current;
    if (reduce || held.current || !path || !walker.current || typeof path.getTotalLength !== "function") return;
    const total = path.getTotalLength();
    if (!marks.current) {
      // Where along the line each waypoint sits, found once by sampling.
      marks.current = STAGES.map((s) => {
        let best = 0, bd = Infinity;
        for (let i = 0; i <= 400; i++) {
          const q = path.getPointAtLength((total * i) / 400);
          const dd = (q.x - s.x) ** 2 + (q.y - s.y) ** 2;
          if (dd < bd) { bd = dd; best = i / 400; }
        }
        return best;
      });
    }
    const e = t / 1000 - WALK_DELAY;
    if (e < 0) return;
    const mk = marks.current;
    const c = (e % WALK_LOOP) / WALK_LOOP;
    const at = mk[0] + (mk[mk.length - 1] - mk[0]) * Math.min(1, c / 0.88);
    const q = path.getPointAtLength(total * at);
    // The wheel rolls: it turns by the distance it has covered.
    walker.current.setAttribute("transform", `translate(${q.x.toFixed(1)} ${q.y.toFixed(1)}) rotate(${(((total * at) / WHEEL_R) * 57.3).toFixed(1)})`);
    let k = 0;
    for (let i = 0; i < mk.length; i++) if (at >= mk[i] - 0.004) k = i;
    setActive((prev) => (prev === k ? prev : k));
  });

  const hold = (i: number) => { held.current = true; setActive(i); };
  const release = () => { held.current = false; };

  return (
    <div
      className="lp-scene"
      onPointerMove={(ev) => {
        if (reduce) return;
        const r = ev.currentTarget.getBoundingClientRect();
        rawX.set(0.5 - (ev.clientX - r.left) / r.width);
        rawY.set(0.5 - (ev.clientY - r.top) / r.height);
      }}
    >
      <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="none" role="img" aria-label="A tangled line unknots into a trail that climbs a mountain range to the sun, passing six stages. A wheel rolls up the trail.">
        <defs>
          <filter id="lp-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
        </defs>
        <Layer depth={4} px={px} py={py}>
          <m.circle className="lp-sun" cx={SUN.x} cy={SUN.y} r={SUN.r} initial={reduce ? false : { y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 2.2, delay: 0.2, ease: EASE }} />
        </Layer>
        {RIDGES.map((r, k) => (
          <Layer key={k} depth={r.depth} px={px} py={py}>
            <path d={ridges[k]} fill={r.fill} />
            {k === 1 && <ellipse className="lp-mist" cx={760} cy={470} rx={330} ry={26} filter="url(#lp-blur)" />}
            {k === 3 && <ellipse className="lp-mist lp-mist-b" cx={540} cy={585} rx={380} ry={24} filter="url(#lp-blur)" />}
          </Layer>
        ))}
        <rect x={-60} y={VIEW.h - 6} width={VIEW.w + 120} height={80} fill="var(--lp-band)" />
        <path d={foot} fill="var(--lp-band)" />
        <Layer depth={20} px={px} py={py}>
          <m.path ref={trail} className="lp-trail" d={d} initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3.2, delay: 0.5, ease: [0.5, 0, 0.2, 1] }} />
          {STAGES.map((s) => <circle key={s.key} className="lp-dot" cx={s.x} cy={s.y} r={7} />)}
          <g ref={walker} className="lp-walker" transform={`translate(${STAGES[0].x} ${STAGES[0].y})`}>
            <circle r={WHEEL_R + 5} className="lp-walker-disc" />
            <circle r={WHEEL_R - 3} />
            <circle r={3} />
            <path d="M3 0 L10 0 M-1.5 2.6 L-5 8.7 M-1.5 -2.6 L-5 -8.7" />
            <path d={Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return `M${(11.5 * Math.cos(a)).toFixed(1)} ${(11.5 * Math.sin(a)).toFixed(1)} L${(14 * Math.cos(a)).toFixed(1)} ${(14 * Math.sin(a)).toFixed(1)}`; }).join(" ")} />
          </g>
        </Layer>
      </svg>
      {STAGES.map((s, i) => (
        <div key={s.key} className={`lp-way-pos${active === i ? " lp-on" : ""}`} style={{ "--x": `${(s.x / VIEW.w) * 100}%`, "--y": `${(s.y / VIEW.h) * 100}%` } as CSSProperties}>
          <m.button
            type="button"
            className="lp-way"
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, scale: active === i ? 1.06 : 1 }}
            transition={{ opacity: { duration: 0.5, delay: 1.3 + i * 0.33 }, y: { duration: 0.5, delay: 1.3 + i * 0.33 }, scale: { duration: 0.25 } }}
            onMouseEnter={() => hold(i)}
            onFocus={() => hold(i)}
            onMouseLeave={release}
            onBlur={release}
            onClick={() => onStage(i)}
          >
            <strong>{s.name} <span className={`lp-tag${isUpcoming(s.status) ? " lp-tag-soon" : ""}`}>{s.status}</span></strong>
            <span className="lp-way-line">{s.line}</span>
          </m.button>
        </div>
      ))}
    </div>
  );
}
