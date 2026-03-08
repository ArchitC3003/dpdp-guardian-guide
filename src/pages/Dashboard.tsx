import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ExternalLink, ClipboardList, BarChart3, CheckCircle2, Layers, Shield, FileText, AlertTriangle, BookMarked, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Assessment = Tables<"assessments">;

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

  useEffect(() => {
    if (!user) return;
    loadAssessments();
    loadPolicyDocs();
  }, [user, isAdmin]);

  const loadAssessments = async () => {
    // Admin sees all assessments; regular users see only their own (enforced by RLS)
    const { data } = await supabase
      .from("assessments")
      .select("*")
      .order("updated_at", { ascending: false });
    setAssessments(data || []);
    setLoading(false);
  };

  const createAssessment = async () => {
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
        <Button onClick={createAssessment} className="gradient-primary">
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
    </div>
  );
}
