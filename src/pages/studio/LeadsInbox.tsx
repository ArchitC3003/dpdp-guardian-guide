import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { canEditContent } from "@/lib/content";
import { ArrowLeft, Download } from "lucide-react";

const STATUSES = ["new", "contacted", "qualified", "closed"];
const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`;

export default function LeadsInbox() {
  const { userRole, loading: permLoading } = usePermissions();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("marketing_leads").select("*").order("created_at", { ascending: false }).limit(1000)
      .then(({ data }) => { setRows(data || []); setLoading(false); });
  }, []);
  if (permLoading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!canEditContent(userRole)) return <p className="p-8 text-muted-foreground">Only Super Admins and GRC Managers can view leads.</p>;

  const setStatus = async (id: string, status: string) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    await supabase.from("marketing_leads").update({ status }).eq("id", id);
  };
  const exportCsv = () => {
    const cols = ["created_at", "lead_type", "name", "email", "organisation", "message", "source_slug", "status", "consent_at", "consent_text"];
    const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `privcybhub-leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  };

  return (
    <div className="p-6 max-w-6xl space-y-5">
      <div className="flex justify-between items-end flex-wrap gap-3">
        <div><Button variant="ghost" size="sm" asChild><Link to="/studio/content"><ArrowLeft className="h-4 w-4 mr-1" />Studio</Link></Button>
          <h1 className="text-2xl font-semibold mt-1">Leads & subscribers</h1>
          <p className="text-sm text-muted-foreground">From forms on articles and landing pages. Each entry stores the consent text and time.</p></div>
        <Button variant="outline" onClick={exportCsv} disabled={!rows.length}><Download className="h-4 w-4 mr-2" />Export CSV</Button>
      </div>
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Received (IST)</th><th className="p-3">Type</th><th className="p-3">Contact</th><th className="p-3">Message</th><th className="p-3">Source</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="p-4 text-muted-foreground">Loading…</td></tr> : rows.length === 0 ? <tr><td colSpan={6} className="p-6 text-muted-foreground">No leads yet.</td></tr> :
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="p-3 capitalize">{r.lead_type}</td>
                  <td className="p-3"><div className="font-medium">{r.name || "—"}</div><div className="text-muted-foreground">{r.email}</div><div className="text-xs text-muted-foreground">{r.organisation}</div></td>
                  <td className="p-3 max-w-xs text-muted-foreground">{r.message}</td>
                  <td className="p-3 font-mono text-xs">{r.source_slug}</td>
                  <td className="p-3"><Select value={r.status} onValueChange={(v) => setStatus(r.id, v)}><SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select></td>
                </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
