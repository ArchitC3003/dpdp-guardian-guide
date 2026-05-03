import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, Compass, Play, Plug, GraduationCap, Sparkles,
  BookOpen, Users, Bot, ScrollText, FileText, Scale, AlertTriangle,
  FileSearch, ArrowRight, ChevronRight, Layers, Shield, BookMarked,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
} from "recharts";

type Tile = {
  key: string;
  title: string;
  description: string;
  icon: any;
  url?: string;
  cta: string;
  comingSoon?: boolean;
  variant?: "default" | "dark";
};

const moduleTiles: Tile[] = [
  {
    key: "assess",
    title: "Assess",
    description: "Conduct gap assessments, monitor compliance readiness, and manage audit workflows against DPDP 2023 and global frameworks.",
    icon: ClipboardList,
    url: "/assessments",
    cta: "Go to Assessments",
  },
  {
    key: "build",
    title: "Build (Policies)",
    description: "Generate and manage organisational policies, SOPs, and legal frameworks using our AI-powered policy generator.",
    icon: Compass,
    url: "/policy-sop-builder",
    cta: "Open Policy Builder",
  },
  {
    key: "execute",
    title: "Execute",
    description: "Track real-time compliance tasks, schedule internal audits, and manage ongoing privacy operations.",
    icon: Play,
    cta: "Coming Soon",
    comingSoon: true,
  },
  {
    key: "integrate",
    title: "Integrate",
    description: "Connect your existing tech stack to automate data discovery and monitor sync status across cloud providers.",
    icon: Plug,
    cta: "Coming Soon",
    comingSoon: true,
  },
  {
    key: "learn",
    title: "Learn",
    description: "Access training modules for employees and stay updated with the latest regulatory changes in data privacy.",
    icon: GraduationCap,
    cta: "Coming Soon",
    comingSoon: true,
  },
  {
    key: "ai",
    title: "AI Copilot",
    description: "Draft complex Privacy Impact Assessments (PIA), DPIA notes and policy clauses using our compliant LLM.",
    icon: Sparkles,
    url: "/policy-sop-builder",
    cta: "Try Beta Features",
    variant: "dark",
  },
];

const adminTiles: Tile[] = [
  { key: "frameworks", title: "Framework Manager", description: "Manage assessment frameworks and requirements.", icon: BookOpen, url: "/admin/frameworks", cta: "Open" },
  { key: "users", title: "User Management", description: "Invite team members and assign roles.", icon: Users, url: "/settings/users", cta: "Open" },
  { key: "ai-config", title: "AI Configuration", description: "Manage prompts, models, and few-shot examples.", icon: Bot, url: "/admin/ai-config", cta: "Open" },
  { key: "templates", title: "Assessment Templates", description: "Curate framework bundles for new assessments.", icon: BookMarked, url: "/admin/assessment-templates", cta: "Open" },
];

const privacyOpsTiles: Tile[] = [
  { key: "consent", title: "Consent Ledger", description: "Consent receipts and records.", icon: ScrollText, url: "/consent/ledger", cta: "Open" },
  { key: "notices", title: "Notice Manager", description: "Create and publish privacy notices.", icon: FileText, url: "/consent/notices", cta: "Open" },
  { key: "rights", title: "Rights Desk", description: "Data principal rights requests.", icon: Scale, url: "/consent/rights-desk", cta: "Open" },
  { key: "grievances", title: "Grievances", description: "Complaints and grievance redressal.", icon: AlertTriangle, url: "/consent/grievances", cta: "Open" },
  { key: "audit", title: "Audit Log", description: "Tamper-evident event log.", icon: FileSearch, url: "/consent/audit-log", cta: "Open" },
];

interface ActivityItem {
  id: string;
  kind: "assessment" | "policy";
  title: string;
  status: string;
  updated_at: string;
  url: string;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { userRoleLabel, userRoleColor, canManageUsers } = usePermissions();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [readiness, setReadiness] = useState<number>(0);
  const [assessmentTotal, setAssessmentTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    const [{ data: assessments }, { data: policies }] = await Promise.all([
      supabase
        .from("assessments")
        .select("id, org_name, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
      supabase
        .from("policy_documents")
        .select("id, title, status, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

    const items: ActivityItem[] = [];
    (assessments ?? []).slice(0, 3).forEach((a) =>
      items.push({
        id: a.id,
        kind: "assessment",
        title: a.org_name || "Untitled Assessment",
        status: a.status,
        updated_at: a.updated_at,
        url: `/assessment/${a.id}/dashboard`,
      }),
    );
    (policies ?? []).slice(0, 2).forEach((p: any) =>
      items.push({
        id: p.id,
        kind: "policy",
        title: p.title,
        status: p.status,
        updated_at: p.updated_at,
        url: `/policy-library`,
      }),
    );
    items.sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));
    setActivity(items.slice(0, 5));

    // Readiness: % of assessments completed vs total (weighted: In Progress = 50)
    const all = assessments ?? [];
    setAssessmentTotal(all.length);
    if (all.length === 0) {
      setReadiness(0);
    } else {
      const score = all.reduce((sum, a) => {
        if (a.status === "Completed") return sum + 100;
        if (a.status === "In Progress") return sum + 50;
        return sum;
      }, 0) / all.length;
      setReadiness(Math.round(score));
    }
    setLoading(false);
  };

  const renderTile = (t: Tile) => {
    const Icon = t.icon;
    const isDark = t.variant === "dark";
    return (
      <Card
        key={t.key}
        className={cn(
          "border-border transition-all flex flex-col",
          isDark ? "bg-slate-950 border-slate-800" : "bg-card hover:border-primary/40",
          t.comingSoon && "opacity-70",
        )}
      >
        <CardContent className="p-5 flex flex-col gap-4 flex-1">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                isDark
                  ? "bg-primary/15 text-primary"
                  : "bg-primary/10 text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className={cn("font-semibold text-base", isDark && "text-slate-100")}>
                {t.title}
              </h3>
              {t.comingSoon && (
                <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-400">
                  Soon
                </Badge>
              )}
            </div>
          </div>
          <p
            className={cn(
              "text-sm leading-relaxed flex-1",
              isDark ? "text-slate-400" : "text-muted-foreground",
            )}
          >
            {t.description}
          </p>
          <Button
            disabled={t.comingSoon}
            onClick={() => t.url && navigate(t.url)}
            className={cn(
              "w-full justify-center",
              isDark && !t.comingSoon && "bg-transparent border border-primary/40 text-primary hover:bg-primary/10",
            )}
            variant={isDark ? "outline" : "default"}
          >
            {t.cta}
            {!t.comingSoon && <ArrowRight className="h-4 w-4 ml-1" />}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your PrivcybHub regulatory workspace
            {profile?.organisation && (
              <> · <span className="text-foreground/80">{profile.organisation}</span></>
            )}
          </p>
        </div>
        <Badge variant="outline" className={cn("text-xs px-2.5 py-1 self-start", userRoleColor)}>
          <Shield className="h-3 w-3 mr-1" />
          {userRoleLabel}
        </Badge>
      </div>

      {/* Module tiles */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Modules
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {moduleTiles.map(renderTile)}
        </div>
      </section>

      {/* Privacy Operations (GRC Manager / Admin) */}
      {canManageUsers && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Privacy Operations
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {privacyOpsTiles.map(renderTile)}
          </div>
        </section>
      )}

      {/* Admin tools */}
      {canManageUsers && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary" /> Admin Tools
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {adminTiles.map(renderTile)}
          </div>
        </section>
      )}

      {/* Bottom: Recent Activity + Readiness */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/assessments")}>
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No recent activity yet. Start an assessment or generate a policy.
              </p>
            ) : (
              <div className="space-y-1.5">
                {activity.map((a) => (
                  <button
                    key={`${a.kind}-${a.id}`}
                    onClick={() => navigate(a.url)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/40 hover:bg-secondary transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {a.kind === "assessment" ? (
                        <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{a.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {a.kind === "assessment" ? "Assessment" : "Policy"} · {new Date(a.updated_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] shrink-0">{a.status}</Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Overall Readiness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-44 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="75%"
                  outerRadius="100%"
                  data={[{ name: "readiness", value: readiness, fill: "hsl(var(--primary))" }]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-foreground">{readiness}%</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                  Readiness
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Across {assessmentTotal} assessment{assessmentTotal === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}