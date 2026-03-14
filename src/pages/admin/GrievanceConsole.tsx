import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 25;
const STATUSES = ["Submitted", "Acknowledged", "Under Investigation", "Resolved", "Escalated to DPB"];

const statusColor = (s: string) => {
  if (s === "Resolved") return "bg-emerald-100 text-emerald-800";
  if (s === "Escalated to DPB") return "bg-red-100 text-red-800";
  if (s === "Under Investigation") return "bg-blue-100 text-blue-800";
  if (s === "Acknowledged") return "bg-amber-100 text-amber-800";
  return "bg-muted text-muted-foreground";
};

export default function GrievanceConsole() {
  const { session } = useAuth();
  const [grievances, setGrievances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<any>(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [resolution, setResolution] = useState("");

  useEffect(() => { fetchGrievances(); }, []);

  const fetchGrievances = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("grievances").select("*").order("submitted_at", { ascending: false });
    setGrievances(data || []);
    setLoading(false);
  };

  const paged = grievances.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(grievances.length / PAGE_SIZE);

  const slaInfo = (g: any) => {
    if (["Resolved", "Escalated to DPB"].includes(g.status)) return { label: "—", color: "" };
    const deadline = g.status === "Submitted" ? g.sla_deadline_ack : g.sla_deadline_resolution;
    const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return { label: "Overdue", color: "text-destructive font-bold" };
    if (daysLeft <= 2) return { label: `${daysLeft}d left`, color: "text-amber-600" };
    return { label: `${daysLeft}d left`, color: "text-muted-foreground" };
  };

  const updateGrievance = async () => {
    if (!selected || !statusUpdate) return;
    const updates: any = { status: statusUpdate, updated_at: new Date().toISOString() };
    if (statusUpdate === "Acknowledged") updates.acknowledged_at = new Date().toISOString();
    if (statusUpdate === "Resolved") { updates.resolved_at = new Date().toISOString(); updates.resolution_summary = resolution; }
    if (internalNote) updates.internal_notes = (selected.internal_notes || "") + `\n[${new Date().toISOString()}] ${internalNote}`;

    await (supabase as any).from("grievances").update(updates).eq("id", selected.id);
    await (supabase as any).from("consent_audit_log").insert({
      actor_id: session?.user?.id,
      actor_type: "admin",
      action: `Grievance status changed to ${statusUpdate}`,
      entity_type: "Grievance",
      entity_id: selected.id,
      previous_state: selected.status,
      new_state: statusUpdate,
    });
    toast({ title: "Grievance updated" });
    setSelected(null); setStatusUpdate(""); setInternalNote(""); setResolution("");
    fetchGrievances();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Grievance Console</h1>

      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grievance ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Nature</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((g: any) => {
                    const sla = slaInfo(g);
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-mono text-xs">{g.id.slice(0, 8)}...</TableCell>
                        <TableCell className="text-sm">{g.user_email}</TableCell>
                        <TableCell className="text-xs">{g.nature}</TableCell>
                        <TableCell className="text-xs">{new Date(g.submitted_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</TableCell>
                        <TableCell><Badge className={statusColor(g.status)}>{g.status}</Badge></TableCell>
                        <TableCell className={`text-xs ${sla.color}`}>{sla.label}</TableCell>
                        <TableCell><Button variant="ghost" size="sm" onClick={() => { setSelected(g); setStatusUpdate(g.status); }}>View</Button></TableCell>
                      </TableRow>
                    );
                  })}
                  {paged.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No grievances</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">{grievances.length} records</span>
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Grievance Detail</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="text-sm space-y-1">
                <p><strong>ID:</strong> {selected.id}</p>
                <p><strong>Email:</strong> {selected.user_email}</p>
                <p><strong>Subject:</strong> {selected.subject}</p>
                <p><strong>Nature:</strong> {selected.nature}</p>
                <p><strong>Description:</strong> {selected.description}</p>
                <p><strong>Submitted:</strong> {new Date(selected.submitted_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                <p><strong>Ack SLA:</strong> {new Date(selected.sla_deadline_ack).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
                <p><strong>Resolution SLA:</strong> {new Date(selected.sla_deadline_resolution).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
              </div>
              <div>
                <Label>Update Status</Label>
                <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {statusUpdate === "Resolved" && (
                <div><Label>Resolution Summary</Label><Textarea value={resolution} onChange={(e) => setResolution(e.target.value)} /></div>
              )}
              <div><Label>Internal Note</Label><Textarea value={internalNote} onChange={(e) => setInternalNote(e.target.value)} placeholder="Admin-only notes..." /></div>
              {selected.internal_notes && (
                <div className="bg-muted/30 p-2 rounded text-xs whitespace-pre-wrap">{selected.internal_notes}</div>
              )}
              <Button onClick={updateGrievance} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Save & Update</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
