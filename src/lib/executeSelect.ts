import {
  PRIVCYBHUB_INDUSTRIES,
  getIndustryById,
  computeTriggeredFlags,
  computeCrosswalk,
} from "@/data/privcybhubIndustries";
import type { ExecuteIndustry, ExposureLevel, SunburstNode, TriggeredFlags } from "@/types/execute";

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

export type LawStatus = "Applies" | "Likely" | "Check in step 2" | "Not indicated";

export interface SelectionImpact {
  count: number;
  /** Highest DPDP exposure among the picks; null when nothing is picked. */
  exposure: ExposureLevel | null;
  exposureCounts: Record<ExposureLevel, number>;
  /** Indicative 0–100 index: mean exposure of the picks (all Low = 0, all High = 100). */
  index: number;
  flags: Omit<TriggeredFlags, "cross_border" | "sectoral_overlay">;
  laws: { name: string; status: LawStatus; why: string }[];
  regulators: string[];
}

const WEIGHT: Record<ExposureLevel, number> = { Low: 0, Medium: 0.5, High: 1 };

/**
 * What the current picks mean before the organisation profile is filled in.
 * Uses the same rules as the workspace (computeTriggeredFlags / computeCrosswalk);
 * anything that depends on footprint is reported as "Check in step 2".
 */
export function computeImpact(selectedIds: string[]): SelectionImpact {
  const picks = selectedIds.map(getIndustryById).filter((x): x is ExecuteIndustry => !!x);
  const exposureCounts: Record<ExposureLevel, number> = { High: 0, Medium: 0, Low: 0 };
  let exposure: ExposureLevel | null = null;
  const regulators = new Set<string>();
  for (const p of picks) {
    exposureCounts[p.DPDP_Exposure]++;
    if (!exposure || RANK[p.DPDP_Exposure] > RANK[exposure]) exposure = p.DPDP_Exposure;
    p.Sectoral_Regulator.split(";").map((r) => r.trim()).filter(Boolean).forEach((r) => regulators.add(r));
  }
  const index = picks.length
    ? Math.round((picks.reduce((s, p) => s + WEIGHT[p.DPDP_Exposure], 0) / picks.length) * 100)
    : 0;
  const { sdf_likelihood, children_data, health_data, financial_data } = computeTriggeredFlags(selectedIds, []);
  const cw = computeCrosswalk(selectedIds, []);
  const ccpaSector = picks.some((p) => p.CCPA_Applicability === "Applies");
  const gdprHeightened = picks.some((p) => p.GDPR_Applicability !== "Universal");

  const laws: SelectionImpact["laws"] = picks.length
    ? [
        { name: "DPDP Act 2023", status: "Applies", why: "Digital personal data of individuals in India." },
        {
          name: "GDPR",
          status: gdprHeightened ? "Likely" : "Check in step 2",
          why: gdprHeightened
            ? "Picked sectors carry heightened or sector-triggered GDPR exposure."
            : "Applies if you offer goods/services to, or monitor, people in the EU.",
        },
        {
          name: "CCPA / CPRA",
          status: ccpaSector ? "Check in step 2" : "Not indicated",
          why: ccpaSector ? "Picked sectors are CCPA-relevant; depends on a California footprint." : "No CCPA-relevant sectors picked.",
        },
        {
          name: "HIPAA",
          status: cw.hipaa.status === "Out of Scope" ? "Not indicated" : "Likely",
          why: cw.hipaa.rationale,
        },
      ]
    : [];

  return {
    count: picks.length,
    exposure,
    exposureCounts,
    index,
    flags: { sdf_likelihood, children_data, health_data, financial_data },
    laws,
    regulators: Array.from(regulators),
  };
}
