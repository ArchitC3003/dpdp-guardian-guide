import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATUS_LABELS, TYPE_LABELS, canEditContent, canPublishContent, canViewStudio, publicPath, isLive, fmtIST, type ContentStatus, type ContentType } from "@/lib/content";
import { Plus, ExternalLink, Inbox, Rss } from "lucide-react";

export default function ContentStudio() {
  const nav = useNavigate();
  const { userRole, loading: permLoading } = usePermissions();
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [cat, setCat] = useState("all");
  const [author, setAuthor] = useState("all");
  const [cats, setCats] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("content_posts").select("id,slug,title,content_type,status,published_at,scheduled_for,updated_at,author_name,author_id,category_id")
      .order("updated_at", { ascending: false }).then(({ data, error }) => {
        if (error) setLoadError(error.message); else setRows(data || []);
        setLoading(false);
      });
    supabase.from("content_categories").select("id,name").order("name").then(({ data, error }) => { if (!error) setCats(data || []); });
    supabase.from("content_authors").select("id,name").order("name").then(({ data, error }) => { if (!error) setAuthors(data || []); });
  }, []);

  if (permLoading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!canViewStudio(userRole)) return <div className="p-8"><h1 className="text-xl font-semibold">Learn studio</h1><p className="text-muted-foreground mt-2">Only Super Admins, GRC Managers, Reviewers and Auditors can open the content studio. <Link to="/learn" className="text-primary">Read published articles</Link>.</p></div>;
  const editable = canEditContent(userRole);
  const canPublish = canPublishContent(userRole);
  const shown = rows.filter((r) => (status === "all" || r.status === status) && (type === "all" || r.content_type === type)
    && (cat === "all" || r.category_id === cat) && (author === "all" || r.author_id === author) && (!q || r.title.toLowerCase().includes(q.toLowerCase())));
  const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex flex-wrap justify-between gap-4 items-end">
        <div>
          <p className="font-mono text-xs uppercase text-primary">Learn</p>
          <h1 className="text-2xl font-semibold">Content studio</h1>
          <p className="text-sm text-muted-foreground">Write blogs, guides and landing pages for the public site.{!editable ? " You have read-only access." : !canPublish ? " You can write drafts and send them for review." : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><a href="/learn" target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-2" />View public site</a></Button>
          {canPublish && <Button variant="outline" asChild><Link to="/studio/leads"><Inbox className="h-4 w-4 mr-2" />Leads</Link></Button>}
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
      <div className="flex flex-wrap gap-3">
        <Input placeholder="Search titles" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All statuses</SelectItem>{(Object.keys(STATUS_LABELS) as ContentStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}</SelectContent></Select>
        <Select value={type} onValueChange={setType}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All types</SelectItem>{(Object.keys(TYPE_LABELS) as ContentType[]).map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}</SelectContent></Select>
        <Select value={cat} onValueChange={setCat}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All categories</SelectItem>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={author} onValueChange={setAuthor}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All authors</SelectItem>{authors.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
      </div>
      {loadError && <p className="text-sm text-destructive">Could not load content: {loadError}</p>}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left"><tr><th className="p-3">Title</th><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Author</th><th className="p-3">Go-live / updated</th><th className="p-3"></th></tr></thead>
          <tbody>
            {loading ? <tr><td className="p-4 text-muted-foreground" colSpan={6}>Loading…</td></tr> : shown.length === 0 ? <tr><td className="p-6 text-muted-foreground" colSpan={6}>No content yet.{editable && " Create your first post."}</td></tr> :
              shown.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => nav(`/studio/content/${r.id}`)}>
                  <td className="p-3 font-medium">{r.title}<div className="font-mono text-[11px] text-muted-foreground">{publicPath(r)}</div></td>
                  <td className="p-3">{TYPE_LABELS[r.content_type as ContentType]}</td>
                  <td className="p-3"><Badge variant={isLive(r) ? "default" : "secondary"}>{STATUS_LABELS[r.status as ContentStatus]}</Badge></td>
                  <td className="p-3 text-muted-foreground">{r.author_name || "—"}</td>
                  <td className="p-3 text-muted-foreground text-xs">{r.status === "scheduled" ? <>Goes live {fmtIST(r.scheduled_for)}</> : r.status === "published" ? <>Live {fmtIST(r.published_at)}</> : <>Updated {fmtIST(r.updated_at)}</>}</td>
                  <td className="p-3">{isLive(r) && <a href={publicPath(r)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-primary"><ExternalLink className="h-4 w-4" /></a>}</td>
                </tr>))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground flex items-center gap-2"><Rss className="h-3 w-3" />Published content is added automatically to the sitemap, RSS feed and AI-crawler index.</p>
    </div>
  );
}
