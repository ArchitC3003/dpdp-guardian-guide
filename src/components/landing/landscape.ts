/** Geometry for the hero scene: an ink-wash range drawn from layered sine ridges, and the trail that climbs it. */
export const VIEW = { w: 1200, h: 700 };
export const SUN = { x: 1062, y: 176, r: 66 };

const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export interface Ridge { base: number; amp: number; fill: string; depth: number; phase: number }
/** Far to near. Depth is how far a layer shifts with the pointer. */
export const RIDGES: Ridge[] = [
  { base: 452, amp: 300, fill: "var(--lp-w1)", depth: 6, phase: 1.1 },
  { base: 500, amp: 250, fill: "var(--lp-w2)", depth: 9, phase: 2.3 },
  { base: 548, amp: 196, fill: "var(--lp-w3)", depth: 13, phase: 3.9 },
  { base: 602, amp: 140, fill: "var(--lp-w4)", depth: 18, phase: 5.2 },
  { base: 660, amp: 84, fill: "var(--lp-w5)", depth: 24, phase: 0.7 },
];

/** A closed ridge silhouette. It stays low on the left, where the headline sits, and rises to the right. */
export function ridgePath({ base, amp, phase }: Ridge): string {
  const { w, h } = VIEW;
  let d = `M-60,${h + 60}`;
  for (let x = -60; x <= w + 60; x += 12) {
    const u = x / w;
    const env = 0.06 + 0.94 * smooth(0.22, 0.92, u);
    const n = 0.5 + 0.5 * (0.5 * Math.sin(u * 7.3 + phase) + 0.3 * Math.sin(u * 17.1 + phase * 2.7) + 0.2 * Math.sin(u * 39 + phase * 5.1));
    d += ` L${x},${(base - env * amp * (0.35 + 0.65 * n)).toFixed(1)}`;
  }
  return `${d} L${w + 60},${h + 60} Z`;
}

/** The nearest ridge, in the colour of the band below, so the range runs straight into the next section. */
export function footPath(): string {
  const { w, h } = VIEW;
  let d = `M-60,${h + 60}`;
  for (let x = -60; x <= w + 60; x += 12) {
    const u = x / w;
    d += ` L${x},${(676 - 26 * (0.5 + 0.5 * Math.sin(u * 9 + 2)) * (0.3 + 0.7 * smooth(0.1, 0.9, u))).toFixed(1)}`;
  }
  return `${d} L${w + 60},${h + 60} Z`;
}

/** One line: a tangle (complexity) that unknots into a smooth trail through the given waypoints and ends at the sun. */
export function trailPath(waypoints: { x: number; y: number }[]): string {
  const TAU = Math.PI * 2;
  const knot: [number, number][] = [];
  for (let i = 0; i <= 150; i++) {
    const a = i / 150;
    knot.push([548 + 64 * Math.sin(a * TAU * 3 + 0.5), 604 + 40 * Math.sin(a * TAU * 5)]);
  }
  let d = "M" + knot.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" L");
  const P: [number, number][] = [knot[knot.length - 2], knot[knot.length - 1], ...waypoints.map((s) => [s.x, s.y] as [number, number]), [SUN.x - 22, SUN.y + 38], [SUN.x, SUN.y]];
  for (let j = 1; j < P.length - 2; j++) {
    const [p0, p1, p2, p3] = [P[j - 1], P[j], P[j + 1], P[j + 2]];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}
