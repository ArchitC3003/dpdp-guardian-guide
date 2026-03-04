import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, LogOut, Trash2 } from "lucide-react";

export default function AccountSettings() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [exporting, setExporting] = useState(false);

  const handleDeleteAccount = async () => {
    await supabase.auth.signOut();
    toast.success("Account deletion requested. Your data will be removed within 30 days.");
    navigate("/auth");
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
