import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { FrameworkBadge } from "@/components/FrameworkBadge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, ExternalLink, ClipboardList, BarChart3, CheckCircle2, Shield, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import type { Tables } from "@/integrations/supabase/types";

type Assessment = Tables<"assessments">;

interface FrameworkInfo {
  id: string;
  short_code: string;
  colour: string;
  name: string;
}

interface TemplateCard {
  id: string;
  name: string;
  description: string | null;
  template_type: string;
  is_default: boolean;
  frameworks: { id: string; short_code: string; jurisdiction: string; name: string }[];
  requirement_count: number;
}

export default function Assessments() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState<TemplateCard[]>([]);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [frameworkMap, setFrameworkMap] = useState<Record<string, FrameworkInfo>>({});

  useEffect(() => {
    if (!user) return;
    loadAssessments();
    loadFrameworks();
  }, [user, isAdmin]);

  const loadFrameworks = async () => {
    const { data } = await supabase
      .from("assessment_frameworks")
      .select("id, short_code, colour, name")
      .eq("is_active", true);
    if (data) {
      const map: Record<string, FrameworkInfo> = {};
      data.forEach((f) => { map[f.id] = f; });
      setFrameworkMap(map);
    }
  };

  const loadAssessments = async () => {
    const { data } = await supabase
      .from("assessments")
      .select("*")
      .order("updated_at", { ascending: false });
    setAssessments(data || []);
    setLoading(false);
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

  const getAssessmentFrameworks = (a: Assessment): FrameworkInfo[] => {
    const ids = (a.framework_ids as string[] | null) ?? [];
    return ids.map((id) => frameworkMap[id]).filter(Boolean);
  };

  // Filter and sort
  const filteredAssessments = assessments
    .filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (searchQuery) {
        const name = (a.org_name || "").toLowerCase();
        if (!name.includes(searchQuery.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "updated") return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      if (sortBy === "created") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "name") return (a.org_name || "").localeCompare(b.org_name || "");
      return 0;
    });

  const inProgress = assessments.filter((a) => a.status === "In Progress").length;
  const completed = assessments.filter((a) => a.status === "Completed").length;

  const stats = [
    { label: "Total Assessments", value: assessments.length, icon: ClipboardList },
    { label: "In Progress", value: inProgress, icon: BarChart3 },
    { label: "Completed", value: completed, icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        title="Assessments"
        description="Create and manage compliance assessments"
        badge={
          isAdmin ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              <Shield className="h-3 w-3" /> Admin View
            </span>
          ) : null
        }
        actions={
          <Button onClick={handleNewAssessment} className="gradient-primary">
            <Plus className="h-4 w-4 mr-2" /> New Assessment
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border bg-card hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-semibold mt-1 tracking-tight">{s.value}</p>
                </div>
                <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by organisation name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recently Updated</SelectItem>
            <SelectItem value="created">Recently Created</SelectItem>
            <SelectItem value="name">Name A–Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assessment List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">All Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredAssessments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              {assessments.length === 0 ? (
                <>
                  <p>No assessments yet. Create your first assessment to get started.</p>
                  <Button onClick={handleNewAssessment} className="mt-4 gradient-primary">
                    <Plus className="h-4 w-4 mr-2" /> New Assessment
                  </Button>
                </>
              ) : (
                <p>No assessments match your filters.</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAssessments.map((a) => {
                const fws = getAssessmentFrameworks(a);
                return (
                  <div key={a.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{a.org_name || "Untitled Assessment"}</p>
                          {fws.map((fw) => (
                            <FrameworkBadge key={fw.id} shortCode={fw.short_code} colour={fw.colour} />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          v{a.version} · Created {new Date(a.created_at).toLocaleDateString()} · Updated {new Date(a.updated_at).toLocaleDateString()}
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Picker Dialog */}
      <Dialog open={showTemplatePicker} onOpenChange={setShowTemplatePicker}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Assessment Template</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 overflow-y-auto py-2 min-h-0">
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
