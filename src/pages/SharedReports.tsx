import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search } from "lucide-react";

export default function SharedReports() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

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
    </div>
  );
}
