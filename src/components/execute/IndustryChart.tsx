import { useCallback, useEffect, useMemo, useState } from "react";
import type { SunburstNode } from "@/types/execute";
import { buildDonutSegments, buildLeafSegments, petalColor } from "./lotusSegments";
import { IndustryLotus2D } from "./IndustryLotus2D";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Plus } from "lucide-react";

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
  /** Add or remove every sub-sector under a node. */
  onToggleAll: (node: SunburstNode) => void;
  /** Sector ids to keep lit (e.g. search matches); null = no highlight. */
  highlightIds?: Set<string> | null;
}

/**
 * Desktop: the 2.5D lotus; clicking a sector blooms it open into its sub-sectors.
 * Touch (< 768px): compact lotus; tapping a sector opens a slide-up sub-sector picker.
 */
export function IndustryChart({ tree, selectedIds, onHover, onClick, onToggleAll, highlightIds = null }: Props) {
  const clusters = useMemo(() => buildDonutSegments(tree), [tree]);
  const [wide, setWide] = useState(false);
  // Desktop drill-down: the sector whose sub-sectors are bloomed open.
  const [focus, setFocus] = useState<SunburstNode | null>(null);
  // Touch: the sector whose sub-sector drawer is open.
  const [sheet, setSheet] = useState<SunburstNode | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setWide(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setFocus(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus]);

  const shown = useMemo(() => (focus ? buildLeafSegments(focus) : clusters), [focus, clusters]);
  const sheetLeaves = useMemo(() => (sheet ? leaves(sheet) : []), [sheet]);
  const sheetSeg = clusters.find((s) => s.node === sheet);

  const open = (n: SunburstNode) => {
    setFocus(n);
    onHover(n, [n.name]);
  };

  const onLotusHover = useCallback(
    (n: SunburstNode | null, crumb: string[]) =>
      onHover(n, focus && n ? [focus.name, n.industry?.Sector_Group ?? ""].filter(Boolean) : crumb),
    [focus, onHover],
  );

  const focusIds = focus?.leafIds ?? [];
  const focusPicked = focusIds.filter((id) => selectedIds.has(id)).length;
  const sheetIds = sheet?.leafIds ?? [];
  const sheetAll = sheetIds.length > 0 && sheetIds.every((id) => selectedIds.has(id));

  return (
    <div className="space-y-4">
      {wide ? (
        <IndustryLotus2D
          key={focus?.name ?? "__all"}
          segments={shown}
          selectedIds={selectedIds}
          onSelect={(n) => (focus ? onClick(n, true) : open(n))}
          onHover={onLotusHover}
          highlightIds={highlightIds}
          overlay={
            focus ? (
              <>
                <Button size="sm" variant="outline" className="h-8 rounded-full bg-card/80 backdrop-blur" onClick={() => setFocus(null)}>
                  <ArrowLeft className="h-3.5 w-3.5" /> All sectors
                </Button>
                <span className="rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs backdrop-blur">
                  <span className="font-semibold">{focus.name}</span>
                  <span className="text-muted-foreground"> · {focusPicked}/{focusIds.length} picked</span>
                </span>
                <Button size="sm" className="h-8 rounded-full" onClick={() => onToggleAll(focus)}>
                  {focusPicked === focusIds.length ? "Remove all" : `Add all ${focusIds.length}`}
                </Button>
              </>
            ) : undefined
          }
        />
      ) : (
        <IndustryLotus2D
          compact
          segments={clusters}
          selectedIds={selectedIds}
          onSelect={(n) => setSheet(n)}
          onHover={onHover}
          highlightIds={highlightIds}
        />
      )}

      <p className="text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {!wide
          ? "Tap a petal to pick sub-sectors"
          : focus
            ? "Click sub-sectors to add or remove · Esc to go back"
            : "Click a sector to open it · petal length = data-protection risk"}
      </p>

      <Drawer shouldScaleBackground={false} open={!!sheet} onOpenChange={(o) => !o && setSheet(null)}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{sheet?.name}</DrawerTitle>
            <DrawerDescription>
              {sheetSeg ? `${sheetSeg.exposure} DPDP exposure · ${sheetSeg.count} sub-sectors · ` : ""}
              Tap the activities that apply.
            </DrawerDescription>
            {sheet && (
              <Button size="sm" variant={sheetAll ? "outline" : "default"} className="mt-2 w-fit" onClick={() => onToggleAll(sheet)}>
                {sheetAll ? "Remove all" : `Add all ${sheetIds.length}`}
              </Button>
            )}
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

      {wide && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]" aria-hidden="true">
          {shown.map((s, i) => (
            <li key={s.name + i} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: petalColor(i) }} />
              <span>{s.name}</span>
              <span className="font-mono text-muted-foreground">{s.exposure}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Tables ignore sr-only's 1px width, so clip a wrapper instead (avoids sideways scroll on phones). */}
      <div className="sr-only">
      <table>
        <caption>Industry sectors by number of sub-sectors and DPDP exposure</caption>
        <thead>
          <tr><th scope="col">Sector</th><th scope="col">Sub-sectors</th><th scope="col">DPDP exposure</th></tr>
        </thead>
        <tbody>
          {clusters.map((s) => (
            <tr key={s.name}>
              <th scope="row">{s.name}</th>
              <td>{s.count}</td>
              <td>{s.exposure}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
