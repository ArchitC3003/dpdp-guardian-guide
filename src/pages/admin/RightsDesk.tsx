import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, CheckCircle2, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 25;
const STATUSES = ["Submitted", "Under Review", "Pending Info", "In Progress", "Completed", "Rejected"];

const statusColor = (s: string) => {
  if (s === "Completed") return "bg-emerald-100 text-emerald-800";
  if (s === "Rejected") return "bg-red-100 text-red-800";
  if (s === "In Progress" || s === "Under Review") return "bg-blue-100 text-blue-800";
  if (s === "Pending Info") return "bg-amber-100 text-amber-800";
  return "bg-muted text-muted-foreground";
};

const slaStatus = (deadline: string) => {
  const d = new Date(deadline);
  const now = new Date();
  const daysLeft = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return { label: "Overdue", color: "text-destructive font-bold" };
  if (daysLeft <= 5) return { label: `${daysLeft}d left`, color: "text-amber-600 font-medium" };
  return { label: `${daysLeft}d left`, color: "text-muted-foreground" };
};

export default function RightsDesk() {
  const { session } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [reason, setReason] = useState("");
  const [response, setResponse] = useState("");
  const [internalNote, setInternalNote] = useState("");

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("rights_requests").select("*").order("submitted_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  // Metrics
  const metrics = useMemo(() => {
    const open = requests.filter((r: any) => !["Completed", "Rejected"].includes(r.status));
    const overdue = open.filter((r: any) => new Date(r.sla_deadline) < new Date());
    const completed = requests.filter((r: any) => r.status === "Completed" && r.completed_at);
    const avgDays = completed.length > 0
      ? (completed.reduce((a: number, r: any) => a + (new Date(r.completed_at).getTime() - new Date(r.submitted_at).getTime()) / (1000 * 60 * 60 * 24), 0) / completed.length).toFixed(1)
      : "—";
    const byType: Record<string, number> = {};
    requests.forEach((r: any) => { byType[r.request_type] = (byType[r.request_type] || 0) + 1; });
    return { openCount: open.length, overdueCount: overdue.length, avgDays, byType };
  }, [requests]);

  const paged = requests.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(requests.length / PAGE_SIZE);

  const updateStatus = async () => {
    if (!selected || !statusUpdate) return;
    const updates: any = { status: statusUpdate, updated_at: new Date().toISOString() };
    if (statusUpdate === "Completed") updates.completed_at = new Date().toISOString();
    if (statusUpdate === "Rejected") updates.rejection_reason = reason;
    if (internalNote) updates.internal_notes = (selected.internal_notes || "") + `\n[${new Date().toISOString()}] ${internalNote}`;
    if (statusUpdate === "Completed" && response) updates.resolution_summary = response;

    await (supabase as any).from("rights_requests").update(updates).eq("id", selected.id);
    await (supabase as any).from("consent_audit_log").insert({
      actor_id: session?.user?.id,
      actor_type: "admin",
      action: `Rights request status changed to ${statusUpdate}`,
      entity_type: "Rights Request",
      entity_id: selected.id,
      previous_state: selected.status,
      new_state: statusUpdate,
    });
    toast({ title: "Request updated" });
    setSelected(null);
    setStatusUpdate(""); setReason(""); setResponse(""); setInternalNote("");
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Data Principal Rights Desk</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Clock className="h-6 w-6 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{metrics.openCount}</p>
          <p className="text-xs text-muted-foreground">Open Requests</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto text-destructive mb-1" />
          <p className="text-2xl font-bold text-destructive">{metrics.overdueCount}</p>
          <p className="text-xs text-muted-foreground">Overdue</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-500 mb-1" />
          <p className="text-2xl font-bold">{metrics.avgDays}</p>
          <p className="text-xs text-muted-foreground">Avg Closure (days)</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold">{Object.keys(metrics.byType).length}</p>
          <p className="text-xs text-muted-foreground">Request Types</p>
          <div className="flex flex-wrap gap-1 mt-1 justify-center">
            {Object.entries(metrics.byType).map(([k, v]) => (
              <Badge key={k} variant="outline" className="text-[9px]">{k.split("(")[0].trim()}: {v}</Badge>
            ))}
          </div>
        </CardContent></Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((r: any) => {
                    const sla = slaStatus(r.sla_deadline);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{r.user_email}</TableCell>
                        <TableCell className="text-xs">{r.request_type.split("(")[0].trim()}</TableCell>
                        <TableCell className="text-xs">{new Date(r.submitted_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</TableCell>
                        <TableCell><Badge className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                        <TableCell className={`text-xs ${sla.color}`}>{!["Completed", "Rejected"].includes(r.status) ? sla.label : "—"}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelected(r); setStatusUpdate(r.status); }}>View</Button></TableCell>
                      </TableRow>
                    );
                  })}
                  {paged.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No requests</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">{requests.length} records</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm text-muted-foreground py-1">Page {page + 1} of {totalPages || 1}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Rights Request Detail</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><strong>ID:</strong> {selected.id}</p>
                <p><strong>Email:</strong> {selected.user_email}</p>
                <p><strong>Type:</strong> {selected.request_type}</p>
                <p><strong>Description:</strong> {selected.description}</p>
                <p><strong>Submitted:</strong> {new Date(selected.submitted_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                <p><strong>SLA Deadline:</strong> {new Date(selected.sla_deadline).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
              </div>
              <div>
                <Label>Update Status</Label>
                <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {statusUpdate === "Rejected" && (
                <div><Label>Rejection Reason *</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
              )}
              {statusUpdate === "Completed" && (
                <div><Label>Resolution Summary</Label><Textarea value={response} onChange={(e) => setResponse(e.target.value)} /></div>
              )}
              <div><Label>Internal Note</Label><Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Admin-only notes..." /></div>
              {selected.internal_notes && (
                <div className="bg-muted/30 p-2 rounded text-xs whitespace-pre-wrap">{selected.internal_notes}</div>
              )}
              <Button onClick={updateStatus} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Save & Update</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
