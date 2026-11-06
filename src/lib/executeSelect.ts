import { PRIVCYBHUB_INDUSTRIES, getIndustryById } from "@/data/privcybhubIndustries";
import type { ExecuteIndustry, ExposureLevel, SunburstNode } from "@/types/execute";

const RANK: Record<ExposureLevel, number> = { Low: 0, Medium: 1, High: 2 };

export interface NodeSummary {
  total: number;
  exposure: ExposureLevel;
  exposureCounts: Record<ExposureLevel, number>;
  gdprHeightened: number;
  ccpaApplies: number;
  hipaaInScope: number;
  regulators: string[];
}

/** Roll up the crosswalk of every sub-sector under a cluster / group node for the hover preview. */
export function summarizeNode(node: SunburstNode): NodeSummary {
  const leaves = (node.leafIds ?? [])
    .map(getIndustryById)
    .filter((x): x is ExecuteIndustry => !!x);
  const exposureCounts: Record<ExposureLevel, number> = { High: 0, Medium: 0, Low: 0 };
  const regulators = new Set<string>();
  let exposure: ExposureLevel = "Low";
  let gdprHeightened = 0;
  let ccpaApplies = 0;
  let hipaaInScope = 0;
  for (const l of leaves) {
    exposureCounts[l.DPDP_Exposure]++;
    if (RANK[l.DPDP_Exposure] > RANK[exposure]) exposure = l.DPDP_Exposure;
    if (l.GDPR_Applicability !== "Universal") gdprHeightened++;
    if (l.CCPA_Applicability === "Applies") ccpaApplies++;
    if (l.HIPAA_Applicability !== "Out of Scope") hipaaInScope++;
    l.Sectoral_Regulator.split(";").map((r) => r.trim()).filter(Boolean).forEach((r) => regulators.add(r));
  }
  return {
    total: leaves.length,
    exposure,
    exposureCounts,
    gdprHeightened,
    ccpaApplies,
    hipaaInScope,
    regulators: Array.from(regulators),
  };
}

/**
 * Find sub-sectors for a free-text query. Every word must appear somewhere in the
 * sub-sector's names, activities or regulator; name hits rank above activity hits.
 */
export function searchIndustries(query: string, limit = 8): ExecuteIndustry[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored: { ind: ExecuteIndustry; score: number }[] = [];
  for (const ind of PRIVCYBHUB_INDUSTRIES) {
    const fields: [string, number][] = [
      [ind.Sub_Sector, 5],
      [ind.Sector_Group, 3],
      [ind.Cluster, 2],
      [ind.Micro_Activity, 2],
      [ind.Sectoral_Regulator, 1],
    ];
    let score = 0;
    let all = true;
    for (const w of words) {
      let best = 0;
      for (const [text, weight] of fields) {
        const t = text.toLowerCase();
        const at = t.indexOf(w);
        if (at === -1) continue;
        const wordStart = at === 0 || /[^a-z0-9]/.test(t[at - 1]);
        best = Math.max(best, weight * (wordStart ? 2 : 1));
      }
      if (!best) { all = false; break; }
      score += best;
    }
    if (all) scored.push({ ind, score });
  }
  return scored
    .sort((a, b) => b.score - a.score || a.ind.PrivCybHub_Sector_ID.localeCompare(b.ind.PrivCybHub_Sector_ID))
    .slice(0, limit)
    .map((s) => s.ind);
}
