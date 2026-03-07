import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, Shield, Trash2, XCircle } from "lucide-react";

export default function SharedReports() {
  const { isAdmin } = useIsAdmin();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) loadAllReports();
  }, [isAdmin]);

  const loadAllReports = async () => {
    setAdminLoading(true);
    const { data } = await supabase
      .from("shared_reports")
      .select("*, assessments(org_name, status)")
      .order("shared_at", { ascending: false });
    setAllReports(data || []);
    setAdminLoading(false);
  };

  const loadReport = async () => {
    if (!code.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("shared_reports")
      .select("*, assessments(*)")
      .eq("share_code", code.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast.error("Invalid or expired share code");
      setReportData(null);
    } else {
      setReportData(data);
      toast.success("Report loaded");
    }
    setLoading(false);
  };

  const deactivateReport = async (id: string) => {
    const { error } = await supabase
      .from("shared_reports")
      .update({ is_active: false })
      .eq("id", id);
    if (error) {
      toast.error("Failed to deactivate");
    } else {
      toast.success("Report deactivated");
      loadAllReports();
    }
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from("shared_reports").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Report deleted");
      loadAllReports();
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Shared Reports</h1>

      <Card className="border-border bg-card">
        <CardHeader><CardTitle className="text-base">Enter Share Code</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter 8-character code"
              className="font-mono tracking-widest max-w-xs"
              maxLength={8}
            />
            <Button onClick={loadReport} disabled={loading} className="gradient-primary">
              <Search className="h-4 w-4 mr-2" /> Load Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6">
            <h3 className="text-lg font-bold mb-2">{(reportData.assessments as any)?.org_name || "Assessment"}</h3>
            <p className="text-sm text-muted-foreground">
              Shared on {new Date(reportData.shared_at).toLocaleDateString()} · Status: {(reportData.assessments as any)?.status}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Full read-only dashboard view coming soon. For now, you can see the assessment was shared successfully.
            </p>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> All Shared Reports (Admin)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {adminLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />)}
              </div>
            ) : allReports.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shared reports found.</p>
            ) : (
              <div className="space-y-2">
                {allReports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {(r.assessments as any)?.org_name || "Untitled"} — <span className="font-mono text-xs text-primary">{r.share_code}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.shared_at).toLocaleDateString()} · {r.is_active ? "Active" : "Inactive"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {r.is_active && (
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-yellow-400" onClick={() => deactivateReport(r.id)}>
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => deleteReport(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
