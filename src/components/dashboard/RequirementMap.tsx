import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { plural, type CellState, type Posture } from "@/lib/overview";

const STATE_LABEL: Record<CellState, string> = { met: "Met", partial: "Partly met", gap: "Not met", open: "Unanswered", na: "Not applicable" };

/** One requirement. State is carried by fill and shape as well as colour. */
const CELL: Record<CellState, string> = {
  met: "bg-primary",
  partial: "border border-primary bg-[linear-gradient(135deg,hsl(var(--primary))_50%,transparent_50%)]",
  gap: "bg-[hsl(var(--coral))]",
  open: "border border-foreground/30",
  na: "bg-foreground/10 scale-[.45] rounded-full",
};

function Swatch({ state }: { state: CellState }) {
  return <span aria-hidden="true" className={cn("inline-block h-4 w-4 rounded-[4px] shrink-0", CELL[state])} />;
}

/** Every requirement in the assessment as one mark, a row per domain. Each row opens the assessment. */
export function RequirementMap({ posture, href }: { posture: Posture; href: string }) {
  const legend: [CellState, number][] = [["met", posture.met], ["partial", posture.partial], ["gap", posture.gap], ["open", posture.open], ["na", posture.na]];
  return (
    <div>
      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Requirements by state">
        {legend.filter(([s, n]) => n > 0 || s !== "na").map(([state, n]) => (
          <li key={state} className="flex items-center gap-2">
            <Swatch state={state} />
            <span className="font-semibold tabular-nums">{n}</span>
            <span className="text-muted-foreground">{STATE_LABEL[state].toLowerCase()}</span>
          </li>
        ))}
      </ul>

      <ul className="mt-5 border-t border-border">
        {posture.domains.map((d) => {
          const applies = d.na < d.cells.length;
          const note = !applies ? "Does not apply"
            : d.gap > 0 ? `${d.gap} not met`
            : d.partial > 0 ? `${d.partial} partly met`
            : d.open > 0 ? `${d.open} unanswered`
            : "All met";
          return (
            <li key={d.code} className="border-b border-border">
              <Link
                to={href}
                aria-label={`${d.name}: ${plural(d.met, "requirement")} met, ${d.partial} partly met, ${d.gap} not met, ${d.open} unanswered. Open the assessment.`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-2 py-2.5 -mx-2 rounded-md transition-colors hover:bg-card focus-visible:bg-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring md:grid-cols-[minmax(0,15rem)_1fr_7.5rem_5rem]"
              >
                <span className={cn("text-sm font-medium truncate", !applies && "text-muted-foreground")}>{d.name}</span>
                <span className="col-span-2 row-start-2 flex flex-wrap gap-1 md:col-span-1 md:row-start-auto" aria-hidden="true">
                  {d.cells.map((c) => (
                    <span key={c.id} title={`${STATE_LABEL[c.state]}: ${c.description}`} className={cn("h-4 w-4 rounded-[4px]", CELL[c.state])} />
                  ))}
                </span>
                <span className={cn("text-sm text-right tabular-nums md:text-left", d.gap > 0 && applies ? "text-foreground font-medium" : "text-muted-foreground")}>{note}</span>
                <span className="hidden text-sm text-muted-foreground text-right md:block" title={d.penalty ? "Maximum penalty for this area" : undefined}>{d.penalty}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
