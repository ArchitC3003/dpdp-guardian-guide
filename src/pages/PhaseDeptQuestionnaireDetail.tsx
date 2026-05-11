import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Sparkles, Building2, Save } from "lucide-react";

type DpdpRole = "data_fiduciary" | "joint_data_fiduciary" | "data_processor" | "dual_role" | null | undefined;

interface QuestionRow {
  question_id: string;
  category: string;
  display_order: number;
  question_text: string;
  processor_text: string | null;
  joint_text: string | null;
  dual_note: string | null;
  dpdp_section_ref: string | null;
}

interface ExtraRow {
  question_id: string;
  category: string;
  display_order: number;
  question_text: string;
  processor_text: string | null;
  dpdp_section_ref: string | null;
}

interface Response {
  id?: string;
  question_id: string;
  response_text: string | null;
  status: string | null;
  risk_level: string | null;
  evidence_tools: string | null;
  assessor_notes: string | null;
}

interface AppRow {
  id?: string;
  app_vendor_name: string;
  type: string | null;
  function_supported: string | null;
  data_processed_description: string | null;
  dpa_status: string | null;
  security_assessment_status: string | null;
  notes: string | null;
  _isNew?: boolean;
}

interface DeptAssessment {
  id: string;
  assessment_id: string;
  dept_code: string;
  dept_name: string;
  rep_name: string | null;
  rep_email: string | null;
  interview_date: string | null;
  interviewer_name: string | null;
  status: string;
  completion_pct: number;
  high_risk_count: number;
}

function roleBanner(role: DpdpRole): { label: string; implication: string } {
  switch (role) {
    case "data_fiduciary": return { label: "Data Fiduciary", implication: "Questions reflect your direct obligations to Data Principals" };
    case "data_processor": return { label: "Data Processor", implication: "Questions reflect your obligations under client instructions" };
    case "joint_data_fiduciary": return { label: "Joint Data Fiduciary", implication: "Questions reflect shared responsibility — joint arrangement details required" };
    case "dual_role": return { label: "Dual Role", implication: "Questions adapt per processing activity — classify each activity below" };
    default: return { label: "Role not set", implication: "Complete Phase 1 to determine your DPDP role" };
  }
}

function resolveText(q: { question_text: string; processor_text: string | null; joint_text?: string | null; dual_note?: string | null }, role: DpdpRole, deptName: string): { text: string; note?: string } {
  let base = q.question_text;
  if (role === "data_processor" && q.processor_text) base = q.processor_text;
  else if (role === "joint_data_fiduciary" && q.joint_text) base = q.joint_text!;
  const text = base.replace(/\{\{dept_name\}\}/g, deptName);
  const note = role === "dual_role" ? (q.dual_note || undefined) : undefined;
  return { text, note };
}

function autoRiskFromStatus(status: string | null, currentRisk: string | null): string | null {
  if (status === "no" && !currentRisk) return "High";
  return currentRisk;
}

const STATUS_OPTS = [
  { v: "yes", l: "Yes" }, { v: "no", l: "No" }, { v: "partial", l: "Partial" }, { v: "na", l: "Not Applicable" },
];
const RISK_OPTS = ["Critical", "High", "Standard"];
const APP_TYPES = ["SaaS", "On-premise", "Custom-built", "Third-party Service"];
const DPA_OPTS = ["In Place", "Pending", "Not in Place", "N/A"];
const SEC_OPTS = ["Completed", "Pending", "Not Conducted"];

export default function PhaseDeptQuestionnaireDetail() {
  const { assessmentId, deptAssessmentId } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState<DpdpRole>(null);
  const [dept, setDept] = useState<DeptAssessment | null>(null);
  const [universal, setUniversal] = useState<QuestionRow[]>([]);
  const [extras, setExtras] = useState<ExtraRow[]>([]);
  const [responses, setResponses] = useState<Record<string, Response>>({});
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!assessmentId || !deptAssessmentId) return;
    (async () => {
      const [a, d, u, r, ai] = await Promise.all([
        supabase.from("assessments").select("dpdp_role").eq("id", assessmentId).single(),
        supabase.from("assessment_departments").select("*").eq("id", deptAssessmentId).single(),
        supabase.from("universal_question_templates").select("*").order("display_order"),
        supabase.from("dept_question_responses").select("*").eq("dept_assessment_id", deptAssessmentId),
        supabase.from("dept_app_inventory").select("*").eq("dept_assessment_id", deptAssessmentId),
      ]);
      setRole(((a.data as any)?.dpdp_role as DpdpRole) ?? null);
      const dd = d.data as any;
      setDept(dd);
      setUniversal((u.data || []) as QuestionRow[]);
      const rmap: Record<string, Response> = {};
      (r.data || []).forEach((row: any) => {
        rmap[row.question_id] = row;
      });
      setResponses(rmap);
      setApps(((ai.data || []) as AppRow[]).map((x) => ({ ...x })));

      if (dd?.dept_code) {
        const ex = await supabase.from("dept_question_extras").select("*").eq("dept_code", dd.dept_code).order("display_order");
        setExtras((ex.data || []) as ExtraRow[]);
      }
      setLoading(false);
    })();
  }, [assessmentId, deptAssessmentId]);

  const allQuestions = useMemo(() => {
    const base = universal.map((q) => ({ ...q, isExtra: false }));
    const ex = extras.map((q) => ({ ...q, joint_text: null, dual_note: null, isExtra: true } as QuestionRow & { isExtra: boolean }));
    return [...base, ...ex].sort((a, b) => a.display_order - b.display_order);
  }, [universal, extras]);

  const grouped = useMemo(() => {
    const m: Record<string, typeof allQuestions> = {};
    allQuestions.forEach((q) => {
      (m[q.category] ??= []).push(q);
    });
    return m;
  }, [allQuestions]);

  const recomputeProgress = useCallback(async (next: Record<string, Response>) => {
    if (!deptAssessmentId) return;
    const total = allQuestions.length || 1;
    const answered = Object.values(next).filter((r) => r.status).length;
    const pct = Math.round((answered / total) * 100);
    const high = Object.values(next).filter((r) => r.risk_level === "Critical" && r.status === "no").length;
    const status = pct === 0 ? "not_started" : pct >= 100 ? "complete" : "in_progress";
    await supabase.from("assessment_departments").update({
      completion_pct: pct, high_risk_count: high, status,
    }).eq("id", deptAssessmentId);
    setDept((d) => d ? { ...d, completion_pct: pct, high_risk_count: high, status } : d);
  }, [allQuestions.length, deptAssessmentId]);

  const updateResponse = async (question_id: string, patch: Partial<Response>) => {
    if (!assessmentId || !deptAssessmentId) return;
    const existing = responses[question_id];
    let merged: Response = { ...(existing || { question_id, response_text: null, status: null, risk_level: null, evidence_tools: null, assessor_notes: null }), ...patch };
    if (patch.status !== undefined) {
      merged.risk_level = autoRiskFromStatus(patch.status ?? null, merged.risk_level);
    }
    setResponses((prev) => ({ ...prev, [question_id]: merged }));
    setSaving(true);
    if (existing?.id) {
      await supabase.from("dept_question_responses").update({
        response_text: merged.response_text, status: merged.status, risk_level: merged.risk_level,
        evidence_tools: merged.evidence_tools, assessor_notes: merged.assessor_notes,
      }).eq("id", existing.id);
    } else {
      const { data } = await supabase.from("dept_question_responses").insert({
        assessment_id: assessmentId, dept_assessment_id: deptAssessmentId, question_id,
        response_text: merged.response_text, status: merged.status, risk_level: merged.risk_level,
        evidence_tools: merged.evidence_tools, assessor_notes: merged.assessor_notes,
      }).select("id").single();
      if (data) merged.id = data.id;
      setResponses((prev) => ({ ...prev, [question_id]: merged }));
    }
    await recomputeProgress({ ...responses, [question_id]: merged });
    setSaving(false);
  };

  const updateMeta = async (patch: Partial<DeptAssessment>) => {
    if (!deptAssessmentId || !dept) return;
    setDept({ ...dept, ...patch });
    await supabase.from("assessment_departments").update(patch).eq("id", deptAssessmentId);
  };

  const addAppRow = () => {
    setApps((a) => [...a, { app_vendor_name: "", type: null, function_supported: null, data_processed_description: null, dpa_status: null, security_assessment_status: null, notes: null, _isNew: true }]);
  };

  const updateApp = async (idx: number, patch: Partial<AppRow>) => {
    if (!assessmentId || !deptAssessmentId || !dept) return;
    const next = apps.slice();
    next[idx] = { ...next[idx], ...patch };
    setApps(next);
    const row = next[idx];
    if (!row.app_vendor_name.trim()) return;
    if (row.id) {
      await supabase.from("dept_app_inventory").update({
        app_vendor_name: row.app_vendor_name, type: row.type, function_supported: row.function_supported,
        data_processed_description: row.data_processed_description, dpa_status: row.dpa_status,
        security_assessment_status: row.security_assessment_status, notes: row.notes,
      }).eq("id", row.id);
    } else {
      const { data } = await supabase.from("dept_app_inventory").insert({
        assessment_id: assessmentId, dept_assessment_id: deptAssessmentId, dept_code: dept.dept_code,
        app_vendor_name: row.app_vendor_name, type: row.type, function_supported: row.function_supported,
        data_processed_description: row.data_processed_description, dpa_status: row.dpa_status,
        security_assessment_status: row.security_assessment_status, notes: row.notes,
      }).select("id").single();
      if (data) {
        next[idx] = { ...row, id: data.id, _isNew: false };
        setApps(next.slice());
      }
    }
  };

  const removeApp = async (idx: number) => {
    const row = apps[idx];
    if (row.id) await supabase.from("dept_app_inventory").delete().eq("id", row.id);
    setApps((a) => a.filter((_, i) => i !== idx));
  };

  if (loading || !dept) return <div className="p-8 text-muted-foreground">Loading questionnaire…</div>;

  const banner = roleBanner(role);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate(`/assessment/${assessmentId}/dept-questionnaire`)}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Departments
          </Button>
          <h1 className="text-2xl font-bold">{dept.dept_name}</h1>
          {saving && <span className="text-xs text-muted-foreground"><Save className="inline h-3 w-3 mr-1" />Saving…</span>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">{dept.completion_pct}% complete</Badge>
          {dept.high_risk_count > 0 && (
            <Badge className="bg-risk-critical/20 text-risk-critical">{dept.high_risk_count} high risk</Badge>
          )}
        </div>
      </div>

      {/* Role banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Building2 className="h-5 w-5 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-mono">Assessment context</p>
            <p className="text-sm font-semibold">{banner.label} <span className="text-muted-foreground font-normal">— {banner.implication}</span></p>
          </div>
        </CardContent>
      </Card>

      {/* Meta */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Department rep</label>
            <Input value={dept.rep_name || ""} onChange={(e) => updateMeta({ rep_name: e.target.value })} placeholder="Name" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Rep email</label>
            <Input type="email" value={dept.rep_email || ""} onChange={(e) => updateMeta({ rep_email: e.target.value })} placeholder="email@org.com" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Interview date</label>
            <Input type="date" value={dept.interview_date || ""} onChange={(e) => updateMeta({ interview_date: e.target.value || null as any })} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Interviewer</label>
            <Input value={dept.interviewer_name || ""} onChange={(e) => updateMeta({ interviewer_name: e.target.value })} placeholder="Name" />
          </div>
        </CardContent>
      </Card>

      {/* Questions grouped by category */}
      {Object.entries(grouped).map(([cat, qs]) => (
        <div key={cat} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground font-mono">{cat}</h2>
          {qs.map((q) => {
            const r = responses[q.question_id];
            const { text, note } = resolveText(q as any, role, dept.dept_name);
            return (
              <Card key={q.question_id} className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="font-mono">{q.question_id}</Badge>
                      {q.dpdp_section_ref && <Badge variant="outline" className="font-mono text-xs">{q.dpdp_section_ref}</Badge>}
                      <span className="text-xs text-muted-foreground">{q.category}</span>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-primary">
                          <Sparkles className="h-3.5 w-3.5 mr-1" /> Suggest
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>AI features coming soon</TooltipContent>
                    </Tooltip>
                  </div>
                  <CardTitle className="text-sm font-medium leading-relaxed pt-1">{text}</CardTitle>
                  {note && <p className="text-xs text-amber italic mt-1">Dual-role note: {note}</p>}
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Response…"
                    value={r?.response_text || ""}
                    onChange={(e) => setResponses((prev) => ({ ...prev, [q.question_id]: { ...(prev[q.question_id] || { question_id: q.question_id } as Response), response_text: e.target.value } }))}
                    onBlur={(e) => updateResponse(q.question_id, { response_text: e.target.value })}
                    rows={3}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Status</label>
                      <Select value={r?.status || ""} onValueChange={(v) => updateResponse(q.question_id, { status: v })}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTS.map((s) => <SelectItem key={s.v} value={s.v}>{s.l}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Risk level</label>
                      <Select value={r?.risk_level || ""} onValueChange={(v) => updateResponse(q.question_id, { risk_level: v })}>
                        <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          {RISK_OPTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Evidence / tools / vendors"
                      value={r?.evidence_tools || ""}
                      onChange={(e) => setResponses((prev) => ({ ...prev, [q.question_id]: { ...(prev[q.question_id] || { question_id: q.question_id } as Response), evidence_tools: e.target.value } }))}
                      onBlur={(e) => updateResponse(q.question_id, { evidence_tools: e.target.value })}
                    />
                    <Input
                      placeholder="Assessor notes"
                      value={r?.assessor_notes || ""}
                      onChange={(e) => setResponses((prev) => ({ ...prev, [q.question_id]: { ...(prev[q.question_id] || { question_id: q.question_id } as Response), assessor_notes: e.target.value } }))}
                      onBlur={(e) => updateResponse(q.question_id, { assessor_notes: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ))}

      {/* Apps & Vendors */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Applications & Vendor Inventory</CardTitle>
          <Button size="sm" variant="outline" onClick={addAppRow}><Plus className="h-4 w-4 mr-1" /> Add row</Button>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="text-left p-2">Application / Vendor</th>
                <th className="text-left p-2">Type</th>
                <th className="text-left p-2">Function</th>
                <th className="text-left p-2">Personal data categories</th>
                <th className="text-left p-2">DPA</th>
                <th className="text-left p-2">Security</th>
                <th className="text-left p-2">Notes</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 && (
                <tr><td colSpan={8} className="p-4 text-center text-muted-foreground">No apps recorded yet.</td></tr>
              )}
              {apps.map((row, idx) => (
                <tr key={row.id || `new-${idx}`} className="border-b border-border/50 align-top">
                  <td className="p-1.5 min-w-[160px]">
                    <Input value={row.app_vendor_name} onChange={(e) => setApps((a) => { const n = a.slice(); n[idx] = { ...n[idx], app_vendor_name: e.target.value }; return n; })} onBlur={(e) => updateApp(idx, { app_vendor_name: e.target.value })} className="h-8" />
                  </td>
                  <td className="p-1.5 min-w-[130px]">
                    <Select value={row.type || ""} onValueChange={(v) => updateApp(idx, { type: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{APP_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="p-1.5 min-w-[140px]"><Input value={row.function_supported || ""} onChange={(e) => setApps((a) => { const n = a.slice(); n[idx] = { ...n[idx], function_supported: e.target.value }; return n; })} onBlur={(e) => updateApp(idx, { function_supported: e.target.value })} className="h-8" /></td>
                  <td className="p-1.5 min-w-[160px]"><Input value={row.data_processed_description || ""} onChange={(e) => setApps((a) => { const n = a.slice(); n[idx] = { ...n[idx], data_processed_description: e.target.value }; return n; })} onBlur={(e) => updateApp(idx, { data_processed_description: e.target.value })} className="h-8" /></td>
                  <td className="p-1.5 min-w-[120px]">
                    <Select value={row.dpa_status || ""} onValueChange={(v) => updateApp(idx, { dpa_status: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{DPA_OPTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="p-1.5 min-w-[130px]">
                    <Select value={row.security_assessment_status || ""} onValueChange={(v) => updateApp(idx, { security_assessment_status: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                      <SelectContent>{SEC_OPTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="p-1.5 min-w-[140px]"><Input value={row.notes || ""} onChange={(e) => setApps((a) => { const n = a.slice(); n[idx] = { ...n[idx], notes: e.target.value }; return n; })} onBlur={(e) => updateApp(idx, { notes: e.target.value })} className="h-8" /></td>
                  <td className="p-1.5"><Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeApp(idx)}><Trash2 className="h-3.5 w-3.5" /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}