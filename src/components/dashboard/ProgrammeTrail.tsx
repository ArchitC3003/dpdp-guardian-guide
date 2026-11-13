import { Link } from "react-router-dom";
import { WheelMark } from "@/components/BrandLogo";
import { STAGES, isUpcoming, type StageKey } from "@/components/landing/stages";
import { cn } from "@/lib/utils";
import { plural, type PolicyCounts } from "@/lib/overview";

interface Props { assessments: number; inProgress: number; policies: PolicyCounts; workspaces: number }

/** The six programme stages with what this workspace holds in each. The wheel rests on the furthest stage that has work in it. */
export function ProgrammeTrail({ assessments, inProgress, policies, workspaces }: Props) {
  const yours: Record<StageKey, string> = {
    know: "Regulations, standards and guides, open to read.",
    assess: assessments ? `${plural(assessments, "assessment")}, ${inProgress} in progress.` : "No assessment yet.",
    build: policies.total
      ? `${plural(policies.total, "document")}: ${policies.published} approved or published, ${policies.inReview} in review, ${policies.draft} in draft.`
      : "No policies drafted yet.",
    execute: workspaces ? `${plural(workspaces, "programme workspace")}.` : "No programme workspace yet.",
    manage: "This overview is the early version.",
    improve: "Findings will carry forward as corrective actions.",
  };
  const reached: StageKey = workspaces ? "execute" : policies.total ? "build" : assessments ? "assess" : "know";

  return (
    <ol className="relative">
      <span aria-hidden="true" className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />
      {STAGES.map((s) => {
        const upcoming = isUpcoming(s.status);
        const here = s.key === reached;
        return (
          <li key={s.key} className="relative flex gap-4 pb-5 last:pb-0">
            <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center bg-background">
              {here ? <WheelMark size={24} color="hsl(var(--primary))" /> : (
                <span className={cn("h-2.5 w-2.5 rounded-full border-2", upcoming ? "border-dashed border-muted-foreground/60" : "border-primary bg-primary")} />
              )}
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 leading-6">
                <span className={cn("font-semibold", upcoming && "text-muted-foreground")}>{s.name}</span>
                {s.status !== "Live" && (
                  <span className={cn("rounded-full border px-2 text-xs leading-5 text-muted-foreground", upcoming && "border-dashed")}>{s.status}</span>
                )}
                {here && <span className="sr-only">(furthest stage with work in it)</span>}
              </p>
              <p className="text-sm text-muted-foreground">{yours[s.key]}</p>
              {s.route && s.action && (
                <Link to={s.route} className="mt-1 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:underline">
                  {s.action}
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
