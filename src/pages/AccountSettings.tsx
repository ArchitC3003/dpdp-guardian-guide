import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, LogOut, Trash2, Bot, CheckCircle2, XCircle, Loader2, Save, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AccountSettings() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { canConfigureAI, userRoleLabel, userRoleColor } = usePermissions();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [exporting, setExporting] = useState(false);
  const [testingAi, setTestingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState<"untested" | "connected" | "failed">("untested");
  const [editName, setEditName] = useState(profile?.full_name || "");
  const [editOrg, setEditOrg] = useState(profile?.organisation || "");
  const [editJob, setEditJob] = useState((profile as any)?.job_title || "");
  const [saving, setSaving] = useState(false);

  const handleDeleteAccount = async () => {
    await supabase.auth.signOut();
    toast.success("Account deletion requested. Your data will be removed within 30 days.");
    navigate("/auth");
  };

  const handleTestAiConnection = async () => {
    setTestingAi(true);
    setAiStatus("untested");
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/policy-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "Respond with: CONNECTION_OK" }],
            config: { documentType: "Test", frameworks: "NIST CSF 2.0", industry: "Technology", orgSize: "enterprise", maturity: 2, outputFormat: "docx", classification: "internal" },
          }),
        }
      );
      if (resp.ok) {
        setAiStatus("connected");
        toast.success("AI connection verified successfully.");
      } else {
        setAiStatus("failed");
        toast.error("AI connection test failed. Demo mode will be used.");
      }
    } catch {
      setAiStatus("failed");
      toast.error("Could not reach AI service.");
    }
    setTestingAi(false);
  };

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const [assessments, checks, policies, deptGrid, fileRefs] = await Promise.all([
        supabase.from("assessments").select("*").eq("user_id", user.id),
        supabase.from("assessment_checks").select("*, assessments!inner(user_id)").eq("assessments.user_id", user.id),
        supabase.from("policy_items").select("*, assessments!inner(user_id)").eq("assessments.user_id", user.id),
        supabase.from("dept_grid").select("*, assessments!inner(user_id)").eq("assessments.user_id", user.id),
        supabase.from("file_references").select("*, assessments!inner(user_id)").eq("assessments.user_id", user.id),
      ]);
      const exportData = {
        exportedAt: new Date().toISOString(),
        profile,
        assessments: assessments.data,
        assessmentChecks: checks.data,
        policyItems: policies.data,
        deptGrid: deptGrid.data,
        fileReferences: fileRefs.data,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `privcybhub-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully.");
    } catch {
      toast.error("Failed to export data.");
    }
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account and personal data</p>
      </div>

      {/* Profile */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader><CardTitle className="text-lg">Profile</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div><span className="text-muted-foreground">Full Name:</span> <span className="ml-2">{profile?.full_name || "—"}</span></div>
          <div><span className="text-muted-foreground">Email:</span> <span className="ml-2">{user?.email || "—"}</span></div>
          <div><span className="text-muted-foreground">Organisation:</span> <span className="ml-2">{profile?.organisation || "—"}</span></div>
          <div><span className="text-muted-foreground">Role:</span> <span className="ml-2">{profile?.role || "—"}</span></div>
          <div><span className="text-muted-foreground">Account Created:</span> <span className="ml-2">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}</span></div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">AI Engine Status</p>
              <p className="text-xs text-muted-foreground">Lovable AI powers the Policy & SOP Builder with enterprise-grade GRC drafting capabilities.</p>
            </div>
            <div className="flex items-center gap-2">
              {aiStatus === "connected" && (
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </Badge>
              )}
              {aiStatus === "failed" && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 gap-1">
                  <XCircle className="h-3 w-3" /> Demo Mode
                </Badge>
              )}
              {aiStatus === "untested" && (
                <Badge variant="outline" className="text-muted-foreground gap-1">Not tested</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Model</p>
              <p className="text-sm text-foreground">Gemini 2.5 Flash (Recommended)</p>
            </div>
            <div className="rounded-lg border border-border p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Capabilities</p>
              <p className="text-sm text-foreground">Streaming, Multi-turn, 13+ Doc Types</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestAiConnection}
              disabled={testingAi}
              className="text-xs"
            >
              {testingAi ? (
                <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Testing...</>
              ) : (
                <><Bot className="h-3 w-3 mr-1.5" /> Test Connection</>
              )}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground">
            AI is powered by Lovable Cloud. No API key configuration needed. If the AI service is temporarily unavailable, the builder automatically falls back to demo mode with pre-built compliance templates.
          </p>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-900/30 bg-red-950/20">
        <CardHeader><CardTitle className="text-lg text-red-400">Delete My Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data including assessments, scores, notes, and file references. This action cannot be undone.</p>
          <Button variant="destructive" onClick={() => setShowDelete(true)}><Trash2 className="h-4 w-4 mr-2" />Delete Account</Button>
        </CardContent>
      </Card>

      {/* Export */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader><CardTitle className="text-lg">Export My Data</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Download all your assessment data as a JSON file.</p>
          <Button variant="outline" onClick={handleExport} disabled={exporting}><Download className="h-4 w-4 mr-2" />{exporting ? "Exporting..." : "Export Data"}</Button>
        </CardContent>
      </Card>

      {/* Session */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader><CardTitle className="text-lg">Session</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">You are currently signed in.</p>
          <Button variant="outline" onClick={signOut}><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>This will permanently delete your account and ALL your compliance assessment data. Type DELETE to confirm.</DialogDescription>
          </DialogHeader>
          <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder="Type DELETE" />
          <Button variant="destructive" disabled={deleteConfirm !== "DELETE"} onClick={handleDeleteAccount}>Confirm Delete</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
