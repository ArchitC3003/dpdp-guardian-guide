import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Eye, FileText, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const EMPTY_NOTICE = {
  version_number: "",
  fiduciary_name: "",
  fiduciary_contact: "",
  data_categories: [] as string[],
  purposes: [] as string[],
  retention_periods: [] as { category: string; period: string }[],
  third_parties: [] as { name: string; role: string; country: string }[],
  cross_border_transfers: "",
  grievance_officer_name: "",
  grievance_officer_email: "",
  grievance_officer_designation: "",
  grievance_response_timeline: "30 days",
  dpb_complaint_route: "",
  rights_description: "",
  withdraw_consent_link: "/privacy-preferences",
  effective_date: "",
  material_change: false,
};

const statusColor = (s: string) => {
  if (s === "Draft") return "bg-muted text-muted-foreground";
  if (s === "Active") return "bg-emerald-100 text-emerald-800";
  return "bg-amber-100 text-amber-800";
};

export default function NoticeManager() {
  const { session } = useAuth();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_NOTICE });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewNotice, setPreviewNotice] = useState<any>(null);

  // Translation state
  const [transOpen, setTransOpen] = useState(false);
  const [transNoticeId, setTransNoticeId] = useState<string | null>(null);
  const [translations, setTranslations] = useState<any[]>([]);
  const [transLang, setTransLang] = useState("hi");
  const [transContent, setTransContent] = useState("");
  const [transStatus, setTransStatus] = useState("Pending");

  useEffect(() => { fetchNotices(); }, []);

  const fetchNotices = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("privacy_notices").select("*").order("created_at", { ascending: false });
    setNotices(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setForm({ ...EMPTY_NOTICE });
    setEditingId(null);
    setEditOpen(true);
  };

  const openEdit = (n: any) => {
    setForm({
      version_number: n.version_number || "",
      fiduciary_name: n.fiduciary_name || "",
      fiduciary_contact: n.fiduciary_contact || "",
      data_categories: n.data_categories || [],
      purposes: n.purposes || [],
      retention_periods: n.retention_periods || [],
      third_parties: n.third_parties || [],
      cross_border_transfers: n.cross_border_transfers || "",
      grievance_officer_name: n.grievance_officer_name || "",
      grievance_officer_email: n.grievance_officer_email || "",
      grievance_officer_designation: n.grievance_officer_designation || "",
      grievance_response_timeline: n.grievance_response_timeline || "30 days",
      dpb_complaint_route: n.dpb_complaint_route || "",
      rights_description: n.rights_description || "",
      withdraw_consent_link: n.withdraw_consent_link || "/privacy-preferences",
      effective_date: n.effective_date || "",
      material_change: n.material_change || false,
    });
    setEditingId(n.id);
    setEditOpen(true);
  };

  const saveDraft = async () => {
    const payload = {
      ...form,
      data_categories: form.data_categories,
      purposes: form.purposes,
      retention_periods: form.retention_periods,
      third_parties: form.third_parties,
      status: "Draft",
      modified_by: session?.user?.id,
    };
    if (editingId) {
      await (supabase as any).from("privacy_notices").update(payload).eq("id", editingId);
    } else {
      payload.created_by = session?.user?.id;
      await (supabase as any).from("privacy_notices").insert(payload);
    }
    toast({ title: "Draft saved" });
    setEditOpen(false);
    fetchNotices();
  };

  const publish = async (id: string) => {
    // Retire all currently active
    await (supabase as any).from("privacy_notices").update({ status: "Retired" }).eq("status", "Active");
    await (supabase as any).from("privacy_notices").update({ status: "Active", modified_by: session?.user?.id }).eq("id", id);
    await (supabase as any).from("consent_audit_log").insert({
      actor_id: session?.user?.id,
      actor_type: "admin",
      action: "Notice Published",
      entity_type: "Notice",
      entity_id: id,
      new_state: "Active",
    });
    toast({ title: "Notice published and activated" });
    fetchNotices();
  };

  const retire = async (id: string) => {
    await (supabase as any).from("privacy_notices").update({ status: "Retired", modified_by: session?.user?.id }).eq("id", id);
    toast({ title: "Notice retired" });
    fetchNotices();
  };

  const openTranslations = async (noticeId: string) => {
    setTransNoticeId(noticeId);
    const { data } = await (supabase as any).from("notice_translations").select("*").eq("notice_id", noticeId);
    setTranslations(data || []);
    setTransOpen(true);
  };

  const saveTranslation = async () => {
    if (!transNoticeId) return;
    await (supabase as any).from("notice_translations").upsert({
      notice_id: transNoticeId,
      language: transLang,
      content: transContent,
      translation_status: transStatus,
    }, { onConflict: "notice_id,language" });
    toast({ title: "Translation saved" });
    openTranslations(transNoticeId);
    setTransContent("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Privacy Notice Manager</h1>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Create Notice</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Effective Date</TableHead>
                  <TableHead>Last Modified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.map((n: any) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.version_number}</TableCell>
                    <TableCell><Badge className={statusColor(n.status)}>{n.status}</Badge></TableCell>
                    <TableCell>{n.effective_date || "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(n.updated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(n)}>Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => { setPreviewNotice(n); setPreviewOpen(true); }}><Eye className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => openTranslations(n.id)}><Globe className="h-3 w-3" /></Button>
                        {n.status === "Draft" && <Button variant="ghost" size="sm" className="text-emerald-600" onClick={() => publish(n.id)}>Publish</Button>}
                        {n.status === "Active" && <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => retire(n.id)}>Retire</Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {notices.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No notices yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingId ? "Edit" : "Create"} Privacy Notice</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Version Number *</Label><Input value={form.version_number} onChange={(e) => setForm((f) => ({ ...f, version_number: e.target.value }))} placeholder="1.0" /></div>
              <div><Label>Effective Date</Label><Input type="date" value={form.effective_date} onChange={(e) => setForm((f) => ({ ...f, effective_date: e.target.value }))} /></div>
            </div>
            <div><Label>1. Data Fiduciary Name</Label><Input value={form.fiduciary_name} onChange={(e) => setForm((f) => ({ ...f, fiduciary_name: e.target.value }))} /></div>
            <div><Label>Contact Details</Label><Textarea value={form.fiduciary_contact} onChange={(e) => setForm((f) => ({ ...f, fiduciary_contact: e.target.value }))} rows={2} /></div>
            <div><Label>2. Categories of Personal Data (comma-separated)</Label><Input value={(form.data_categories || []).join(", ")} onChange={(e) => setForm((f) => ({ ...f, data_categories: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} /></div>
            <div><Label>3. Purposes of Processing (comma-separated)</Label><Input value={(form.purposes || []).join(", ")} onChange={(e) => setForm((f) => ({ ...f, purposes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} /></div>
            <div><Label>5. Cross-Border Transfers</Label><Textarea value={form.cross_border_transfers} onChange={(e) => setForm((f) => ({ ...f, cross_border_transfers: e.target.value }))} rows={2} /></div>
            <div><Label>9. Data Principal Rights Description</Label><Textarea value={form.rights_description} onChange={(e) => setForm((f) => ({ ...f, rights_description: e.target.value }))} rows={3} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><Label>10. Grievance Officer Name</Label><Input value={form.grievance_officer_name} onChange={(e) => setForm((f) => ({ ...f, grievance_officer_name: e.target.value }))} /></div>
              <div><Label>Designation</Label><Input value={form.grievance_officer_designation} onChange={(e) => setForm((f) => ({ ...f, grievance_officer_designation: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.grievance_officer_email} onChange={(e) => setForm((f) => ({ ...f, grievance_officer_email: e.target.value }))} /></div>
            </div>
            <div><Label>Response Timeline</Label><Input value={form.grievance_response_timeline} onChange={(e) => setForm((f) => ({ ...f, grievance_response_timeline: e.target.value }))} /></div>
            <div><Label>11. DPB Complaint Route</Label><Textarea value={form.dpb_complaint_route} onChange={(e) => setForm((f) => ({ ...f, dpb_complaint_route: e.target.value }))} rows={2} /></div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.material_change} onCheckedChange={(v) => setForm((f) => ({ ...f, material_change: !!v }))} id="material" />
              <Label htmlFor="material">Material change — trigger re-consent banner for all users</Label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={saveDraft}>Save Draft</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Notice Preview (User View)</DialogTitle></DialogHeader>
          {previewNotice && (
            <div className="prose prose-sm max-w-none text-foreground">
              <h2>Privacy Notice v{previewNotice.version_number}</h2>
              <p><strong>Data Fiduciary:</strong> {previewNotice.fiduciary_name}</p>
              <p><strong>Contact:</strong> {previewNotice.fiduciary_contact}</p>
              <h3>Categories of Personal Data</h3>
              <ul>{(previewNotice.data_categories || []).map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
              <h3>Purposes of Processing</h3>
              <ul>{(previewNotice.purposes || []).map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
              {previewNotice.cross_border_transfers && <><h3>Cross-Border Transfers</h3><p>{previewNotice.cross_border_transfers}</p></>}
              <h3>Your Rights</h3>
              <p>{previewNotice.rights_description || "You may exercise your rights under the DPDP Act 2023 via our Preference Centre."}</p>
              <h3>Grievance Officer</h3>
              <p>{previewNotice.grievance_officer_name}, {previewNotice.grievance_officer_designation}<br />Email: {previewNotice.grievance_officer_email}<br />Response within: {previewNotice.grievance_response_timeline}</p>
              <p className="text-xs text-muted-foreground">Effective: {previewNotice.effective_date || "TBD"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Translations Dialog */}
      <Dialog open={transOpen} onOpenChange={setTransOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Manage Translations</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {translations.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-sm font-medium">{t.language.toUpperCase()}</span>
                <Badge className={t.translation_status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{t.translation_status}</Badge>
              </div>
            ))}
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Language</Label>
                  <Select value={transLang} onValueChange={setTransLang}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={transStatus} onValueChange={setTransStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Under Review">Under Review</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Textarea value={transContent} onChange={(e) => setTransContent(e.target.value)} placeholder="Translated notice content..." rows={6} />
              <Button onClick={saveTranslation} className="w-full">Save Translation</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
