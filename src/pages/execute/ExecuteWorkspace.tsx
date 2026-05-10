import { useNavigate, useParams } from "react-router-dom";
import { useExecuteWorkspace } from "@/hooks/useExecuteWorkspace";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ClipboardList, Bot, FolderLock, ArrowRight, Building2, Globe2, Users, Shield, Lock,
} from "lucide-react";
import { getIndustryById } from "@/data/privcybhubIndustries";

export default function ExecuteWorkspace() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { workspace, loading } = useExecuteWorkspace(workspaceId);

  if (loading) return <div className="p-10 text-muted-foreground">Loading workspace…</div>;
  if (!workspace) return <div className="p-10 text-muted-foreground">Workspace not found.</div>;

  const flags = workspace.triggered_flags;
  const cw = workspace.crosswalk_summary;
  const sectors = workspace.selected_sector_ids
    .map((id) => getIndustryById(id))
    .filter((x): x is NonNullable<typeof x> => !!x);

  const flagChips: { label: string; value: string; tone: string }[] = [
    { label: "SDF Likelihood", value: flags.sdf_likelihood, tone: flags.sdf_likelihood === "High" ? "bg-destructive/15 text-destructive" : "bg-muted" },
    { label: "Health Data", value: flags.health_data, tone: flags.health_data === "Core" ? "bg-orange-500/15 text-orange-600" : "bg-muted" },
    { label: "Children Data", value: flags.children_data, tone: flags.children_data === "Core" ? "bg-orange-500/15 text-orange-600" : "bg-muted" },
    { label: "Financial", value: flags.financial_data, tone: flags.financial_data !== "None" ? "bg-blue-500/15 text-blue-600" : "bg-muted" },
    { label: "Cross-Border", value: flags.cross_border, tone: flags.cross_border === "Active" ? "bg-amber-500/15 text-amber-600" : "bg-muted" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-mono text-muted-foreground">EXECUTE WORKSPACE</p>
            <h1 className="text-3xl font-bold">{workspace.org_name}</h1>
            <p className="text-sm text-muted-foreground">{workspace.trade_name || workspace.primary_role}</p>
          </div>
          <Badge variant="outline" className="font-mono">{workspace.primary_role}</Badge>
        </div>

        {/* Profile + Flags */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-1">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> INDUSTRY PROFILE</div>
              <div className="space-y-1.5">
                {sectors.slice(0, 6).map((s) => (
                  <div key={s.PrivCybHub_Sector_ID} className="text-sm">
                    <span className="font-medium">{s.Sub_Sector}</span>
                    <span className="text-muted-foreground"> · {s.Cluster}</span>
                  </div>
                ))}
                {sectors.length > 6 && <p className="text-xs text-muted-foreground">+{sectors.length - 6} more</p>}
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                <div><Globe2 className="h-3 w-3 inline mr-1" />{workspace.footprint.length} regions</div>
                <div><Users className="h-3 w-3 inline mr-1" />{workspace.employee_band}</div>
                <div><Shield className="h-3 w-3 inline mr-1" />{workspace.principals_band}</div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">TRIGGERED FLAGS</div>
              <div className="flex flex-wrap gap-2">
                {flagChips.map((c) => (
                  <span key={c.label} className={`text-xs px-2.5 py-1 rounded-md ${c.tone}`}>
                    <span className="font-mono">{c.label}:</span> <strong>{c.value}</strong>
                  </span>
                ))}
              </div>
              {flags.sectoral_overlay.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-mono text-muted-foreground mb-1">SECTORAL OVERLAY</p>
                  <div className="flex flex-wrap gap-1">
                    {flags.sectoral_overlay.slice(0, 8).map((r) => (
                      <Badge key={r} variant="secondary" className="text-[10px]">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Crosswalk */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">REGULATORY CROSSWALK</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([["GDPR", cw.gdpr], ["CCPA", cw.ccpa], ["HIPAA", cw.hipaa]] as const).map(([k, v]) => (
                <div key={k} className="border rounded-md p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono">{k}</span>
                    <Badge variant="outline">{v.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{v.rationale}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Function tiles */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Programme functions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:border-primary transition-colors group" onClick={() => navigate(`/assessments?fromWorkspace=${workspace.id}`)}>
              <CardContent className="p-5 space-y-2">
                <ClipboardList className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Assessment</h3>
                <p className="text-xs text-muted-foreground">Run gap assessments tailored to your sectors and footprint.</p>
                <div className="flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Open <ArrowRight className="h-3 w-3 ml-1" /></div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-primary transition-colors group" onClick={() => navigate(`/policy-sop-builder?fromWorkspace=${workspace.id}`)}>
              <CardContent className="p-5 space-y-2">
                <Bot className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">Build</h3>
                <p className="text-xs text-muted-foreground">Generate policies, SOPs, and notices from this profile.</p>
                <div className="flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Open <ArrowRight className="h-3 w-3 ml-1" /></div>
              </CardContent>
            </Card>
            <Card className="opacity-60 cursor-not-allowed">
              <CardContent className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <FolderLock className="h-6 w-6 text-muted-foreground" />
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">Repository</h3>
                <p className="text-xs text-muted-foreground">Evidence vault, RoPA, DPIA archive. Coming next.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="pt-2">
          <Button variant="ghost" onClick={() => navigate("/execute")}>← All workspaces</Button>
        </div>
      </div>
    </div>
  );
}