import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, Gauge, X } from "lucide-react";
import { computeImpact, type LawStatus } from "@/lib/executeSelect";

interface Props {
  selectedIds: string[];
  selectedList: { id: string; label: string }[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const STATUS_TONE: Record<LawStatus, string> = {
  Applies: "bg-destructive/15 text-destructive border-destructive/30",
  Likely: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  "Check in step 2": "bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-400",
  "Not indicated": "bg-muted text-muted-foreground border-border",
};

function band(index: number) {
  if (index >= 67) return { label: "High", tone: "text-destructive" };
  if (index >= 34) return { label: "Moderate", tone: "text-amber-600 dark:text-amber-400" };
  return { label: "Low", tone: "text-emerald-600 dark:text-emerald-400" };
}

/** Live read-out of what the current picks mean: exposure, sensitive-data flags, laws and regulators. */
export function ImpactPanel({ selectedIds, selectedList, onRemove, onClear }: Props) {
  const impact = useMemo(() => computeImpact(selectedIds), [selectedIds]);
  const [showPicks, setShowPicks] = useState(false);
  const b = band(impact.index);

  const flags = [
    { label: "SDF likelihood", value: impact.flags.sdf_likelihood, hot: impact.flags.sdf_likelihood === "High" },
    { label: "Children's data", value: impact.flags.children_data, hot: impact.flags.children_data === "Core" },
    { label: "Health data", value: impact.flags.health_data, hot: impact.flags.health_data === "Core" },
    { label: "Financial data", value: impact.flags.financial_data, hot: impact.flags.financial_data !== "None" },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <Gauge className="h-3.5 w-3.5" /> YOUR EXPOSURE
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            LIVE
          </span>
          {impact.count > 0 && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onClear}>Clear</Button>
          )}
        </div>

        {impact.count === 0 ? (
          <p className="text-sm text-muted-foreground">
            Pick a sub-sector to see which laws, regulators and sensitive-data duties apply to you.
          </p>
        ) : (
          <>
            <div aria-live="polite">
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold tabular-nums leading-none">
                  {impact.index}<span className="text-sm font-normal text-muted-foreground">/100</span>
                </p>
                <p className={`text-sm font-semibold ${b.tone}`}>{b.label} exposure</p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500">
                <div
                  className="ml-auto h-full bg-muted transition-all duration-500"
                  style={{ width: `${100 - impact.index}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Indicative · {impact.count} sub-sector{impact.count === 1 ? "" : "s"} · {impact.exposureCounts.High} high,{" "}
                {impact.exposureCounts.Medium} medium, {impact.exposureCounts.Low} low
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {flags.map((f) => (
                <div
                  key={f.label}
                  className={`rounded-md border px-2 py-1.5 transition-colors ${f.hot ? "border-amber-500/40 bg-amber-500/10" : "bg-muted/30"}`}
                >
                  <p className="text-[10px] text-muted-foreground">{f.label}</p>
                  <p className={`text-xs font-semibold ${f.hot ? "text-amber-700 dark:text-amber-400" : ""}`}>{f.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Laws in play</p>
              {impact.laws.map((l) => (
                <div key={l.name} className="flex items-center justify-between gap-2 text-xs" title={l.why}>
                  <span className="font-medium">{l.name}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[l.status]}`}>{l.status}</span>
                </div>
              ))}
            </div>

            {impact.regulators.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {impact.regulators.length} sector regulator{impact.regulators.length === 1 ? "" : "s"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {impact.regulators.slice(0, 8).map((r) => (
                    <Badge key={r} variant="secondary" className="text-[10px] font-normal">{r}</Badge>
                  ))}
                  {impact.regulators.length > 8 && (
                    <Badge variant="secondary" className="text-[10px] font-normal">+{impact.regulators.length - 8} more</Badge>
                  )}
                </div>
              </div>
            )}

            <div className="border-t pt-2">
              <button
                onClick={() => setShowPicks((s) => !s)}
                className="flex w-full items-center justify-between text-xs font-mono text-muted-foreground hover:text-foreground"
                aria-expanded={showPicks}
              >
                YOUR PICKS · {selectedList.length}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showPicks ? "rotate-180" : ""}`} />
              </button>
              {showPicks && (
                <div className="mt-2 max-h-56 space-y-1 overflow-auto">
                  {selectedList.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-2 rounded bg-muted/40 px-2 py-1 text-xs">
                      <span className="truncate">{s.label}</span>
                      <button
                        onClick={() => onRemove(s.id)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${s.label}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
