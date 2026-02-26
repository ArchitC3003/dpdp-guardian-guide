import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEPARTMENTS, DEPT_CONTROLS } from "@/data/assessmentDomains";
import { ArrowRight } from "lucide-react";

interface GridCell {
  id?: string;
  control_id: number;
  department: string;
  status: string | null;
}

export default function PhaseDeptGrid() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [grid, setGrid] = useState<Record<string, GridCell>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assessmentId) return;
    supabase.from("dept_grid").select("*").eq("assessment_id", assessmentId)
      .then(({ data }) => {
        const map: Record<string, GridCell> = {};
        (data || []).forEach((d) => { map[`${d.control_id}-${d.department}`] = d; });
        setGrid(map);
      });
  }, [assessmentId]);

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
        <Button onClick={() => navigate(`/assessment/${assessmentId}/file-references`)} className="gradient-primary">
          Next Phase <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <Card className="border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 sticky left-0 bg-card z-10 min-w-[200px]">Control</th>
                  {DEPARTMENTS.map((dept) => (
                    <th key={dept} className="text-center p-2 min-w-[90px] whitespace-nowrap">{dept}</th>
                  ))}
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
                    {DEPARTMENTS.map((dept) => {
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
