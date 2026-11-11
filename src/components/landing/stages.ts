/** The six stages of the programme, in order. Positions are points on the hero trail (see landscape.ts). */
export type StageStatus = "Live" | "Beta" | "In build" | "Planned";
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
  { key: "know", name: "Know", status: "Live", line: "See what a regulation asks of you.", story: "See what a regulation asks of you, in plain language.", route: "/learn", open: true, action: "Browse the regulations", x: 660, y: 590 },
  { key: "assess", name: "Assess", status: "Live", line: "Check where you stand against it.", story: "Check whether you already do it.", route: "/assessments", action: "Start an assessment", x: 738, y: 522 },
  { key: "build", name: "Build", status: "Live", line: "Draft the documents that close the gaps.", story: "Draft the document that closes the gap.", route: "/policy-sop-builder", action: "Build a document", x: 808, y: 462 },
  { key: "execute", name: "Execute", status: "Beta", line: "Give every action an owner.", story: "Give the work an owner.", route: "/execute", action: "Plan your rollout", x: 880, y: 392 },
  { key: "manage", name: "Manage", status: "In build", line: "Keep the whole programme in view.", story: "Watch it move from gap to met.", note: "We are building this now. An early dashboard is available after sign-in.", x: 948, y: 322 },
  { key: "improve", name: "Improve", status: "Planned", line: "Feed findings into the next round.", story: "Feed what you found into the next round.", note: "Planned. Findings will become the next round's actions.", x: 1004, y: 254 },
];

/** Stages that are not ready yet are drawn with a dashed tag. */
export const isUpcoming = (s: StageStatus) => s === "In build" || s === "Planned";

/** Where a stage's action sends a visitor: open stages go straight there, the rest go through sign-in first. */
export function stageDestination(stage: Stage, signedIn: boolean): string | null {
  if (!stage.route) return null;
  return stage.open || signedIn ? stage.route : "/auth";
}
