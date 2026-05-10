import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus, ArrowRight } from "lucide-react";
import { useExecuteWorkspaces } from "@/hooks/useExecuteWorkspace";
import { Badge } from "@/components/ui/badge";

export default function ExecuteLanding() {
  const navigate = useNavigate();
  const { items, loading } = useExecuteWorkspaces();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono">
            <Sparkles className="h-3.5 w-3.5" /> EXECUTE · BESPOKE DPDP PROGRAMME
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Build a DPDP programme that fits your business — not a template.
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Pick the petals of the Indian economy you operate in. We tailor controls,
            obligations, and crosswalks to GDPR, CCPA, and HIPAA — instantly.
          </p>
          <Button size="lg" className="mt-4" onClick={() => navigate("/execute/select")}>
            Start a new programme <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your workspaces</h2>
            <Button variant="outline" size="sm" onClick={() => navigate("/execute/select")}>
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : items.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">
              No workspaces yet. Start your first bespoke programme above.
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((w) => (
                <Card
                  key={w.id}
                  className="cursor-pointer hover:border-primary/60 transition-colors"
                  onClick={() => navigate(`/execute/workspace/${w.id}`)}
                >
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{w.org_name}</h3>
                        <p className="text-xs text-muted-foreground font-mono">{w.primary_role}</p>
                      </div>
                      <Badge variant="outline">{w.selected_sector_ids.length} sectors</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {w.footprint.slice(0, 4).map((f) => (
                        <Badge key={f} variant="secondary" className="text-[10px]">{f}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}