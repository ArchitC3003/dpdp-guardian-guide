import { describe, expect, it } from "vitest";
import { FEATURES, featureViews, stageReached, worstFirst, type WorkspaceFacts } from "./workspaceFeatures";
import { STAGES } from "@/components/landing/stages";
import { readFileSync } from "node:fs";

const source = (path: string) => readFileSync(path, "utf8");

const none = { open: 0, overdue: 0, dueSoon: 0 };
const empty: WorkspaceFacts = {
  assessments: [], policies: { total: 0, published: 0, inReview: 0, draft: 0, reviewOverdue: 0 },
  lastPolicy: null, lastWorkspace: null, rights: null, grievances: null,
};
const view = (role: Parameters<typeof featureViews>[0], facts: WorkspaceFacts, key: string) => featureViews(role, facts).find((f) => f.key === key)!;

describe("the feature list", () => {
  it("has unique keys and places every feature on a real stage or in administration", () => {
    expect(new Set(FEATURES.map((f) => f.key)).size).toBe(FEATURES.length);
    const groups = new Set<string>([...STAGES.map((s) => s.key), "admin"]);
    expect(FEATURES.every((f) => groups.has(f.group))).toBe(true);
  });

  it("links only to pages that exist, and covers every page the sidebar offers", () => {
    const app = source("src/App.tsx");
    const routes = FEATURES.map((f) => f.route);
    expect(routes.filter((r) => !app.includes(`path="${r}"`))).toEqual([]);
    const sidebar = [...source("src/components/AppSidebar.tsx").matchAll(/url: "(\/[^"]+)"/g)].map((m) => m[1]);
    expect(sidebar.length).toBeGreaterThan(10);
    expect(sidebar.filter((u) => u !== "/dashboard" && !routes.includes(u))).toEqual([]);
  });

  it("gives every stage that is ready at least one feature", () => {
    for (const s of STAGES.filter((x) => x.route)) expect(FEATURES.some((f) => f.group === s.key)).toBe(true);
  });
});

describe("featureViews", () => {
  it("shows every feature to every role, locking what the role cannot open", () => {
    for (const role of ["admin", "moderator", "user", "auditor"] as const) expect(featureViews(role, empty)).toHaveLength(FEATURES.length);
    expect(featureViews("admin", empty).some((f) => f.locked)).toBe(false);
    expect(view("user", empty, "rights")).toMatchObject({ locked: true, needs: "Needs Super Admin access" });
    expect(view("moderator", empty, "leads").locked).toBe(false);
    expect(view("auditor", empty, "leads").needs).toBe("Needs Super Admin or GRC Manager access");
    expect(view("auditor", empty, "assessments").locked).toBe(false);
  });

  it("flags critical gaps, naming the organisation when there is only one", () => {
    const a = { id: "1", name: "Acme", status: "In Progress", mine: true, criticalGaps: 2, answered: 5 };
    expect(view("user", { ...empty, assessments: [a] }, "assessments").flags).toEqual([{ text: "2 critical gaps in Acme", urgent: true }]);
    const b = { ...a, id: "2", name: "Beta", criticalGaps: 1 };
    expect(view("user", { ...empty, assessments: [a, b] }, "assessments").flags[0].text).toBe("3 critical gaps across 2 organisations");
  });

  it("resumes the person's own latest unfinished assessment, not someone else's", () => {
    const rows = [
      { id: "1", name: "Theirs", status: "In Progress", mine: false, criticalGaps: 0, answered: 0 },
      { id: "2", name: "Done", status: "Completed", mine: true, criticalGaps: 0, answered: 9 },
      { id: "3", name: "Mine", status: "Draft", mine: true, criticalGaps: 0, answered: 0 },
    ];
    expect(view("user", { ...empty, assessments: rows }, "assessments").resume).toEqual({ label: "Resume Mine", to: "/assessment/3/rapid-assessment" });
    expect(view("user", { ...empty, assessments: rows.slice(0, 2) }, "assessments").resume).toBeUndefined();
  });

  it("flags policy reviews and deadlines, and keeps flags off locked features", () => {
    const facts: WorkspaceFacts = {
      ...empty,
      policies: { total: 3, published: 1, inReview: 1, draft: 1, reviewOverdue: 1 },
      lastPolicy: { id: "p", name: "Retention Policy" },
      lastWorkspace: { id: "w", name: "Acme" },
      rights: { open: 3, overdue: 1, dueSoon: 2 },
      grievances: none,
    };
    expect(view("admin", facts, "register").flags.map((f) => f.text)).toEqual(["1 policy past the review date", "1 policy waiting in review"]);
    expect(view("admin", facts, "register").resume?.label).toBe("Last edited: Retention Policy");
    expect(view("admin", facts, "execute").resume?.to).toBe("/execute/workspace/w");
    expect(view("admin", facts, "rights").flags).toEqual([{ text: "1 request overdue", urgent: true }, { text: "2 requests due within 7 days", urgent: false }]);
    expect(view("admin", facts, "grievances").flags).toEqual([]);
    expect(view("user", facts, "rights").flags).toEqual([]);
  });
});

describe("stageReached", () => {
  it("is the furthest stage with work in it", () => {
    const a = { id: "1", name: "A", status: "Draft", mine: true, criticalGaps: 0, answered: 0 };
    expect(stageReached(empty)).toBe("know");
    expect(stageReached({ ...empty, assessments: [a] })).toBe("assess");
    expect(stageReached({ ...empty, assessments: [a], policies: { ...empty.policies, total: 1 } })).toBe("build");
    expect(stageReached({ ...empty, lastWorkspace: { id: "w", name: "A" } })).toBe("execute");
  });
});

describe("worstFirst", () => {
  it("puts the lowest readiness first and not-started last", () => {
    const rows = [{ posture: { score: 80 } }, { posture: { score: null } }, { posture: { score: 20 } }];
    expect(worstFirst(rows).map((r) => r.posture.score)).toEqual([20, 80, null]);
  });
});
