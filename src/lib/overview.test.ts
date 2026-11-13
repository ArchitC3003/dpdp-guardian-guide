import { describe, expect, it } from "vitest";
import {
  GRIEVANCE_CLOSED, LEGACY_DOMAINS, RIGHTS_CLOSED, bandFor, grievanceDeadline, plural, policyCounts, slaCounts, summarise,
  type CheckLite, type OverviewDomain,
} from "./overview";

const check = (check_id: string, status: string | null, extra: Partial<CheckLite> = {}): CheckLite =>
  ({ check_id, status, priority: null, evidence_status: null, ...extra });

const domains: OverviewDomain[] = [
  { code: "A", name: "Notice", penalty: "₹50 Cr", items: [
    { id: "A1", description: "Notice is given", risk: "critical" },
    { id: "A2", description: "Notice is itemised", risk: "standard" },
    { id: "A3", description: "SDF notice", risk: "high", sdfOnly: true },
  ] },
  { code: "I", name: "Children", conditional: "children", items: [{ id: "I1", description: "Parental consent", risk: "critical" }] },
];

describe("summarise", () => {
  it("has no score until a requirement is answered", () => {
    const p = summarise(domains, []);
    expect(p.score).toBeNull();
    expect(p.answered).toBe(0);
    expect(p.open).toBe(2);
    expect(bandFor(p.score)).toBe("Not started");
  });

  it("weights the score by risk, as the assessment results do", () => {
    // critical ×3 not met, standard ×1 met → 1 of 4
    const p = summarise(domains, [check("A1", "No"), check("A2", "Yes")]);
    expect(p.score).toBe(25);
    expect(p).toMatchObject({ met: 1, gap: 1, partial: 0, open: 0, criticalGaps: 1 });
  });

  it("counts a partial answer as half", () => {
    expect(summarise(domains, [check("A1", "Partial")]).score).toBe(50);
  });

  it("leaves out what does not apply: N/A answers, SDF-only items and conditional domains", () => {
    const p = summarise(domains, [check("A1", "N/A"), check("A3", "No"), check("I1", "No")]);
    expect(p.na).toBe(3);
    expect(p.applicable).toBe(1);
    expect(p.gap).toBe(0);
    expect(p.score).toBeNull();
  });

  it("brings SDF-only items and conditional domains in when the flags are set", () => {
    const p = summarise(domains, [check("A3", "No"), check("I1", "Yes")], { sdf: true, children: true });
    expect(p.applicable).toBe(4);
    expect(p).toMatchObject({ gap: 1, met: 1, open: 2 });
  });

  it("orders gaps by priority, then risk, then not met before partly met", () => {
    const d: OverviewDomain[] = [{ code: "X", name: "X", items: [
      { id: "s", description: "", risk: "standard" },
      { id: "c-partial", description: "", risk: "critical" },
      { id: "c-gap", description: "", risk: "critical" },
      { id: "h", description: "", risk: "high" },
      { id: "ok", description: "", risk: "critical" },
    ] }];
    const p = summarise(d, [
      check("s", "No", { priority: "P1–Immediate" }), check("c-partial", "Partial"), check("c-gap", "No"),
      check("h", "No", { priority: "P2–30 Days" }), check("ok", "Yes"),
    ]);
    expect(p.topGaps.map((g) => g.id)).toEqual(["s", "h", "c-gap", "c-partial"]);
    expect(summarise(d, [check("s", "No"), check("h", "No")], {}, 1).topGaps).toHaveLength(1);
  });

  it("counts answers whose evidence has not been verified", () => {
    const p = summarise(domains, [check("A1", "Yes", { evidence_status: "Verified–Seen" }), check("A2", "Yes", { evidence_status: "Stated–Not Verified" })]);
    expect(p.unverified).toBe(1);
  });

  it("covers every built-in requirement exactly once", () => {
    const ids = LEGACY_DOMAINS.flatMap((d) => d.items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
    const p = summarise(LEGACY_DOMAINS, ids.map((id) => check(id, "Yes")), { sdf: true, children: true, consentMgr: true });
    expect(p.score).toBe(100);
    expect(p.met).toBe(ids.length);
    expect(bandFor(p.score)).toBe("Compliant");
  });
});

describe("bandFor", () => {
  it("uses the same steps as the assessment results", () => {
    expect([0, 24, 25, 49, 50, 69, 70, 84, 85].map(bandFor)).toEqual([
      "Critical exposure", "Critical exposure", "Major non-compliance", "Major non-compliance",
      "Partial gaps", "Partial gaps", "Substantially ready", "Substantially ready", "Compliant",
    ]);
  });
});

describe("slaCounts", () => {
  const now = new Date("2026-11-13T12:00:00Z");
  it("separates overdue from due soon and ignores closed requests", () => {
    const rows = [
      { status: "Submitted", deadline: "2026-11-10T00:00:00Z" },
      { status: "In Progress", deadline: "2026-11-15T00:00:00Z" },
      { status: "In Progress", deadline: "2026-12-30T00:00:00Z" },
      { status: "Completed", deadline: "2026-11-01T00:00:00Z" },
      { status: "Rejected", deadline: "2026-11-01T00:00:00Z" },
    ];
    expect(slaCounts(rows, RIGHTS_CLOSED, now)).toEqual({ open: 3, overdue: 1, dueSoon: 1 });
  });

  it("measures a grievance against acknowledgement first, then resolution", () => {
    const g = { sla_deadline_ack: "2026-11-12T00:00:00Z", sla_deadline_resolution: "2026-12-12T00:00:00Z" };
    expect(grievanceDeadline({ ...g, status: "Submitted" })).toBe(g.sla_deadline_ack);
    expect(grievanceDeadline({ ...g, status: "Acknowledged" })).toBe(g.sla_deadline_resolution);
    expect(slaCounts([{ status: "Resolved", deadline: g.sla_deadline_ack }], GRIEVANCE_CLOSED, now).open).toBe(0);
  });
});

describe("policyCounts", () => {
  it("groups by status and flags reviews that are past due", () => {
    const c = policyCounts([
      { status: "Published", review_date: "2026-01-01" },
      { status: "Approved", review_date: "2027-01-01" },
      { status: "Under Review", review_date: null },
      { status: "Draft", review_date: null },
      { status: "Retired", review_date: "2020-01-01" },
    ], new Date("2026-11-13T12:00:00Z"));
    expect(c).toEqual({ total: 5, published: 2, inReview: 1, draft: 1, reviewOverdue: 1 });
  });
});

describe("plural", () => {
  it("picks the right form", () => {
    expect([plural(1, "policy", "policies"), plural(2, "policy", "policies"), plural(0, "answer")]).toEqual(["1 policy", "2 policies", "0 answers"]);
  });
});
