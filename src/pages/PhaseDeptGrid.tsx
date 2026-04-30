import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { toast } from "@/hooks/use-toast";
import { DEPARTMENTS, DEPT_CONTROLS } from "@/data/assessmentDomains";
import { ArrowLeft, ArrowRight, Plus, X, Settings, ArrowUp, ArrowDown } from "lucide-react";

interface GridCell {
  id?: string;
  control_id: number;
  department: string;
  status: string | null;
}

interface GlobalDept {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface CustomDept {
  id: string;
  name: string;
}

export default function PhaseDeptGrid() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();
  const [grid, setGrid] = useState<Record<string, GridCell>>({});
  const [saving, setSaving] = useState(false);
  const [globalDepts, setGlobalDepts] = useState<GlobalDept[]>([]);
  const [customDepts, setCustomDepts] = useState<CustomDept[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [newGlobalName, setNewGlobalName] = useState("");
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);

  const reloadGlobal = useCallback(async () => {
    const { data } = await supabase
      .from("global_departments")
      .select("*")
      .order("display_order", { ascending: true });
    setGlobalDepts((data || []) as GlobalDept[]);
  }, []);

  const reloadCustom = useCallback(async () => {
    if (!assessmentId) return;
    const { data } = await supabase
      .from("assessment_custom_departments")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: true });
    setCustomDepts((data || []) as CustomDept[]);
  }, [assessmentId]);

  useEffect(() => {
    if (!assessmentId) return;
    supabase.from("dept_grid").select("*").eq("assessment_id", assessmentId)
      .then(({ data }) => {
        const map: Record<string, GridCell> = {};
        (data || []).forEach((d) => { map[`${d.control_id}-${d.department}`] = d; });
        setGrid(map);
      });
    reloadGlobal();
    reloadCustom();
  }, [assessmentId, reloadGlobal, reloadCustom]);

  const visibleGlobal = globalDepts.filter((d) => d.is_active);
  const departments: string[] = (() => {
    const fromDb = [...visibleGlobal.map((d) => d.name), ...customDepts.map((c) => c.name)];
    return fromDb.length > 0 ? fromDb : DEPARTMENTS;
  })();
  const customNames = new Set(customDepts.map((c) => c.name));

  const addCustomDept = async () => {
    if (!assessmentId) return;
    const name = newDeptName.trim();
    if (!name) return;
    const lower = name.toLowerCase();
    const dup =
      globalDepts.some((g) => g.name.toLowerCase() === lower) ||
      customDepts.some((c) => c.name.toLowerCase() === lower);
    if (dup) {
      toast({ title: "Already exists", description: "A department with this name is already in the list.", variant: "destructive" });
      return;
    }
    const { error } = await supabase
      .from("assessment_custom_departments")
      .insert({ assessment_id: assessmentId, name });
    if (error) {
      toast({ title: "Could not add department", description: error.message, variant: "destructive" });
      return;
    }
    setNewDeptName("");
    await reloadCustom();
  };

  const removeCustomDept = async (dept: CustomDept) => {
    if (!assessmentId) return;
    if (!confirm(`Remove "${dept.name}" from this assessment? Any saved cells for this department will be deleted.`)) return;
    await supabase.from("dept_grid").delete().eq("assessment_id", assessmentId).eq("department", dept.name);
    await supabase.from("assessment_custom_departments").delete().eq("id", dept.id);
    setGrid((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => { if (k.endsWith(`-${dept.name}`)) delete next[k]; });
      return next;
    });
    await reloadCustom();
  };

  const addGlobalDept = async () => {
    const name = newGlobalName.trim();
    if (!name) return;
    const lower = name.toLowerCase();
    if (globalDepts.some((g) => g.name.toLowerCase() === lower)) {
      toast({ title: "Already exists", description: "Pick a different name.", variant: "destructive" });
      return;
    }
    const nextOrder = (globalDepts[globalDepts.length - 1]?.display_order ?? -1) + 1;
    const { error } = await supabase.from("global_departments").insert({ name, display_order: nextOrder });
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    setNewGlobalName("");
    await reloadGlobal();
  };

  const renameGlobalDept = async (g: GlobalDept) => {
    const next = prompt("Rename department", g.name);
    if (!next || next.trim() === g.name) return;
    const { error } = await supabase.from("global_departments").update({ name: next.trim() }).eq("id", g.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    await reloadGlobal();
  };

  const toggleGlobalActive = async (g: GlobalDept) => {
    await supabase.from("global_departments").update({ is_active: !g.is_active }).eq("id", g.id);
    await reloadGlobal();
  };

  const moveGlobal = async (g: GlobalDept, dir: -1 | 1) => {
    const idx = globalDepts.findIndex((x) => x.id === g.id);
    const swap = globalDepts[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("global_departments").update({ display_order: swap.display_order }).eq("id", g.id),
      supabase.from("global_departments").update({ display_order: g.display_order }).eq("id", swap.id),
    ]);
    await reloadGlobal();
  };

  const deleteGlobal = async (g: GlobalDept) => {
    if (!confirm(`Delete "${g.name}" globally? This affects all assessments. Existing saved cells will remain in the database but will be hidden.`)) return;
    await supabase.from("global_departments").delete().eq("id", g.id);
    await reloadGlobal();
  };

  const updateCell = useCallback(async (controlId: number, dept: string, value: string) => {
    if (!assessmentId) return;
    const key = `${controlId}-${dept}`;
    const existing = grid[key];
    setGrid((prev) => ({ ...prev, [key]: { ...existing, control_id: controlId, department: dept, status: value } }));

    setSaving(true);
    if (existing?.id) {
      await supabase.from("dept_grid").update({ status: value }).eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("dept_grid")
        .insert({ assessment_id: assessmentId, control_id: controlId, department: dept, status: value })
        .select()
        .single();
      if (data) setGrid((prev) => ({ ...prev, [key]: { ...prev[key], id: data.id } }));
    }
    setSaving(false);
  }, [assessmentId, grid]);

  const getCellColor = (status: string | null) => {
    if (status === "Yes") return "bg-emerald/20";
    if (status === "Partial") return "bg-amber/20";
    if (status === "No") return "bg-risk-critical/20";
    if (status === "N/A") return "bg-muted";
    return "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-2 py-1 rounded">PHASE 4</span>
          <h1 className="text-2xl font-bold">Department Practice Grid</h1>
          {saving && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/assessment/${assessmentId}/rapid-assessment`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Previous Phase
          </Button>
          <Button onClick={() => navigate(`/assessment/${assessmentId}/file-references`)} className="gradient-primary">
            Next Phase <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      <Card className="border-border bg-card">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[260px]">
            <Input
              placeholder="Add department for this assessment (e.g. Procurement)"
              value={newDeptName}
              maxLength={60}
              onChange={(e) => setNewDeptName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomDept(); } }}
              className="h-9"
            />
            <Button size="sm" onClick={addCustomDept} disabled={!newDeptName.trim()}>
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </div>
          {isAdmin && (
            <Sheet open={adminPanelOpen} onOpenChange={setAdminPanelOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-1" /> Manage global departments
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[420px] sm:w-[480px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Global departments</SheetTitle>
                  <SheetDescription>
                    Changes here apply to every assessment in the app. Disabling hides a department from new and existing grids without deleting saved data.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="New global department"
                      value={newGlobalName}
                      maxLength={60}
                      onChange={(e) => setNewGlobalName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addGlobalDept(); } }}
                    />
                    <Button size="sm" onClick={addGlobalDept} disabled={!newGlobalName.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="border border-border rounded-md divide-y divide-border">
                    {globalDepts.map((g, i) => (
                      <div key={g.id} className="flex items-center gap-2 p-2">
                        <div className="flex flex-col">
                          <button className="p-0.5 hover:text-primary disabled:opacity-30" disabled={i === 0} onClick={() => moveGlobal(g, -1)} aria-label="Move up">
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button className="p-0.5 hover:text-primary disabled:opacity-30" disabled={i === globalDepts.length - 1} onClick={() => moveGlobal(g, 1)} aria-label="Move down">
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </div>
                        <button onClick={() => renameGlobalDept(g)} className="flex-1 text-left text-sm hover:underline">
                          {g.name}
                        </button>
                        <Switch checked={g.is_active} onCheckedChange={() => toggleGlobalActive(g)} aria-label="Active" />
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => deleteGlobal(g)} aria-label="Delete">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    {globalDepts.length === 0 && (
                      <div className="p-3 text-xs text-muted-foreground">No global departments yet.</div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Renaming changes the label going forward. Saved cells from before the rename remain stored under the previous name.
                  </p>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 sticky left-0 bg-card z-10 min-w-[200px]">Control</th>
                  {departments.map((dept) => {
                    const custom = customDepts.find((c) => c.name === dept);
                    return (
                      <th key={dept} className="text-center p-2 min-w-[90px] whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <span>{dept}</span>
                          {custom && (
                            <button
                              onClick={() => removeCustomDept(custom)}
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={`Remove ${dept}`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {DEPT_CONTROLS.map((ctrl) => (
                  <tr key={ctrl.id} className="border-b border-border/50">
                    <td className="p-3 sticky left-0 bg-card z-10">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-primary">{ctrl.id}.</span>
                        <span className="text-xs">{ctrl.label}</span>
                      </div>
                    </td>
                    {departments.map((dept) => {
                      const key = `${ctrl.id}-${dept}`;
                      const cell = grid[key];
                      return (
                        <td key={dept} className={`p-1.5 ${getCellColor(cell?.status || null)}`}>
                          <Select
                            value={cell?.status || ""}
                            onValueChange={(v) => updateCell(ctrl.id, dept, v)}
                          >
                            <SelectTrigger className="h-7 text-[10px] border-0 bg-transparent">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              {["Yes", "Partial", "No", "N/A"].map((s) => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
