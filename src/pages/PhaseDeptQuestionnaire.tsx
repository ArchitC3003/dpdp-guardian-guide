import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Plus, Building2, ChevronRight } from "lucide-react";

type DpdpRole = "data_fiduciary" | "joint_data_fiduciary" | "data_processor" | "dual_role" | null | undefined;

interface DeptTemplate {
  dept_code: string;
  dept_name: string;
  doc_ref: string | null;
  is_system: boolean;
}

interface AssessmentDept {
  id: string;
  dept_code: string;
  status: string;
  completion_pct: number;
  high_risk_count: number;
}

function roleBanner(role: DpdpRole): { label: string; implication: string } {
  switch (role) {
    case "data_fiduciary":
      return { label: "Data Fiduciary", implication: "Questions reflect your direct obligations to Data Principals" };
    case "data_processor":
      return { label: "Data Processor", implication: "Questions reflect your obligations under client instructions" };
    case "joint_data_fiduciary":
      return { label: "Joint Data Fiduciary", implication: "Questions reflect shared responsibility — joint arrangement details required" };
    case "dual_role":
      return { label: "Dual Role", implication: "Questions adapt per processing activity — classify each activity below" };
    default:
      return { label: "Role not set", implication: "Complete Phase 1 (Org Profile) to determine your DPDP role" };
  }
}

function statusBadge(pct: number) {
  if (pct === 0) return { label: "Not started", cls: "bg-muted text-muted-foreground" };
  if (pct >= 100) return { label: "Complete", cls: "bg-emerald/20 text-emerald" };
  return { label: `${pct}% in progress`, cls: "bg-amber/20 text-amber" };
}

export default function PhaseDeptQuestionnaire() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState<DpdpRole>(null);
  const [templates, setTemplates] = useState<DeptTemplate[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [assessmentDepts, setAssessmentDepts] = useState<AssessmentDept[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [newDeptName, setNewDeptName] = useState("");

  useEffect(() => {
    if (!assessmentId) return;
    (async () => {
      const [a, t, q, ad] = await Promise.all([
        supabase.from("assessments").select("dpdp_role").eq("id", assessmentId).single(),
        supabase.from("dept_templates").select("dept_code, dept_name, doc_ref, is_system").eq("is_active", true).order("is_system", { ascending: false }).order("dept_name"),
        supabase.from("universal_question_templates").select("question_id"),
        supabase.from("assessment_departments").select("id, dept_code, status, completion_pct, high_risk_count").eq("assessment_id", assessmentId),
      ]);
      setRole(((a.data as any)?.dpdp_role as DpdpRole) ?? null);
      setTemplates((t.data || []) as DeptTemplate[]);
      setAssessmentDepts((ad.data || []) as AssessmentDept[]);

      const universalCount = (q.data || []).length;
      const extras = await supabase.from("dept_question_extras").select("dept_code");
      const counts: Record<string, number> = {};
      (t.data || []).forEach((d: any) => {
        counts[d.dept_code] = universalCount;
      });
      (extras.data || []).forEach((e: any) => {
        counts[e.dept_code] = (counts[e.dept_code] || universalCount) + 1;
      });
      // Re-add universal baseline because the loop above adds 1 per extra row, so reset:
      const extraCounts: Record<string, number> = {};
      (extras.data || []).forEach((e: any) => {
        extraCounts[e.dept_code] = (extraCounts[e.dept_code] || 0) + 1;
      });
      const finalCounts: Record<string, number> = {};
      (t.data || []).forEach((d: any) => {
        finalCounts[d.dept_code] = universalCount + (extraCounts[d.dept_code] || 0);
      });
      setQuestionCounts(finalCounts);
      setLoading(false);
    })();
  }, [assessmentId]);

  const banner = useMemo(() => roleBanner(role), [role]);

  const openDept = async (tpl: DeptTemplate) => {
    if (!assessmentId) return;
    const existing = assessmentDepts.find((d) => d.dept_code === tpl.dept_code);
    if (existing) {
      navigate(`/assessment/${assessmentId}/dept-questionnaire/${existing.id}`);
      return;
    }
    setAdding(tpl.dept_code);
    const { data, error } = await supabase
      .from("assessment_departments")
      .insert({ assessment_id: assessmentId, dept_code: tpl.dept_code, dept_name: tpl.dept_name })
      .select("id")
      .single();
    setAdding(null);
    if (error || !data) {
      toast.error("Could not open department");
      return;
    }
    navigate(`/assessment/${assessmentId}/dept-questionnaire/${data.id}`);
  };

  const addCustomDept = async () => {
    const name = newDeptName.trim();
    if (!name) return;
    const code = name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);
    if (!code) return;
    if (templates.some((t) => t.dept_code === code)) {
      toast.error("A department with that code already exists");
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("dept_templates").insert({
      dept_code: code,
      dept_name: name,
      is_system: false,
      ai_generated: false,
      created_by: user?.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewDeptName("");
    toast.success("Department added");
    const { data: t } = await supabase.from("dept_templates").select("dept_code, dept_name, doc_ref, is_system").eq("is_active", true).order("is_system", { ascending: false }).order("dept_name");
    setTemplates((t || []) as DeptTemplate[]);
    setQuestionCounts((prev) => ({ ...prev, [code]: prev[Object.keys(prev)[0]] || 17 }));
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading departments…</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold bg-primary/20 text-primary px-2 py-1 rounded">DEPT INTERVIEWS</span>
          <h1 className="text-2xl font-bold">Department Questionnaire</h1>
        </div>
        <Button variant="outline" onClick={() => navigate(`/assessment/${assessmentId}/dashboard`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Phases
        </Button>
      </div>

      {/* Role context banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Building2 className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-mono">Assessment context</p>
            <p className="text-sm font-semibold">{banner.label} <span className="text-muted-foreground font-normal">— {banner.implication}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Add department row */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <input
          className="h-9 px-3 text-sm rounded-md border border-border bg-background min-w-[220px]"
          placeholder="Add department (e.g. Marketing)"
          value={newDeptName}
          maxLength={60}
          onChange={(e) => setNewDeptName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomDept(); } }}
        />
        <Button size="sm" onClick={addCustomDept} disabled={!newDeptName.trim()}>
          <Plus className="h-4 w-4 mr-1" /> Add department
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((tpl) => {
          const ad = assessmentDepts.find((d) => d.dept_code === tpl.dept_code);
          const pct = ad?.completion_pct ?? 0;
          const sb = statusBadge(pct);
          const qCount = questionCounts[tpl.dept_code] ?? 17;
          return (
            <button
              key={tpl.dept_code}
              onClick={() => openDept(tpl)}
              disabled={adding === tpl.dept_code}
              className="text-left group"
            >
              <Card className="border-border bg-card hover:border-primary/50 transition h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-base leading-tight">{tpl.dept_name}</p>
                      {tpl.doc_ref && <p className="text-xs font-mono text-muted-foreground mt-0.5">{tpl.doc_ref}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary mt-1" />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="font-mono">{qCount} questions</Badge>
                    <span className={`px-2 py-0.5 rounded font-medium ${sb.cls}`}>{sb.label}</span>
                    {(ad?.high_risk_count ?? 0) > 0 && (
                      <span className="px-2 py-0.5 rounded bg-risk-critical/20 text-risk-critical font-medium">
                        {ad!.high_risk_count} high risk
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}