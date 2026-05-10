import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SunburstChart } from "@/components/execute/SunburstChart";
import {
  buildIndustryTree,
  nodeRequiresDisambiguation,
} from "@/data/privcybhubIndustries";
import type { ExecuteIndustry, SunburstNode } from "@/types/execute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, X, Info } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

export default function ExecuteSunburst() {
  const navigate = useNavigate();
  const tree = useMemo(() => buildIndustryTree(), []);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<{ ind: ExecuteIndustry | null; crumb: string[] }>({ ind: null, crumb: [] });
  const [disambig, setDisambig] = useState<SunburstNode | null>(null);

  const toggleId = (id: string, additive: boolean) => {
    const next = new Set(additive ? selected : new Set<string>());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };
  const toggleMany = (ids: string[], additive: boolean) => {
    const next = new Set(additive ? selected : new Set<string>());
    const allIn = ids.every((i) => next.has(i));
    if (allIn) ids.forEach((i) => next.delete(i));
    else ids.forEach((i) => next.add(i));
    setSelected(next);
  };

  const handleClick = (node: SunburstNode, additive: boolean) => {
    if (node.industry) {
      toggleId(node.industry.PrivCybHub_Sector_ID, additive);
      return;
    }
    if (nodeRequiresDisambiguation(node)) {
      setDisambig(node);
      return;
    }
    if (node.leafIds && node.leafIds.length) toggleMany(node.leafIds, additive);
  };

  const selectedList = useMemo(
    () =>
      Array.from(selected).map((id) => {
        // flatten tree to find name
        let label = id;
        const visit = (n: SunburstNode): boolean => {
          if (n.industry?.PrivCybHub_Sector_ID === id) {
            label = `${n.industry.Cluster} › ${n.industry.Sub_Sector}`;
            return true;
          }
          return (n.children ?? []).some(visit);
        };
        visit(tree);
        return { id, label };
      }),
    [selected, tree],
  );

  const proceed = () => {
    sessionStorage.setItem("execute.selectedSectors", JSON.stringify(Array.from(selected)));
    navigate("/execute/profile");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-mono text-muted-foreground">STEP 1 OF 3</p>
            <h1 className="text-2xl font-bold">Pick your industry petals</h1>
            <p className="text-sm text-muted-foreground">
              Click a petal to add it. Hold ⌘/Ctrl to multi-select. Hover for the regulatory crosswalk.
            </p>
          </div>
          <Button onClick={proceed} disabled={selected.size === 0}>
            Continue ({selected.size}) <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <Card>
            <CardContent className="p-4">
              <SunburstChart
                tree={tree}
                selectedIds={selected}
                onHover={(ind, crumb) => setHover({ ind, crumb })}
                onClick={handleClick}
                size={640}
              />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Info className="h-3.5 w-3.5" /> HOVER PREVIEW
                </div>
                {hover.ind ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{hover.crumb.join(" › ")}</p>
                    <h3 className="font-semibold">{hover.ind.Sub_Sector}</h3>
                    <p className="text-xs">{hover.ind.Micro_Activity}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
                      <div><span className="text-muted-foreground">DPDP:</span> <Badge variant="outline">{hover.ind.DPDP_Exposure}</Badge></div>
                      <div><span className="text-muted-foreground">GDPR:</span> <Badge variant="outline">{hover.ind.GDPR_Applicability}</Badge></div>
                      <div><span className="text-muted-foreground">CCPA:</span> <Badge variant="outline">{hover.ind.CCPA_Applicability}</Badge></div>
                      <div><span className="text-muted-foreground">HIPAA:</span> <Badge variant="outline">{hover.ind.HIPAA_Applicability}</Badge></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-2">{hover.ind.Sectoral_Regulator}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Hover a petal to preview the regulator and crosswalk.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted-foreground">SELECTED · {selected.size}</span>
                  {selected.size > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
                  )}
                </div>
                {selectedList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No petals selected yet.</p>
                ) : (
                  <div className="space-y-1 max-h-72 overflow-auto">
                    {selectedList.map((s) => (
                      <div key={s.id} className="flex items-center justify-between gap-2 text-xs bg-muted/40 rounded px-2 py-1">
                        <span className="truncate">{s.label}</span>
                        <button onClick={() => toggleId(s.id, true)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Sheet open={!!disambig} onOpenChange={(o) => !o && setDisambig(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Pick the precise activities</SheetTitle>
            <SheetDescription>
              {disambig?.name} contains regulated sub-sectors. Tick the ones that apply.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {(disambig?.leafIds ?? []).map((id) => {
              const ind = (() => {
                const stack: SunburstNode[] = [tree];
                while (stack.length) {
                  const n = stack.pop()!;
                  if (n.industry?.PrivCybHub_Sector_ID === id) return n.industry;
                  (n.children ?? []).forEach((c) => stack.push(c));
                }
                return null;
              })();
              if (!ind) return null;
              const checked = selected.has(id);
              return (
                <label key={id} className="flex items-start gap-2 p-2 rounded hover:bg-muted/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleId(id, true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{ind.Sub_Sector}</p>
                    <p className="text-[11px] text-muted-foreground">{ind.Micro_Activity}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{ind.DPDP_Exposure}</Badge>
                </label>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setDisambig(null)}>Done</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}