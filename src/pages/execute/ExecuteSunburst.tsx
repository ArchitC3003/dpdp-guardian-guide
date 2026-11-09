import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IndustryChart } from "@/components/execute/IndustryChart";
import { SectorList } from "@/components/execute/SectorList";
import { ImpactPanel } from "@/components/execute/ImpactPanel";
import {
  buildIndustryTree,
  nodeRequiresDisambiguation,
} from "@/data/privcybhubIndustries";
import { searchIndustries, summarizeNode } from "@/lib/executeSelect";
import type { SunburstNode } from "@/types/execute";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowRight, X, Info, Search, Check, Plus, Flower2, List } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

interface LeafRef { node: SunburstNode; crumb: string[] }
type View = "lotus" | "list";

const DRAFT_KEY = "execute.draftSectors";
const VIEW_KEY = "execute.selectView";

function readDraft(): string[] {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function initialView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "lotus" || v === "list") return v;
  } catch { /* storage unavailable */ }
  return typeof window !== "undefined" && window.matchMedia?.("(max-width: 767px)").matches ? "list" : "lotus";
}

export default function ExecuteSunburst() {
  const navigate = useNavigate();
  const tree = useMemo(() => buildIndustryTree(), []);
  // Every selectable sub-sector, keyed by sector id, with its breadcrumb.
  const leaves = useMemo(() => {
    const map = new Map<string, LeafRef>();
    const visit = (n: SunburstNode, crumb: string[]) => {
      if (n.industry) map.set(n.industry.PrivCybHub_Sector_ID, { node: n, crumb: crumb.slice(0, -1) });
      (n.children ?? []).forEach((c) => visit(c, n.industry ? crumb : [...crumb, c.name]));
    };
    (tree.children ?? []).forEach((c) => visit(c, [c.name]));
    return map;
  }, [tree]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(readDraft().filter((id) => leaves.has(id))),
  );
  const [restored, setRestored] = useState(() => selected.size);
  const [view, setView] = useState<View>(initialView);
  const [hover, setHover] = useState<{ node: SunburstNode | null; crumb: string[] }>({ node: null, crumb: [] });
  const [disambig, setDisambig] = useState<SunburstNode | null>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [announce, setAnnounce] = useState("");

  // Keep picks across refreshes on this browser until a workspace is created.
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(Array.from(selected))); } catch { /* storage unavailable */ }
  }, [selected]);
  const changeView = (v: View) => {
    setView(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* storage unavailable */ }
  };

  const results = useMemo(() => searchIndustries(query), [query]);
  const highlightIds = useMemo(
    () => (query.trim() ? new Set(results.map((r) => r.PrivCybHub_Sector_ID)) : null),
    [query, results],
  );

  // Keep the last hovered item in the preview so it stays readable when the pointer moves to the panel.
  const onHover = useCallback((node: SunburstNode | null, crumb: string[]) => {
    if (!node) return;
    setHover((prev) => (prev.node === node ? prev : { node, crumb }));
  }, []);

  const toggleId = (id: string) => {
    const name = leaves.get(id)?.node.industry?.Sub_Sector ?? id;
    const removing = selected.has(id);
    setSelected((prev) => {
      const next = new Set(prev);
      if (removing) next.delete(id);
      else next.add(id);
      return next;
    });
    setAnnounce(`${removing ? "Removed" : "Added"} ${name}`);
  };
  const toggleMany = (node: SunburstNode) => {
    const ids = node.leafIds ?? [];
    const allIn = ids.every((i) => selected.has(i));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allIn) ids.forEach((i) => next.delete(i));
      else ids.forEach((i) => next.add(i));
      return next;
    });
    setAnnounce(`${allIn ? "Removed" : "Added"} ${node.name}`);
  };

  const handleClick = (node: SunburstNode) => {
    if (node.industry) {
      toggleId(node.industry.PrivCybHub_Sector_ID);
      return;
    }
    if (nodeRequiresDisambiguation(node)) {
      setDisambig(node);
      return;
    }
    if (node.leafIds && node.leafIds.length) toggleMany(node);
  };

  const previewLeaf = (id: string) => {
    const ref = leaves.get(id);
    if (ref) setHover({ node: ref.node, crumb: ref.crumb });
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) {
      if (e.key === "Escape") setQuery("");
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = (active + (e.key === "ArrowDown" ? 1 : results.length - 1)) % results.length;
      setActive(next);
      previewLeaf(results[next].PrivCybHub_Sector_ID);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const id = results[Math.min(active, results.length - 1)].PrivCybHub_Sector_ID;
      toggleId(id);
      previewLeaf(id);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  };

  const selectedList = useMemo(
    () =>
      Array.from(selected).map((id) => {
        const ind = leaves.get(id)?.node.industry;
        return { id, label: ind ? `${ind.Cluster} › ${ind.Sub_Sector}` : id };
      }),
    [selected, leaves],
  );

  const proceed = () => {
    sessionStorage.setItem("execute.selectedSectors", JSON.stringify(Array.from(selected)));
    navigate("/execute/profile");
  };

  const hovered = hover.node;
  const summary = hovered && !hovered.industry ? summarizeNode(hovered) : null;
  const hoveredIds = hovered?.leafIds ?? [];
  const hoveredPicked = hoveredIds.filter((id) => selected.has(id)).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-muted-foreground">STEP 1 OF 3</p>
            <h1 className="text-2xl font-bold">Pick your industry petals</h1>
            <p className="text-sm text-muted-foreground">
              Open a sector and pick every sub-sector you operate in. Your regulatory exposure updates as you go.
            </p>
          </div>
          <Button onClick={proceed} disabled={selected.size === 0}>
            Continue ({selected.size}) <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {restored > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
            <span>Welcome back — we kept your {restored} pick{restored === 1 ? "" : "s"} from last time.</span>
            <span className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setRestored(0)}>Keep</Button>
              <Button size="sm" variant="outline" onClick={() => { setSelected(new Set()); setRestored(0); }}>Start over</Button>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                    onKeyDown={onSearchKey}
                    placeholder="Search your business — e.g. lending, hospital, edtech, SaaS"
                    className="pl-9 pr-9"
                    role="combobox"
                    aria-expanded={!!query.trim()}
                    aria-controls="sector-search-results"
                    aria-label="Search sectors"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="flex rounded-md border p-0.5" role="group" aria-label="View">
                  {([["lotus", Flower2, "Lotus"], ["list", List, "List"]] as const).map(([v, Icon, label]) => (
                    <button
                      key={v}
                      onClick={() => changeView(v)}
                      aria-pressed={view === v}
                      className={`flex items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors ${
                        view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {query.trim() && (
                <div id="sector-search-results" role="listbox" className="rounded-lg border bg-card">
                  {results.length === 0 ? (
                    <p className="p-3 text-sm text-muted-foreground">
                      No sub-sector matches “{query.trim()}”. Try a broader word, or browse the sectors below.
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {results.map((ind, i) => {
                        const isOn = selected.has(ind.PrivCybHub_Sector_ID);
                        return (
                          <li key={ind.PrivCybHub_Sector_ID}>
                            <button
                              role="option"
                              aria-selected={isOn}
                              onClick={() => toggleId(ind.PrivCybHub_Sector_ID)}
                              onMouseEnter={() => { setActive(i); previewLeaf(ind.PrivCybHub_Sector_ID); }}
                              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                                i === active ? "bg-muted/60" : "hover:bg-muted/40"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                  isOn ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                                }`}
                              >
                                {isOn ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 text-muted-foreground" />}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium">{ind.Sub_Sector}</span>
                                <span className="block truncate text-[11px] text-muted-foreground">
                                  {ind.Cluster} › {ind.Sector_Group} · {ind.Micro_Activity}
                                </span>
                              </span>
                              <Badge variant="outline" className="text-[10px]">{ind.DPDP_Exposure}</Badge>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  <p className="border-t px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    ↑↓ to move · Enter to add/remove · Esc to clear
                  </p>
                </div>
              )}

              {view === "lotus" ? (
                <IndustryChart
                  tree={tree}
                  selectedIds={selected}
                  onHover={onHover}
                  onClick={handleClick}
                  onToggleAll={toggleMany}
                  highlightIds={highlightIds}
                />
              ) : (
                <SectorList
                  tree={tree}
                  selectedIds={selected}
                  onToggle={toggleId}
                  onToggleAll={toggleMany}
                  onHover={onHover}
                />
              )}
            </CardContent>
          </Card>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                  <Info className="h-3.5 w-3.5" /> PREVIEW
                </div>
                {hovered?.industry ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">{hover.crumb.join(" › ")}</p>
                    <h3 className="font-semibold">{hovered.industry.Sub_Sector}</h3>
                    <p className="text-xs">{hovered.industry.Micro_Activity}</p>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2">
                      <div><span className="text-muted-foreground">DPDP:</span> <Badge variant="outline">{hovered.industry.DPDP_Exposure}</Badge></div>
                      <div><span className="text-muted-foreground">GDPR:</span> <Badge variant="outline">{hovered.industry.GDPR_Applicability}</Badge></div>
                      <div><span className="text-muted-foreground">CCPA:</span> <Badge variant="outline">{hovered.industry.CCPA_Applicability}</Badge></div>
                      <div><span className="text-muted-foreground">HIPAA:</span> <Badge variant="outline">{hovered.industry.HIPAA_Applicability}</Badge></div>
                    </div>
                    <p className="text-[11px] text-muted-foreground pt-2">{hovered.industry.Sectoral_Regulator}</p>
                    <Button
                      size="sm"
                      variant={hoveredPicked ? "outline" : "default"}
                      className="w-full"
                      onClick={() => handleClick(hovered)}
                    >
                      {hoveredPicked ? "Remove" : "Add"} {hovered.industry.Sub_Sector}
                    </Button>
                  </div>
                ) : hovered && summary ? (
                  <div className="space-y-2">
                    <h3 className="font-semibold">{hovered.name}</h3>
                    <div className="text-xs text-muted-foreground">
                      {summary.total} sub-sectors · highest DPDP exposure <Badge variant="outline">{summary.exposure}</Badge>
                    </div>
                    <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                      <div className="bg-red-500" style={{ width: `${(summary.exposureCounts.High / summary.total) * 100}%` }} />
                      <div className="bg-amber-400" style={{ width: `${(summary.exposureCounts.Medium / summary.total) * 100}%` }} />
                      <div className="bg-emerald-400" style={{ width: `${(summary.exposureCounts.Low / summary.total) * 100}%` }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {summary.exposureCounts.High} high · {summary.exposureCounts.Medium} medium · {summary.exposureCounts.Low} low
                    </p>
                    {summary.regulators.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {summary.regulators.slice(0, 6).map((r) => (
                          <Badge key={r} variant="secondary" className="text-[10px] font-normal">{r}</Badge>
                        ))}
                        {summary.regulators.length > 6 && (
                          <Badge variant="secondary" className="text-[10px] font-normal">+{summary.regulators.length - 6} more</Badge>
                        )}
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant={hoveredPicked === hoveredIds.length ? "outline" : "default"}
                      className="w-full"
                      onClick={() => toggleMany(hovered)}
                    >
                      {hoveredPicked === hoveredIds.length ? `Remove all of ${hovered.name}` : `Add all ${hoveredIds.length} sub-sectors`}
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Hover or open a sector to preview its regulators and GDPR/CCPA/HIPAA crosswalk.</p>
                )}
              </CardContent>
            </Card>

            <ImpactPanel
              selectedIds={Array.from(selected)}
              selectedList={selectedList}
              onRemove={toggleId}
              onClear={() => setSelected(new Set())}
            />
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{announce}</p>

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
              const ind = leaves.get(id)?.node.industry;
              if (!ind) return null;
              const checked = selected.has(id);
              return (
                <label key={id} className="flex items-start gap-2 p-2 rounded hover:bg-muted/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleId(id)}
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
