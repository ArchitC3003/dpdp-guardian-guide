/** Pure rules behind the signed-in overview: how an assessment's answers become a posture, and what needs attention first. */
import { DOMAINS, getRiskMultiplier, getStatusPct } from "@/data/assessmentDomains";

export type Risk = "critical" | "high" | "standard";
/** Where one requirement stands. `open` has no answer yet; `na` does not apply to this organisation. */
export type CellState = "met" | "partial" | "gap" | "open" | "na";

export interface OverviewItem { id: string; description: string; risk: Risk; sdfOnly?: boolean }
export interface OverviewDomain { code: string; name: string; penalty?: string; conditional?: string; items: OverviewItem[] }
export interface CheckLite { check_id: string; status: string | null; priority: string | null; evidence_status: string | null }
export interface SpecialFlags { sdf?: boolean; children?: boolean; consentMgr?: boolean }

export interface Cell { id: string; description: string; risk: Risk; state: CellState; priority: string | null; domainCode: string; domainName: string }
export interface DomainPosture { code: string; name: string; penalty?: string; cells: Cell[]; met: number; partial: number; gap: number; open: number; na: number }
export interface Posture {
  domains: DomainPosture[];
  met: number; partial: number; gap: number; open: number; na: number;
  /** Requirements that apply to this organisation, answered or not. */
  applicable: number;
  answered: number;
  /** Risk-weighted readiness over answered requirements, 0 to 100; null until something is answered. */
  score: number | null;
  criticalGaps: number;
  unverified: number;
  topGaps: Cell[];
}

/** Domains a pure data processor does not answer (notice, consent, rights, children). Mirrors the assessment screen. */
export const PROCESSOR_HIDDEN_CODES = new Set(["A", "B", "H", "I"]);

/** The built-in DPDP requirement set, used by assessments that have no framework attached. */
export const LEGACY_DOMAINS: OverviewDomain[] = DOMAINS.map((d) => ({
  code: d.code, name: d.name, penalty: d.penalty, conditional: d.conditional,
  items: d.items.map((i) => ({ id: i.id, description: i.description, risk: i.risk, sdfOnly: d.sdfOnly?.includes(i.id) })),
}));

const domainApplies = (d: OverviewDomain, flags: SpecialFlags) =>
  d.conditional === "children" ? !!flags.children : d.conditional === "consentMgr" ? !!flags.consentMgr : true;

const stateOf = (status: string | null | undefined): CellState => {
  const pct = getStatusPct(status ?? null);
  if (pct === 100) return "met";
  if (pct === 50) return "partial";
  if (pct === 0) return "gap";
  return status === "N/A" ? "na" : "open";
};

const priorityRank = (p: string | null) => { const m = p?.match(/^P(\d)/); return m ? Number(m[1]) : 9; };
const RISK_RANK: Record<Risk, number> = { critical: 0, high: 1, standard: 2 };

/** Turn one assessment's answers into a posture. Scoring matches the assessment's own results page. */
export function summarise(domains: OverviewDomain[], checks: CheckLite[], flags: SpecialFlags = {}, topN = 5): Posture {
  const byId = new Map(checks.map((c) => [c.check_id, c]));
  let weight = 0, weighted = 0, unverified = 0;

  const out: DomainPosture[] = domains.map((d) => {
    const applies = domainApplies(d, flags);
    const cells: Cell[] = d.items.map((item) => {
      const check = byId.get(item.id);
      const state: CellState = !applies || (item.sdfOnly && !flags.sdf) ? "na" : stateOf(check?.status);
      if (state === "met" || state === "partial" || state === "gap") {
        const mult = getRiskMultiplier(item.risk);
        weight += mult;
        weighted += mult * (state === "met" ? 1 : state === "partial" ? 0.5 : 0);
        if (check?.evidence_status !== "Verified–Seen") unverified++;
      }
      return { id: item.id, description: item.description, risk: item.risk, state, priority: check?.priority ?? null, domainCode: d.code, domainName: d.name };
    });
    const count = (s: CellState) => cells.filter((c) => c.state === s).length;
    return { code: d.code, name: d.name, penalty: d.penalty, cells, met: count("met"), partial: count("partial"), gap: count("gap"), open: count("open"), na: count("na") };
  });

  const sum = (k: "met" | "partial" | "gap" | "open" | "na") => out.reduce((n, d) => n + d[k], 0);
  const met = sum("met"), partial = sum("partial"), gap = sum("gap"), open = sum("open"), na = sum("na");
  const all = out.flatMap((d) => d.cells);
  const topGaps = all
    .filter((c) => c.state === "gap" || c.state === "partial")
    .sort((a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      RISK_RANK[a.risk] - RISK_RANK[b.risk] ||
      (a.state === b.state ? 0 : a.state === "gap" ? -1 : 1))
    .slice(0, topN);

  return {
    domains: out, met, partial, gap, open, na,
    applicable: met + partial + gap + open,
    answered: met + partial + gap,
    score: weight > 0 ? Math.round((weighted / weight) * 100) : null,
    criticalGaps: all.filter((c) => c.state === "gap" && c.risk === "critical").length,
    unverified,
    topGaps,
  };
}

/** The readiness band for a score, in the same steps the assessment results use. */
export function bandFor(score: number | null): string {
  if (score === null) return "Not started";
  if (score >= 85) return "Compliant";
  if (score >= 70) return "Substantially ready";
  if (score >= 50) return "Partial gaps";
  if (score >= 25) return "Major non-compliance";
  return "Critical exposure";
}

export interface SlaRow { status: string; deadline: string }
export interface SlaCounts { open: number; overdue: number; dueSoon: number }

/** Count open requests, those past their deadline, and those due within `soonDays`. */
export function slaCounts(rows: SlaRow[], closed: string[], now = new Date(), soonDays = 7): SlaCounts {
  const t = now.getTime(), soon = t + soonDays * 86_400_000;
  const open = rows.filter((r) => !closed.includes(r.status));
  const overdue = open.filter((r) => new Date(r.deadline).getTime() < t).length;
  const dueSoon = open.filter((r) => { const d = new Date(r.deadline).getTime(); return d >= t && d <= soon; }).length;
  return { open: open.length, overdue, dueSoon };
}

export const RIGHTS_CLOSED = ["Completed", "Rejected"];
export const GRIEVANCE_CLOSED = ["Resolved", "Escalated to DPB"];
/** A grievance is first due an acknowledgement, then a resolution. */
export const grievanceDeadline = (g: { status: string; sla_deadline_ack: string; sla_deadline_resolution: string }) =>
  g.status === "Submitted" ? g.sla_deadline_ack : g.sla_deadline_resolution;

export interface PolicyLite { status: string; review_date: string | null }
export interface PolicyCounts { total: number; published: number; inReview: number; draft: number; reviewOverdue: number }

export function policyCounts(rows: PolicyLite[], now = new Date()): PolicyCounts {
  const today = now.toISOString().slice(0, 10);
  const is = (s: string) => rows.filter((r) => r.status === s).length;
  return {
    total: rows.length,
    published: is("Published") + is("Approved"),
    inReview: is("Under Review"),
    draft: is("Draft"),
    reviewOverdue: rows.filter((r) => r.status !== "Retired" && !!r.review_date && r.review_date.slice(0, 10) < today).length,
  };
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
