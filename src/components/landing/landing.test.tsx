import { describe, it, expect, vi, beforeAll } from "vitest";
import { readFileSync } from "fs";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { STAGES, stageDestination, isUpcoming } from "./stages";
import { trailPath, ridgePath, RIDGES } from "./landscape";
import { clearBuildIntent, postSignInPath } from "@/lib/buildIntent";

let session: unknown = null;
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ session }) }));
vi.mock("@/integrations/supabase/client", () => {
  const query: Record<string, () => unknown> = { select: () => query, eq: () => query, order: () => Promise.resolve({ data: [{ code: "GDPR", label: "GDPR" }, { code: "NIS2", label: "NIS2" }] }) };
  return { supabase: { from: () => query } };
});

beforeAll(() => {
  class Observer { observe() {} unobserve() {} disconnect() {} }
  vi.stubGlobal("IntersectionObserver", Observer);
  vi.stubGlobal("ResizeObserver", Observer);
  vi.stubGlobal("scrollTo", vi.fn());
});

describe("stages", () => {
  it("lists the six stages in order", () => {
    expect(STAGES.map((s) => s.name)).toEqual(["Know", "Assess", "Build", "Execute", "Manage", "Improve"]);
  });
  it("only points at routes the app defines", () => {
    const app = readFileSync("src/App.tsx", "utf8");
    for (const s of STAGES) if (s.route) expect(app).toContain(`path="${s.route}"`);
  });
  it("sends open stages straight there and the rest through sign-in", () => {
    const [know, assess, , , manage] = STAGES;
    expect(stageDestination(know, false)).toBe("/learn");
    expect(stageDestination(assess, false)).toBe("/auth");
    expect(stageDestination(assess, true)).toBe("/assessments");
    expect(stageDestination(manage, true)).toBeNull();
  });
  it("gives stages that are not ready a note and no action", () => {
    for (const s of STAGES.filter((x) => isUpcoming(x.status))) {
      expect(s.action).toBeUndefined();
      expect(s.note).toBeTruthy();
    }
  });
});

describe("landscape", () => {
  it("draws one trail through every waypoint", () => {
    const d = trailPath(STAGES);
    expect(d.startsWith("M")).toBe(true);
    for (const s of STAGES) expect(d).toContain(`${s.x},${s.y}`);
  });
  it("closes each ridge", () => {
    for (const r of RIDGES) expect(ridgePath(r).endsWith("Z")).toBe(true);
  });
});

describe("LandingPage", () => {
  function Where() { return <p data-testid="where">{useLocation().pathname}</p>; }
  async function mount() {
    const { default: LandingPage } = await import("@/pages/LandingPage");
    return render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("shows the headline, every stage with its status, and live coverage", async () => {
    session = null;
    await mount();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("From complexity to confidence.");
    for (const s of STAGES) expect(screen.getByRole("heading", { level: 3, name: s.name })).toBeInTheDocument();
    expect(screen.getAllByText("In development").length).toBeGreaterThan(0);
    expect(await screen.findByRole("link", { name: "NIS2" })).toHaveAttribute("href", "/learn/framework/NIS2");
  });
  it("sends a signed-out visitor to sign-in from a gated stage", async () => {
    session = null;
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Draft a policy" }));
    expect(screen.getByTestId("where").textContent).toBe("/auth");
    expect(postSignInPath()).toBe("/policy-sop-builder");
    clearBuildIntent();
  });
  it("remembers a gated stage so sign-in lands there", async () => {
    session = null;
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "Plan implementation" }));
    expect(screen.getByTestId("where").textContent).toBe("/auth");
    expect(postSignInPath()).toBe("/execute");
    clearBuildIntent();
  });
  it("opens the Learn hub from Know without sign-in", async () => {
    session = null;
    await mount();
    fireEvent.click(screen.getAllByRole("button", { name: "Browse the regulations" })[0]);
    expect(screen.getByTestId("where").textContent).toBe("/learn");
  });
  it("sends a signed-in visitor to their assessments", async () => {
    session = { user: { id: "u" } };
    await mount();
    fireEvent.click(screen.getAllByRole("button", { name: "Start an assessment" })[0]);
    expect(screen.getByTestId("where").textContent).toBe("/assessments");
  });
});
