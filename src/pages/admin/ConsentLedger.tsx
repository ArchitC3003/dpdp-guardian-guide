import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 25;

export default function ConsentLedger() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState({ actionType: "all", search: "", status: "all" });
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("consent_receipts").select("*").order("consent_timestamp", { ascending: false }).limit(1000);
    setReceipts(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let r = receipts;
    if (filter.actionType !== "all") r = r.filter((x: any) => x.action_type === filter.actionType);
    if (filter.status === "active") r = r.filter((x: any) => !x.withdrawal_timestamp);
    if (filter.status === "withdrawn") r = r.filter((x: any) => x.withdrawal_timestamp);
    if (filter.search) r = r.filter((x: any) => (x.id || "").includes(filter.search) || (x.user_id || "").includes(filter.search) || (x.session_id || "").includes(filter.search));
    return r;
  }, [receipts, filter]);

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const exportCSV = () => {
    const headers = ["Consent ID", "User/Session", "Action Type", "Notice Version", "Categories Accepted", "Categories Rejected", "Timestamp", "Withdrawal"];
    const rows = filtered.map((r: any) => [r.id, r.user_id || r.session_id, r.action_type, r.notice_version_id || "", (r.categories_accepted || []).join(";"), (r.categories_rejected || []).join(";"), r.consent_timestamp, r.withdrawal_timestamp || ""].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `consent-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const actionColor = (t: string) => {
    if (t === "accept_all") return "bg-emerald-100 text-emerald-800";
    if (t === "reject_all") return "bg-red-100 text-red-800";
    if (t === "withdrawn") return "bg-red-200 text-red-900";
    if (t === "updated") return "bg-blue-100 text-blue-800";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Consent Ledger</h1>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Export CSV</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by ID..." value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
            </div>
            <Select value={filter.actionType} onValueChange={(v) => setFilter((f) => ({ ...f, actionType: v }))}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="accept_all">Accept All</SelectItem>
                <SelectItem value="reject_all">Reject All</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="updated">Updated</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filter.status} onValueChange={(v) => setFilter((f) => ({ ...f, status: v }))}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consent ID</TableHead>
                    <TableHead>User/Session</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Categories Accepted</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((r: any) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(r)}>
                      <TableCell className="font-mono text-xs">{r.id.slice(0, 8)}...</TableCell>
                      <TableCell className="font-mono text-xs">{(r.user_id || r.session_id || "").slice(0, 8)}...</TableCell>
                      <TableCell><Badge className={actionColor(r.action_type)}>{r.action_type}</Badge></TableCell>
                      <TableCell className="text-xs">{(r.categories_accepted || []).join(", ")}</TableCell>
                      <TableCell className="text-xs">{new Date(r.consent_timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</TableCell>
                      <TableCell>
                        <Badge variant={r.withdrawal_timestamp ? "destructive" : "default"}>
                          {r.withdrawal_timestamp ? "Withdrawn" : "Active"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paged.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No records found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-muted-foreground">{filtered.length} records</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground py-1">Page {page + 1} of {totalPages || 1}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Consent Receipt Detail</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p><strong>ID:</strong> {selected.id}</p>
              <p><strong>User ID:</strong> {selected.user_id || "Anonymous"}</p>
              <p><strong>Session ID:</strong> {selected.session_id || "N/A"}</p>
              <p><strong>Action:</strong> {selected.action_type}</p>
              <p><strong>Notice Version:</strong> {selected.notice_version_id || "N/A"}</p>
              <p><strong>Accepted:</strong> {(selected.categories_accepted || []).join(", ") || "None"}</p>
              <p><strong>Rejected:</strong> {(selected.categories_rejected || []).join(", ") || "None"}</p>
              <p><strong>Timestamp:</strong> {new Date(selected.consent_timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
              <p><strong>Withdrawal:</strong> {selected.withdrawal_timestamp ? new Date(selected.withdrawal_timestamp).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "N/A"}</p>
              <p><strong>User Agent:</strong> {selected.user_agent || "N/A"}</p>
              <p><strong>Language:</strong> {selected.banner_language}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
