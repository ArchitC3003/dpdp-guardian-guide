import type { ExposureLevel, SunburstNode } from "@/types/execute";

export interface DonutSegment {
  node: SunburstNode;
  name: string;
  /** Short second line for the tooltip (micro-activities for a sub-sector petal). */
  subtitle?: string;
  count: number;
  share: number;
  /** 0.3–1 data-protection risk to the customer; drives petal length. */
  risk: number;
  exposure: ExposureLevel;
  color: string;
}

const RANK: Record<ExposureLevel, number> = { Low: 0, Medium: 1, High: 2 };
const WEIGHT: Record<ExposureLevel, number> = { Low: 0.3, Medium: 0.6, High: 1 };
// Base HSL per DPDP exposure band (cyber palette); shades vary per petal within a band.
export const BAND: Record<ExposureLevel, [number, number]> = { High: [350, 82], Medium: [36, 95], Low: [162, 72] };

function collectLeaves(n: SunburstNode, out: SunburstNode[] = []) {
  if (n.industry) out.push(n);
  (n.children ?? []).forEach((c) => collectLeaves(c, out));
  return out;
}

/** Mean exposure weight of a set of sub-sectors: 0.3 (all Low) … 1 (all High). */
export function riskScore(exposures: ExposureLevel[]): number {
  if (!exposures.length) return WEIGHT.Low;
  return exposures.reduce((s, e) => s + WEIGHT[e], 0) / exposures.length;
}

function colorize<T extends { exposure: ExposureLevel }>(raw: T[]): (T & { color: string })[] {
  const bandIdx: Record<ExposureLevel, number> = { Low: 0, Medium: 0, High: 0 };
  const bandSize: Record<ExposureLevel, number> = { Low: 0, Medium: 0, High: 0 };
  raw.forEach((r) => bandSize[r.exposure]++);
  return raw.map((r) => {
    const [h, s] = BAND[r.exposure];
    const i = bandIdx[r.exposure]++;
    const n = Math.max(bandSize[r.exposure] - 1, 1);
    const l = 42 + (i / n) * 22;
    return { ...r, color: `hsl(${h}, ${s}%, ${l.toFixed(0)}%)` };
  });
}

/** One petal per cluster. */
export function buildDonutSegments(tree: SunburstNode): DonutSegment[] {
  const raw = (tree.children ?? []).map((c) => {
    const leaves = collectLeaves(c);
    const exps = leaves.map((l) => l.industry!.DPDP_Exposure);
    const exposure = exps.reduce<ExposureLevel>((m, e) => (RANK[e] > RANK[m] ? e : m), "Low");
    return { node: c, name: c.name, count: leaves.length, exposure, risk: riskScore(exps) };
  });
  const total = raw.reduce((s, r) => s + r.count, 0) || 1;
  return colorize(raw).map((r) => ({ ...r, share: r.count / total }));
}

/** One petal per sub-sector inside a cluster (the drill-down bloom). */
export function buildLeafSegments(cluster: SunburstNode): DonutSegment[] {
  const leaves = collectLeaves(cluster);
  const raw = leaves.map((l) => {
    const ind = l.industry!;
    return {
      node: l,
      name: ind.Sub_Sector,
      subtitle: ind.Micro_Activity,
      count: 1,
      exposure: ind.DPDP_Exposure,
      risk: WEIGHT[ind.DPDP_Exposure],
    };
  });
  return colorize(raw).map((r) => ({ ...r, share: 1 / (leaves.length || 1) }));
}

/** Distinct hue per petal (jewel tones), cycled if more petals than hues. */
const PETAL_HUES = [168, 280, 350, 42, 192, 318, 145, 222, 12, 88, 262, 205, 335, 158, 28, 245];
export const petalColor = (i: number) => `hsl(${PETAL_HUES[i % PETAL_HUES.length]}, 82%, 58%)`;
