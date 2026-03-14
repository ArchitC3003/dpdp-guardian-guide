import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 25;
const ENTITY_TYPES = ["Consent", "Notice", "Rights Request", "Grievance", "Export", "Auth"];

const entityColor = (t: string) => {
  if (t === "Consent") return "bg-blue-100 text-blue-800";
  if (t === "Notice") return "bg-purple-100 text-purple-800";
  if (t === "Rights Request") return "bg-amber-100 text-amber-800";
  if (t === "Grievance") return "bg-red-100 text-red-800";
  return "bg-muted text-muted-foreground";
};

export default function ConsentAuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState({ entityType: "all", search: "" });

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data } = await (supabase as any).from("consent_audit_log").select("*").order("event_timestamp", { ascending: false }).limit(1000);
      setLogs(data || []);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filtered = useMemo(() => {
    let l = logs;
    if (filter.entityType !== "all") l = l.filter((x: any) => x.entity_type === filter.entityType);
    if (filter.search) l = l.filter((x: any) => (x.action || "").toLowerCase().includes(filter.search.toLowerCase()) || (x.notes || "").toLowerCase().includes(filter.search.toLowerCase()));
    return l;
  }, [logs, filter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const exportCSV = () => {
    const headers = ["Event ID", "Timestamp", "Actor", "Actor Type", "Action", "Entity Type", "Entity ID", "Previous State", "New State", "Notes"];
    const rows = filtered.map((l: any) => [l.id, l.event_timestamp, l.actor_id || "system", l.actor_type, l.action, l.entity_type, l.entity_id || "", l.previous_state || "", l.new_state || "", (l.notes || "").replace(/,/g, ";")].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Consent & Rights Audit Log</h1>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search actions..." value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
            </div>
            <Select value={filter.entityType} onValueChange={(v) => setFilter((f) => ({ ...f, entityType: v }))}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>State Change</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((l: any) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs">{new Date(l.event_timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</TableCell>
                      <TableCell className="text-xs">{l.actor_type}{l.actor_id ? ` (${l.actor_id.slice(0, 6)}...)` : ""}</TableCell>
                      <TableCell className="text-sm">{l.action}</TableCell>
                      <TableCell><Badge className={entityColor(l.entity_type)}>{l.entity_type}</Badge></TableCell>
                      <TableCell className="text-xs">
                        {l.previous_state && l.new_state ? `${l.previous_state} → ${l.new_state}` : l.new_state || "—"}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{l.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No log entries</TableCell></TableRow>}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
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
    </div>
  );
}
