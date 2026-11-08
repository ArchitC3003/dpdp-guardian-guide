import { useEffect, useMemo, useState } from "react";
import type { SunburstNode } from "@/types/execute";
import { buildDonutSegments } from "./IndustryDonut3D";

import { IndustryLotus2D } from "./IndustryLotus2D";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Check, Plus } from "lucide-react";

function leaves(n: SunburstNode, out: SunburstNode[] = []) {
  if (n.industry) out.push(n);
  (n.children ?? []).forEach((c) => leaves(c, out));
  return out;
}

interface Props {
  tree: SunburstNode;
  selectedIds: Set<string>;
  onHover: (node: SunburstNode | null, breadcrumb: string[]) => void;
  onClick: (node: SunburstNode, additive: boolean) => void;
  /** Cluster names to keep lit (e.g. search matches); null = no highlight. */
  highlightClusters?: Set<string> | null;
}

/** 3D donut on capable desktops; falls back to the 2D sunburst when WebGL is missing or width < 768px. */
export function IndustryChart({ tree, selectedIds, onHover, onClick, highlightClusters = null }: Props) {
  const segments = useMemo(() => buildDonutSegments(tree), [tree]);
  const [use3D, setUse3D] = useState(false);

  useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setUse3D(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const [sheet, setSheet] = useState<SunburstNode | null>(null);
  const sheetLeaves = useMemo(() => (sheet ? leaves(sheet) : []), [sheet]);
  const sheetSeg = segments.find((s) => s.node === sheet);

  return (
    <div className="space-y-4">
      {use3D ? (
          <IndustryLotus2D
            segments={segments}
            selectedIds={selectedIds}
            onSelect={onClick}
            onHover={onHover}
            highlightClusters={highlightClusters}
          />
      ) : (
        <IndustryLotus2D
          compact
          segments={segments}
          selectedIds={selectedIds}
          onSelect={(n) => setSheet(n)}
          onHover={onHover}
          highlightClusters={highlightClusters}
        />
      )}

      {!use3D && (
        <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Tap a petal to pick sub-sectors</p>
      )}

      <Drawer shouldScaleBackground={false} open={!!sheet} onOpenChange={(o) => !o && setSheet(null)}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{sheet?.name}</DrawerTitle>
            <DrawerDescription>
              {sheetSeg ? `${sheetSeg.exposure} DPDP exposure · ${(sheetSeg.share * 100).toFixed(1)}% share · ` : ""}
              Tap the activities that apply.
            </DrawerDescription>
          </DrawerHeader>
          <ul className="space-y-2 overflow-y-auto px-4 pb-6">
            {sheetLeaves.map((l) => {
              const ind = l.industry!;
              const on = selectedIds.has(ind.PrivCybHub_Sector_ID);
              return (
                <li key={ind.PrivCybHub_Sector_ID}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => onClick(l, true)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${on ? "border-primary bg-primary/10" : "border-border bg-card"}`}
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${on ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                      {on ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{ind.Sub_Sector}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{ind.Micro_Activity}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px]">{ind.DPDP_Exposure}</Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        </DrawerContent>
      </Drawer>

      {use3D && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]" aria-hidden="true">
          {segments.map((s) => (
            <li key={s.name} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              <span>{s.name}</span>
              <span className="font-mono text-muted-foreground">{s.exposure}</span>
            </li>
          ))}
        </ul>
      )}

      <table className="sr-only">
        <caption>Industry sectors by share of sub-sectors and DPDP exposure</caption>
        <thead>
          <tr><th scope="col">Sector</th><th scope="col">Sub-sectors</th><th scope="col">Share</th><th scope="col">DPDP exposure</th></tr>
        </thead>
        <tbody>
          {segments.map((s) => (
            <tr key={s.name}>
              <th scope="row">{s.name}</th>
              <td>{s.count}</td>
              <td>{(s.share * 100).toFixed(1)}%</td>
              <td>{s.exposure}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
