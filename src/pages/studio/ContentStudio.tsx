import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABELS, TYPE_LABELS, canEditContent, canViewStudio, publicPath, isLive, type ContentStatus, type ContentType } from "@/lib/content";
import { Plus, ExternalLink, Inbox, Rss } from "lucide-react";

export default function ContentStudio() {
  const nav = useNavigate();
  const { userRole, loading: permLoading } = usePermissions();
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("content_posts").select("id,slug,title,content_type,status,published_at,updated_at,author_name")
      .order("updated_at", { ascending: false }).then(({ data }) => { setRows(data || []); setLoading(false); });
  }, []);

  if (permLoading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!canViewStudio(userRole)) return <div className="p-8"><h1 className="text-xl font-semibold">Learn studio</h1><p className="text-muted-foreground mt-2">Only Super Admins, GRC Managers and Auditors can open the content studio. <Link to="/learn" className="text-primary">Read published articles</Link>.</p></div>;
  const editable = canEditContent(userRole);
  const shown = rows.filter((r) => (status === "all" || r.status === status) && (!q || r.title.toLowerCase().includes(q.toLowerCase())));
  const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex flex-wrap justify-between gap-4 items-end">
        <div>
          <p className="font-mono text-xs uppercase text-primary">Learn</p>
          <h1 className="text-2xl font-semibold">Content studio</h1>
          <p className="text-sm text-muted-foreground">Write blogs, guides and landing pages for the public site.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><a href="/learn" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />View public site</a></Button>
          {editable && <Button variant="outline" asChild><Link to="/studio/leads"><Inbox className="h-4 w-4 mr-2" />Leads</Link></Button>}
          {editable && <Button onClick={() => nav("/studio/content/new")}><Plus className="h-4 w-4 mr-2" />New content</Button>}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(Object.keys(STATUS_LABELS) as ContentStatus[]).map((s) => (
          <button key={s} onClick={() => setStatus(status === s ? "all" : s)} className={`rounded-lg border p-3 text-left ${status === s ? "border-primary" : "border-border"} bg-card`}>
            <p className="text-xs text-muted-foreground">{STATUS_LABELS[s]}</p><p className="text-2xl font-semibold">{counts[s] || 0}</p>
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <Input placeholder="Search titles" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{(Object.keys(STATUS_LABELS) as ContentStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Title</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Updated (IST)</th><th className="p-3"></th></tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4 text-muted-foreground" colSpan={5}>Loading…</td></tr> : shown.length === 0 ? <tr><td className="p-6 text-muted-foreground" colSpan={5}>No content yet.{editable && " Create your first post."}</td></tr> :
              shown.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => nav(`/studio/content/${r.id}`)}>
                  <td className="p-3 font-medium">{r.title}<div className="font-mono text-[11px] text-muted-foreground">{publicPath(r)}</div></td>
                  <td className="p-3">{TYPE_LABELS[r.content_type as ContentType]}</td>
                  <td className="p-3"><Badge variant={isLive(r) ? "default" : "secondary"}>{STATUS_LABELS[r.status as ContentStatus]}</Badge></td>
                  <td className="p-3 text-muted-foreground">{new Date(r.updated_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="p-3">{isLive(r) && <a href={publicPath(r)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary"><ExternalLink className="h-4 w-4" /></a>}</td>
                </tr>))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-2"><Rss className="h-3 w-3" />Published content is added automatically to the sitemap, RSS feed and AI-crawler index.</p>
    </div>
  );
}
