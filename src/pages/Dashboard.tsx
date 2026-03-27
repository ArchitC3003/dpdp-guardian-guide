import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, ExternalLink, ClipboardList, BarChart3, CheckCircle2, Layers, Shield, FileText, AlertTriangle, BookMarked, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Assessment = Tables<"assessments">;

interface TemplateCard {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  is_default: boolean;
  frameworks: { id: string; short_code: string; jurisdiction: string; name: string }[];
  requirement_count: number;
}

interface PolicyDocRow {
  id: string;
  title: string;
  status: string;
  review_date: string | null;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  "Under Review": "border-orange-500/40 text-orange-400 bg-orange-500/10",
  Approved: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  Published: "border-primary/40 text-primary bg-primary/10",
  Retired: "border-muted-foreground/40 text-muted-foreground bg-muted/20",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [policyDocs, setPolicyDocs] = useState<PolicyDocRow[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAssessments();
    loadPolicyDocs();
  }, [user, isAdmin]);

  const loadAssessments = async () => {
    const { data } = await supabase
      .from("assessments")
      .select("*")
      .order("updated_at", { ascending: false });
    setAssessments(data || []);
    setLoading(false);
  };

  const loadPolicyDocs = async () => {
    const { data } = await supabase
      .from("policy_documents")
      .select("id, title, status, review_date, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5);
    setPolicyDocs((data as PolicyDocRow[]) ?? []);
  };

  const loadTemplates = async (): Promise<TemplateCard[]> => {
    const { data: tpls } = await supabase
      .from("assessment_templates")
      .select("id, name, description, template_type, is_default")
      .eq("is_active", true)
      .order("is_default", { ascending: false });
    if (!tpls || tpls.length === 0) return [];

    const { data: links } = await supabase
      .from("assessment_template_frameworks")
      .select("template_id, framework_id");

    const { data: frameworks } = await supabase
      .from("assessment_frameworks")
      .select("id, short_code, jurisdiction, name")
      .eq("is_active", true);

    const { data: domains } = await supabase
      .from("framework_domains")
      .select("id, framework_id")
      .eq("is_active", true);

    const { data: reqs } = await supabase
      .from("framework_requirements")
      .select("id, domain_id")
      .eq("is_active", true);

    const domainsByFw: Record<string, string[]> = {};
    (domains ?? []).forEach((d) => {
      if (!domainsByFw[d.framework_id]) domainsByFw[d.framework_id] = [];
      domainsByFw[d.framework_id].push(d.id);
    });

    const reqsByDomain: Record<string, number> = {};
    (reqs ?? []).forEach((r) => {
      reqsByDomain[r.domain_id] = (reqsByDomain[r.domain_id] || 0) + 1;
    });

    const cards: TemplateCard[] = tpls.map((t) => {
      const fwIds = (links ?? []).filter((l) => l.template_id === t.id).map((l) => l.framework_id);
      const fws = (frameworks ?? []).filter((f) => fwIds.includes(f.id));
      let reqCount = 0;
      fwIds.forEach((fid) => {
        (domainsByFw[fid] ?? []).forEach((did) => {
          reqCount += reqsByDomain[did] || 0;
        });
      });
      return { ...t, frameworks: fws, requirement_count: reqCount };
    });
    return cards;
  };

  const handleNewAssessment = async () => {
    if (!user) return;
    const cards = await loadTemplates();
    if (cards.length === 0) {
      await createAssessmentLegacy();
    } else {
      setTemplates(cards);
      setShowTemplatePicker(true);
    }
  };

  const createAssessmentLegacy = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("assessments")
      .insert({ user_id: user.id })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create assessment");
      return;
    }
    toast.success("Assessment created");
    navigate(`/assessment/${data.id}/org-profile`);
  };

  const createFromTemplate = async (template: TemplateCard) => {
    if (!user || creatingFromTemplate) return;
    setCreatingFromTemplate(true);
    const frameworkIds = template.frameworks.map((f) => f.id);
    const { data, error } = await supabase
      .from("assessments")
      .insert({
        user_id: user.id,
        template_id: template.id,
        framework_ids: frameworkIds,
      })
      .select()
      .single();
    setCreatingFromTemplate(false);
    if (error) {
      toast.error("Failed to create assessment");
      return;
    }
    setShowTemplatePicker(false);
    toast.success("Assessment created");
    navigate(`/assessment/${data.id}/org-profile`);
  };

  const deleteAssessment = async (id: string) => {
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Assessment deleted");
    loadAssessments();
  };

  const inProgress = assessments.filter((a) => a.status === "In Progress").length;
  const completed = assessments.filter((a) => a.status === "Completed").length;

  const stats = [
    { label: "Total Assessments", value: assessments.length, icon: ClipboardList },
    { label: "In Progress", value: inProgress, icon: BarChart3 },
    { label: "Completed", value: completed, icon: CheckCircle2 },
    { label: "Domains Covered", value: 14, icon: Layers },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            DPDP Act, 2023 Compliance Overview
            {isAdmin && <span className="ml-2 inline-flex items-center gap-1 text-xs text-primary font-semibold"><Shield className="h-3 w-3" /> Admin View</span>}
          </p>
        </div>
        <Button onClick={handleNewAssessment} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" /> New Assessment
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold mt-1">{s.value}</p>
                </div>
                <s.icon className="h-8 w-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Assessments */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No assessments yet. Create your first one to get started.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assessments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.org_name || "Untitled Assessment"}</p>
                      <p className="text-xs text-muted-foreground">
                        v{a.version} · Updated {new Date(a.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => navigate(`/assessment/${a.id}/org-profile`)}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Open
                    </Button>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => deleteAssessment(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Policy Register Widget */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" /> Policy Register Status
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/policy-library")}>
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {(() => {
            const expiring = policyDocs.filter((d) => {
              if (!d.review_date) return false;
              const diff = new Date(d.review_date).getTime() - Date.now();
              return diff > 0 && diff <= 30 * 86400000;
            });
            return (
              <>
                {expiring.length > 0 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-300">{expiring.length} polic{expiring.length === 1 ? "y" : "ies"} due for review</p>
                  </div>
                )}
                {policyDocs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No policies generated yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {policyDocs.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">{d.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={cn("text-[8px]", STATUS_COLORS[d.status] ?? "")}>{d.status}</Badge>
                          {d.review_date && (
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(d.review_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Template Picker Dialog */}
      <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Assessment Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto py-2">
            {templates.map((t) => (
              <Card key={t.id} className={cn("border-border bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer", t.is_default && "ring-1 ring-primary/50")}>
                <CardContent className="p-4 space-y-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{t.name}</p>
                      {t.is_default && <Badge variant="outline" className="text-[9px] border-primary/40 text-primary">Default</Badge>}
                    </div>
                    {t.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {t.frameworks.map((fw) => (
                      <Badge key={fw.id} variant="outline" className="text-[9px]">
                        {fw.short_code} · {fw.jurisdiction}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{t.requirement_count} requirements</span>
                    <Button size="sm" onClick={() => createFromTemplate(t)} disabled={creatingFromTemplate}>
                      {creatingFromTemplate ? "Creating…" : "Select"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
