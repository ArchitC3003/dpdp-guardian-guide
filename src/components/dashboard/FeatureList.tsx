import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeatureView } from "@/lib/workspaceFeatures";

const linkClass = "underline-offset-4 hover:underline focus-visible:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm";

/** Features as plain entries: what each is for, what is waiting in it, and where to pick up. Locked ones stay visible. */
export function FeatureList({ features }: { features: FeatureView[] }) {
  return (
    <ul className="grid gap-x-10 gap-y-6 sm:grid-cols-2 xl:grid-cols-3">
      {features.map((f) => (
        <li key={f.key} className="min-w-0">
          {f.locked ? (
            <p className="flex items-center gap-1.5 font-semibold text-muted-foreground">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {f.name}
            </p>
          ) : (
            <Link to={f.route} className={cn("font-semibold text-primary", linkClass)}>{f.name}</Link>
          )}
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
          {f.locked && <p className="mt-1.5 text-sm">{f.needs}</p>}
          {f.flags.length > 0 && (
            <ul className="mt-2 space-y-1">
              {f.flags.map((flag) => (
                <li key={flag.text} className="flex items-baseline gap-2 text-sm font-medium">
                  <span aria-hidden="true" className={cn("h-2 w-2 shrink-0 translate-y-[-1px] rounded-full", flag.urgent ? "bg-[hsl(var(--coral))]" : "border border-foreground/50")} />
                  <span>{flag.text}</span>
                </li>
              ))}
            </ul>
          )}
          {f.resume && (
            <Link to={f.resume.to} className={cn("mt-2 block truncate text-sm font-medium text-primary", linkClass)}>{f.resume.label}</Link>
          )}
        </li>
      ))}
    </ul>
  );
}
