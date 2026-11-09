import type { SunburstNode } from "@/types/execute";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { buildDonutSegments, buildLeafSegments } from "./lotusSegments";
import { useMemo } from "react";

interface Props {
  tree: SunburstNode;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (node: SunburstNode) => void;
  onHover: (node: SunburstNode | null, breadcrumb: string[]) => void;
}

/** Keyboard- and screen-reader-friendly alternative to the lotus: every sector as a checklist. */
export function SectorList({ tree, selectedIds, onToggle, onToggleAll, onHover }: Props) {
  const clusters = useMemo(() => buildDonutSegments(tree), [tree]);

  return (
    <div className="space-y-2">
      {clusters.map((c) => {
        const ids = c.node.leafIds ?? [];
        const picked = ids.filter((id) => selectedIds.has(id)).length;
        return (
          <details key={c.name} className="group rounded-lg border bg-card open:shadow-sm">
            <summary
              className="flex cursor-pointer list-none items-center gap-3 px-3 py-2.5 hover:bg-muted/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
              onMouseEnter={() => onHover(c.node, [c.name])}
              onFocus={() => onHover(c.node, [c.name])}
            >
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: c.color }} aria-hidden="true" />
              <span className="flex-1 font-medium">{c.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {picked ? `${picked}/${ids.length} picked` : `${ids.length} sub-sectors`}
              </span>
              <Badge variant="outline" className="text-[10px]">{c.exposure}</Badge>
              <span className="text-muted-foreground transition-transform group-open:rotate-90" aria-hidden="true">›</span>
            </summary>
            <div className="border-t px-3 py-2">
              <button
                onClick={() => onToggleAll(c.node)}
                className="mb-1 text-[11px] font-medium text-primary hover:underline"
              >
                {picked === ids.length ? `Remove all of ${c.name}` : `Add all ${ids.length}`}
              </button>
              <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {buildLeafSegments(c.node).map((leaf) => {
                  const ind = leaf.node.industry!;
                  const id = ind.PrivCybHub_Sector_ID;
                  return (
                    <li key={id}>
                      <label
                        className="flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-muted/40"
                        onMouseEnter={() => onHover(leaf.node, [c.name, ind.Sector_Group])}
                      >
                        <Checkbox
                          checked={selectedIds.has(id)}
                          onCheckedChange={() => onToggle(id)}
                          onFocus={() => onHover(leaf.node, [c.name, ind.Sector_Group])}
                          className="mt-0.5"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm">{ind.Sub_Sector}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{ind.Micro_Activity}</span>
                        </span>
                        <Badge variant="outline" className="text-[10px]">{ind.DPDP_Exposure}</Badge>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          </details>
        );
      })}
    </div>
  );
}
