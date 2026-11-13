import { WheelMark } from "@/components/BrandLogo";
import { STAGES, isUpcoming, type StageKey } from "@/components/landing/stages";
import { cn } from "@/lib/utils";
import type { FeatureView } from "@/lib/workspaceFeatures";
import { FeatureList } from "./FeatureList";

/** The six programme stages in order, each with the tools that belong to it. The wheel rests on the furthest stage that has work in it. */
export function StageBoard({ features, reached }: { features: FeatureView[]; reached: StageKey }) {
  return (
    <ol className="relative">
      <span aria-hidden="true" className="absolute bottom-6 left-[11px] top-3 w-px bg-border" />
      {STAGES.map((s) => {
        const upcoming = isUpcoming(s.status);
        const here = s.key === reached;
        const own = features.filter((f) => f.group === s.key);
        return (
          <li key={s.key} className="relative grid gap-x-10 gap-y-4 pb-10 pl-10 last:pb-0 lg:grid-cols-[13rem_1fr]">
            <span className="absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center bg-background">
              {here ? <WheelMark size={24} color="hsl(var(--primary))" /> : (
                <span className={cn("h-2.5 w-2.5 rounded-full border-2", upcoming ? "border-dashed border-muted-foreground/60" : "border-primary bg-primary")} />
              )}
            </span>
            <div>
              <h3 className="flex flex-wrap items-center gap-2 font-serif text-xl leading-7">
                {s.name}
                {s.status !== "Live" && (
                  <span className={cn("rounded-full border px-2 font-sans text-xs leading-5 text-muted-foreground", upcoming && "border-dashed")}>{s.status}</span>
                )}
                {here && <span className="sr-only">(the furthest stage you have work in)</span>}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.line}</p>
            </div>
            {own.length > 0 ? <FeatureList features={own} /> : <p className="text-sm text-muted-foreground">{s.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
