/** Every tool in the product, placed on the programme stage it belongs to, and the rules for what each shows on the dashboard. */
import type { StageKey } from "@/components/landing/stages";
import { plural, type PolicyCounts, type SlaCounts } from "@/lib/overview";

export type Role = "admin" | "moderator" | "user" | "auditor";
/** A stage of the programme, or the strip of administration and account tools that sits outside it. */
export type FeatureGroup = StageKey | "admin";

export interface Feature {
  key: string;
  group: FeatureGroup;
  name: string;
  /** One line, in plain words, on what the tool is for. */
  description: string;
  route: string;
  /** Roles that may open it; everyone when absent. A feature a role cannot open is still shown, locked. */
  roles?: Role[];
}

const SUPER: Role[] = ["admin"];
const PUBLISHERS: Role[] = ["admin", "moderator"];

export const FEATURES: Feature[] = [
  { key: "learn", group: "know", name: "Learn Hub", route: "/learn", description: "Read the regulations, standards and guides, and see which artefacts each one asks for." },
  { key: "studio", group: "know", name: "Content Studio", route: "/studio/content", description: "Write articles, guides and landing pages and publish them to Learn." },
  { key: "leads", group: "know", name: "Leads Inbox", route: "/studio/leads", roles: PUBLISHERS, description: "See who asked to be contacted from the public pages, with the consent they gave." },

  { key: "assessments", group: "assess", name: "Assessments", route: "/assessments", description: "Run a gap assessment against each requirement and see a readiness score." },
  { key: "templates", group: "assess", name: "Templates & Reference", route: "/repository", description: "Requirement templates and checklists to work from." },
  { key: "shared", group: "assess", name: "Shared Reports", route: "/shared", description: "Open an assessment report someone shared with you by code." },

  { key: "builder", group: "build", name: "Policy Builder", route: "/policy-sop-builder", description: "Draft a policy or procedure with the assistant, mapped to the frameworks you choose." },
  { key: "register", group: "build", name: "Policy Register", route: "/policy-library", description: "Keep every policy with its owner, version, status and review date." },
  { key: "documents", group: "build", name: "Organisation Documents", route: "/artefacts", description: "Store your organisation's documents and evidence in one library." },

  { key: "execute", group: "execute", name: "Programme Workspace", route: "/execute", description: "Plan implementation for your industry: what applies, who owns it, what evidence to collect." },

  { key: "consent", group: "manage", name: "Consent Ledger", route: "/consent/ledger", roles: SUPER, description: "Consent receipts and records for each data principal." },
  { key: "notices", group: "manage", name: "Notice Manager", route: "/consent/notices", roles: SUPER, description: "Write, translate and publish privacy notices." },
  { key: "rights", group: "manage", name: "Rights Desk", route: "/consent/rights-desk", roles: SUPER, description: "Handle access, correction and erasure requests within their deadlines." },
  { key: "grievances", group: "manage", name: "Grievances", route: "/consent/grievances", roles: SUPER, description: "Acknowledge and resolve complaints within their deadlines." },
  { key: "audit", group: "manage", name: "Audit Log", route: "/consent/audit-log", roles: SUPER, description: "A tamper-evident record of consent and request events." },

  { key: "frameworks", group: "admin", name: "Framework Manager", route: "/admin/frameworks", roles: SUPER, description: "Maintain the frameworks and requirements that assessments use." },
  { key: "assessment-templates", group: "admin", name: "Assessment Templates", route: "/admin/assessment-templates", roles: SUPER, description: "Bundle frameworks into templates for new assessments." },
  { key: "users", group: "admin", name: "User Management", route: "/settings/users", roles: SUPER, description: "Invite people and set their roles." },
  { key: "ai", group: "admin", name: "AI Configuration", route: "/admin/ai-config", roles: SUPER, description: "Manage the assistant's prompts, models and examples." },
  { key: "governance", group: "admin", name: "Governance Studio", route: "/studio/governance", roles: PUBLISHERS, description: "Draft and publish this site's own privacy policy and terms." },
  { key: "settings", group: "admin", name: "Account Settings", route: "/settings", description: "Your profile, appearance and account." },
  { key: "privacy", group: "admin", name: "Privacy Preferences", route: "/privacy-preferences", description: "Your own consent choices and data rights in this product." },
];

const ROLE_NAMES: Record<Role, string> = { admin: "Super Admin", moderator: "GRC Manager", user: "Reviewer", auditor: "Auditor" };

/** Something on a feature that is overdue or waiting. `urgent` is past a deadline or a critical gap. */
export interface Flag { text: string; urgent: boolean }
export interface FeatureView extends Feature {
  locked: boolean;
  /** Shown on a locked feature: the access that opens it. */
  needs?: string;
  flags: Flag[];
  resume?: { label: string; to: string };
}

/** What the dashboard knows about the workspace, already reduced to counts and last items. */
export interface WorkspaceFacts {
  /** Assessments visible to this person. */
  assessments: { id: string; name: string; status: string; mine: boolean; criticalGaps: number; answered: number }[];
  policies: PolicyCounts;
  lastPolicy: { id: string; name: string } | null;
  lastWorkspace: { id: string; name: string } | null;
  rights: SlaCounts | null;
  grievances: SlaCounts | null;
}

const slaFlags = (c: SlaCounts | null, one: string, many: string): Flag[] => !c ? [] : [
  ...(c.overdue ? [{ text: `${plural(c.overdue, one, many)} overdue`, urgent: true }] : []),
  ...(c.dueSoon ? [{ text: `${plural(c.dueSoon, one, many)} due within 7 days`, urgent: false }] : []),
];

/** Each feature as this person should see it: locked or open, with what needs attention and where to pick up. */
export function featureViews(role: Role, facts: WorkspaceFacts): FeatureView[] {
  const critical = facts.assessments.filter((a) => a.criticalGaps > 0);
  const criticalGaps = critical.reduce((n, a) => n + a.criticalGaps, 0);
  const unfinished = facts.assessments.find((a) => a.mine && a.status !== "Completed");

  const flags: Record<string, Flag[]> = {
    assessments: criticalGaps ? [{
      text: critical.length === 1
        ? `${plural(criticalGaps, "critical gap")} in ${critical[0].name}`
        : `${plural(criticalGaps, "critical gap")} across ${critical.length} organisations`,
      urgent: true,
    }] : [],
    register: [
      ...(facts.policies.reviewOverdue ? [{ text: `${plural(facts.policies.reviewOverdue, "policy", "policies")} past the review date`, urgent: true }] : []),
      ...(facts.policies.inReview ? [{ text: `${plural(facts.policies.inReview, "policy", "policies")} waiting in review`, urgent: false }] : []),
    ],
    rights: slaFlags(facts.rights, "request", "requests"),
    grievances: slaFlags(facts.grievances, "grievance", "grievances"),
  };
  const resume: Record<string, FeatureView["resume"]> = {
    assessments: unfinished && { label: `Resume ${unfinished.name}`, to: `/assessment/${unfinished.id}/rapid-assessment` },
    register: facts.lastPolicy ? { label: `Last edited: ${facts.lastPolicy.name}`, to: `/policy-library?doc=${facts.lastPolicy.id}` } : undefined,
    execute: facts.lastWorkspace ? { label: `Resume ${facts.lastWorkspace.name}`, to: `/execute/workspace/${facts.lastWorkspace.id}` } : undefined,
  };

  return FEATURES.map((f) => {
    const locked = !!f.roles && !f.roles.includes(role);
    return {
      ...f,
      locked,
      needs: locked ? `Needs ${f.roles!.map((r) => ROLE_NAMES[r]).join(" or ")} access` : undefined,
      flags: locked ? [] : flags[f.key] ?? [],
      resume: locked ? undefined : resume[f.key] || undefined,
    };
  });
}

/** The furthest stage that has work in it; the wheel rests there. */
export function stageReached(facts: WorkspaceFacts): StageKey {
  return facts.lastWorkspace ? "execute" : facts.policies.total ? "build" : facts.assessments.length ? "assess" : "know";
}

/** Assessments for the organisations list: lowest readiness first, those not started last. */
export function worstFirst<T extends { posture: { score: number | null } }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => (a.posture.score ?? 101) - (b.posture.score ?? 101));
}
