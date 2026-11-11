/** The six stages of the programme, in order. Positions are points on the hero trail (see landscape.ts). */
export type StageStatus = "Live" | "Beta" | "In development" | "Planned";
export type StageKey = "know" | "assess" | "build" | "execute" | "manage" | "improve";

export interface Stage {
  key: StageKey;
  name: string;
  status: StageStatus;
  /** One line shown on the hero trail. */
  line: string;
  /** One line shown in the journey band, where a single obligation is followed through. */
  story: string;
  /** Where the stage's action leads. Stages still being built have no action. */
  route?: string;
  /** True when the route needs no sign-in. */
  open?: boolean;
  action?: string;
  /** Shown in place of an action for stages that are not ready. */
  note?: string;
  x: number;
  y: number;
}

export const STAGES: Stage[] = [
  { key: "know", name: "Know", status: "Live", line: "Identify the obligations that apply to you.", story: "Establish what the requirement obliges you to do.", route: "/learn", open: true, action: "Browse the regulations", x: 660, y: 590 },
  { key: "assess", name: "Assess", status: "Live", line: "Run a gap assessment against each requirement.", story: "Assess your current state against it.", route: "/assessments", action: "Start an assessment", x: 738, y: 522 },
  { key: "build", name: "Build", status: "Live", line: "Draft the policies and procedures that close the gaps.", story: "Draft the procedure that closes the gap.", route: "/policy-sop-builder", action: "Draft a policy", x: 808, y: 462 },
  { key: "execute", name: "Execute", status: "Beta", line: "Assign control owners and collect evidence.", story: "Assign control owners and track evidence.", route: "/execute", action: "Plan implementation", x: 880, y: 392 },
  { key: "manage", name: "Manage", status: "In development", line: "Monitor compliance posture across the programme.", story: "Track the control from gap to compliant.", note: "In development. An early dashboard is available after sign-in.", x: 948, y: 322 },
  { key: "improve", name: "Improve", status: "Planned", line: "Turn findings into corrective actions.", story: "Carry findings into the next review cycle.", note: "Planned. Findings will carry forward as corrective actions.", x: 1004, y: 254 },
];

/** Stages that are not ready yet are drawn with a dashed tag. */
export const isUpcoming = (s: StageStatus) => s === "In development" || s === "Planned";

/** Where a stage's action sends a visitor: open stages go straight there, the rest go through sign-in first. */
export function stageDestination(stage: Stage, signedIn: boolean): string | null {
  if (!stage.route) return null;
  return stage.open || signedIn ? stage.route : "/auth";
}
