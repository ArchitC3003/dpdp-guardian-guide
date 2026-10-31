import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Markdown } from "@/components/learn/Markdown";
import {
  STATUS_LABELS, TYPE_LABELS, SITE_URL, canEditContent, canEditPost, canPublishContent, allowedStatuses, fmtIST, canViewStudio, publicPath, readingMinutes, seoChecks, slugify,
  type ContentStatus, type ContentType, type FaqItem, type LandingBlock,
} from "@/lib/content";
import { ArrowLeft, Check, X, Sparkles, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

const EMPTY = {
  content_type: "blog" as ContentType, status: "draft" as ContentStatus, slug: "", title: "", excerpt: "", body_md: "",
  blocks: [] as LandingBlock[], faq: [] as FaqItem[], ai_summary: "", category: "", tags: [] as string[], cover_image_url: "",
  author_name: "", author_id: "" as string, category_id: "" as string, scheduled_for: null as string | null, current_version: 1, seo_title: "", seo_description: "", focus_keyword: "", canonical_url: "", og_image_url: "",
  noindex: false, featured: false, published_at: null as string | null,
};
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() + 5.5 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
};
const fromLocalInput = (v: string) => (v ? new Date(v + ":00+05:30").toISOString() : null);

export default function ContentEditor() {
  const { id } = useParams();
  const isNew = id === "new";
  const nav = useNavigate();
  const { toast } = useToast();
  const { userRole, loading: permLoading } = usePermissions();
  const [p, setP] = useState({ ...EMPTY });
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [ai, setAi] = useState<string | null>(null);
  const [versions, setVersions] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(isNew);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [lookups, setLookups] = useState<{ authors: any[]; cats: any[]; tags: any[] }>({ authors: [], cats: [], tags: [] });
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const loadVersions = (pid: string) => supabase.from("content_versions").select("id,status,created_at,version_number").eq("post_id", pid)
    .order("created_at", { ascending: false }).limit(30).then(({ data, error }) => { if (!error) setVersions(data || []); });
  const loadLookups = () => Promise.all([
    supabase.from("content_authors").select("id,name").order("name"),
    supabase.from("content_categories").select("id,name").order("name"),
    supabase.from("content_tags").select("id,name").order("name"),
  ]).then(([a, c, t]) => setLookups({ authors: a.data || [], cats: c.data || [], tags: t.data || [] }));
  useEffect(() => { loadLookups(); }, []);

  useEffect(() => {
    if (isNew) return;
    supabase.from("content_posts").select("*").eq("id", id!).maybeSingle().then(({ data, error }) => {
      if (error) toast({ title: "Could not load post", description: error.message, variant: "destructive" });
      if (data) setP({ ...EMPTY, ...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? (EMPTY as any)[k]])) } as any);
      setLoaded(true);
    });
    supabase.from("content_post_tags").select("tag_id").eq("post_id", id!).then(({ data, error }) => { if (!error) setTagIds((data || []).map((x) => x.tag_id)); });
    loadVersions(id!);
  }, [id, isNew]);

  const set = <K extends keyof typeof EMPTY>(k: K, v: (typeof EMPTY)[K]) => setP((o) => ({ ...o, [k]: v }));
  const editable = canEditPost(userRole, p.status);
  const canPublish = canPublishContent(userRole);

  if (permLoading || !loaded) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!canViewStudio(userRole)) return <p className="p-8 text-muted-foreground">You do not have access to the content studio.</p>;

  const save = async (nextStatus?: ContentStatus) => {
    const status = nextStatus || p.status;
    if (!allowedStatuses(userRole).includes(status)) return toast({ title: "Only Super Admins and GRC Managers can schedule, publish or archive", variant: "destructive" });
    if (!p.title.trim()) return toast({ title: "Add a title first", variant: "destructive" });
    const slug = slugify(p.slug || p.title);
    if (!slug) return toast({ title: "Add a valid URL slug", variant: "destructive" });
    let published_at = p.published_at;
    let scheduled_for = p.scheduled_for;
    if (status === "published" && !published_at) published_at = new Date().toISOString();
    if (status === "scheduled" && (!scheduled_for || new Date(scheduled_for) <= new Date())) return toast({ title: "Pick a future go-live time (IST) to schedule", variant: "destructive" });
    if (status === "scheduled") published_at = scheduled_for;
    setSaving(true);
    const payload = {
      ...p, id: isNew ? null : id, status, slug, published_at, scheduled_for,
      reading_minutes: readingMinutes(p.body_md + " " + p.blocks.map((b) => b.body).join(" ")),
      author_id: p.author_id || null, category_id: p.category_id || null,
    };
    const { data, error } = await supabase.rpc("rpc_save_content_post", { payload: payload as any, tag_ids: tagIds });
    setSaving(false);
    if (error || !data) {
      const msg = error?.message || "No data returned";
      return toast({ title: "Could not save", description: msg.includes("duplicate") ? "That URL slug is already used." : msg, variant: "destructive" });
    }
    const saved = data as any;
    setP((o) => ({ ...o, status: saved.status, slug: saved.slug, published_at: saved.published_at, scheduled_for: saved.scheduled_for, current_version: saved.current_version }));
    toast({ title: status === "published" ? "Published" : status === "scheduled" ? `Scheduled for ${fmtIST(saved.scheduled_for)}` : `Saved as ${STATUS_LABELS[status].toLowerCase()}` });
    if (isNew) nav(`/studio/content/${saved.id}`, { replace: true });
    else loadVersions(saved.id);
  };

  const restore = async (versionId: string) => {
    if (!confirm("Restore this version? Your current content is kept in history.")) return;
    setRestoring(versionId);
    const { data, error } = await supabase.rpc("rpc_restore_content_version", { version_id: versionId });
    setRestoring(null);
    if (error || !data) return toast({ title: "Could not restore", description: error?.message, variant: "destructive" });
    const d = data as any;
    setP({ ...EMPTY, ...Object.fromEntries(Object.entries(d).map(([k, v]) => [k, v ?? (EMPTY as any)[k]])) } as any);
    const { data: t, error: te } = await supabase.from("content_post_tags").select("tag_id").eq("post_id", d.id);
    if (!te) setTagIds((t || []).map((x) => x.tag_id));
    loadVersions(d.id);
    toast({ title: "Version restored" });
  };

  const uploadCover = async (file: File) => {
    if (!file.type.startsWith("image/")) return toast({ title: "Choose an image file", variant: "destructive" });
    if (file.size > 10 * 1024 * 1024) return toast({ title: "Image must be under 10 MB", variant: "destructive" });
    setUploading(true);
    const path = `covers/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, "")) || "cover"}.${file.name.split(".").pop()?.toLowerCase() || "jpg"}`;
    const up = await supabase.storage.from("content-media").upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { setUploading(false); return toast({ title: "Upload failed", description: up.error.message, variant: "destructive" }); }
    const signed = await supabase.storage.from("content-media").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    setUploading(false);
    if (signed.error || !signed.data?.signedUrl) return toast({ title: "Upload saved but link failed", description: signed.error?.message, variant: "destructive" });
    set("cover_image_url", signed.data.signedUrl);
    toast({ title: "Cover image added — save to keep it" });
  };

  const addLookup = async (table: "content_authors" | "content_categories" | "content_tags") => {
    const name = prompt(table === "content_authors" ? "Author name" : table === "content_categories" ? "Category name" : "Tag name")?.trim();
    if (!name) return;
    const row: any = table === "content_authors" ? { name } : { name, slug: slugify(name) };
    const { data, error } = await supabase.from(table).insert(row).select("id").single();
    if (error || !data) return toast({ title: "Could not add", description: error?.message, variant: "destructive" });
    await loadLookups();
    if (table === "content_authors") set("author_id", data.id);
    else if (table === "content_categories") set("category_id", data.id);
    else setTagIds((t) => [...t, data.id]);
    toast({ title: "Added" });
  };

  const del = async () => {
    if (!confirm("Delete this content permanently?")) return;
    const { error } = await supabase.from("content_posts").delete().eq("id", id!);
    if (error) return toast({ title: "Only Super Admins can delete", variant: "destructive" });
    nav("/studio/content");
  };

  const runAi = async (task: "outline" | "seo" | "faq" | "summary") => {
    setAi(task);
    const body = p.body_md + "\n" + p.blocks.map((b) => `${b.heading}\n${b.body}`).join("\n");
    const { data, error } = await supabase.functions.invoke("content-ai-assist", { body: { task, title: p.title, body, keyword: p.focus_keyword } });
    setAi(null);
    if (error || data?.error) return toast({ title: "AI assist failed", description: data?.error, variant: "destructive" });
    if (task === "outline") set("body_md", p.body_md ? p.body_md + "\n\n" + data.markdown : data.markdown);
    if (task === "seo") { setP((o) => ({ ...o, seo_title: data.seo_title, seo_description: data.seo_description })); }
    if (task === "faq") set("faq", data.faq || []);
    if (task === "summary") set("ai_summary", data.summary);
    toast({ title: "AI suggestion added — review before publishing" });
  };

  const checks = seoChecks({ ...p, body_md: p.body_md + " " + p.blocks.map((b) => b.body).join(" ") });
  const previewUrl = `${SITE_URL}${publicPath({ content_type: p.content_type, slug: p.slug || slugify(p.title) || "your-slug" })}`;
  const updateBlock = (i: number, patch: Partial<LandingBlock>) => set("blocks", p.blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const moveBlock = (i: number, d: number) => { const b = [...p.blocks]; const j = i + d; if (j < 0 || j >= b.length) return; [b[i], b[j]] = [b[j], b[i]]; set("blocks", b); };

  return (
    <div className="p-6 max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild><Link to="/studio/content"><ArrowLeft className="h-4 w-4 mr-1" />Studio</Link></Button>
          <span className="font-mono text-xs border border-border rounded px-2 py-1">{STATUS_LABELS[p.status]}</span>
          {!editable && <span className="text-xs text-muted-foreground">{canEditContent(userRole) ? "Read-only — ask a GRC Manager to change live or scheduled content" : "Read-only (Auditor)"}</span>}
          <span className="font-mono text-xs text-muted-foreground">v{p.current_version}</span>
        </div>
        {editable && (
          <div className="flex flex-wrap gap-2">
            {!isNew && userRole === "admin" && <Button variant="ghost" size="sm" onClick={del}><Trash2 className="h-4 w-4" /></Button>}
            <Button variant="outline" disabled={saving} onClick={() => save("draft")}>Save draft</Button>
            <Button variant="outline" disabled={saving} onClick={() => save("in_review")}>Send to review</Button>
            {canPublish && <Button variant="outline" disabled={saving} onClick={() => save("scheduled")}>Schedule</Button>}
            {canPublish && (p.status === "published" || p.status === "scheduled") && <Button variant="outline" disabled={saving} onClick={() => save("archived")}>Archive</Button>}
            {canPublish && <Button disabled={saving} onClick={() => save("published")}>{p.status === "published" ? "Update live" : "Publish now"}</Button>}
          </div>
        )}
      </div>

      <fieldset disabled={!editable} className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-[200px_1fr] gap-3">
            <Select value={p.content_type} onValueChange={(v) => set("content_type", v as ContentType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(TYPE_LABELS) as ContentType[]).map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Title" value={p.title} className="text-lg font-semibold" maxLength={200}
              onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
          </div>
          <Textarea placeholder="Short excerpt shown on cards and in search results" rows={2} maxLength={300} value={p.excerpt} onChange={(e) => set("excerpt", e.target.value)} />

          {p.content_type === "landing" ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {(["hero", "text", "benefits", "faq", "cta"] as const).map((t) => (
                  <Button key={t} type="button" variant="outline" size="sm" onClick={() => set("blocks", [...p.blocks, { type: t, heading: "", body: "" }])}><Plus className="h-3 w-3 mr-1" />{t}</Button>
                ))}
              </div>
              {p.blocks.length === 0 && <p className="text-sm text-muted-foreground border border-dashed border-border rounded-lg p-6">Add sections: a hero, benefits, FAQ and a call-to-action form.</p>}
              {p.blocks.map((b, i) => (
                <div key={i} className="border border-border rounded-lg p-4 space-y-2 bg-card">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs uppercase text-primary">{b.type}</span>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveBlock(i, -1)}><ArrowUp className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => moveBlock(i, 1)}><ArrowDown className="h-4 w-4" /></Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => set("blocks", p.blocks.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  <Input placeholder="Heading" value={b.heading} onChange={(e) => updateBlock(i, { heading: e.target.value })} />
                  <Textarea rows={b.type === "text" ? 6 : 4} value={b.body} onChange={(e) => updateBlock(i, { body: e.target.value })}
                    placeholder={b.type === "benefits" ? "One per line: Benefit title | short description" : b.type === "faq" ? "One per line: Question | Answer" : b.type === "text" ? "Markdown text" : "Supporting text"} />
                </div>
              ))}
            </div>
          ) : (
            <Tabs defaultValue="write">
              <TabsList><TabsTrigger value="write">Write</TabsTrigger><TabsTrigger value="preview">Preview</TabsTrigger></TabsList>
              <TabsContent value="write">
                <Textarea className="font-mono text-sm min-h-[520px]" value={p.body_md} onChange={(e) => set("body_md", e.target.value)}
                  placeholder={"## Section heading\n\nWrite in Markdown: **bold**, lists, > callouts, | tables |, ![image](https://...)"} />
                <p className="text-xs text-muted-foreground mt-1">{p.body_md.split(/\s+/).filter(Boolean).length} words · {readingMinutes(p.body_md)} min read</p>
              </TabsContent>
              <TabsContent value="preview"><div className="border border-border rounded-lg p-6 bg-card min-h-[520px]"><Markdown>{p.body_md || "_Nothing to preview yet._"}</Markdown></div></TabsContent>
            </Tabs>
          )}

          <div className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center"><h3 className="font-semibold text-sm">FAQ (adds FAQ schema)</h3>
              <Button type="button" size="sm" variant="ghost" onClick={() => set("faq", [...p.faq, { q: "", a: "" }])}><Plus className="h-4 w-4" /></Button></div>
            {p.faq.map((f, i) => (
              <div key={i} className="grid gap-2 border-t border-border pt-3">
                <div className="flex gap-2"><Input placeholder="Question" value={f.q} onChange={(e) => set("faq", p.faq.map((x, j) => j === i ? { ...x, q: e.target.value } : x))} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => set("faq", p.faq.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button></div>
                <Textarea rows={2} placeholder="Answer" value={f.a} onChange={(e) => set("faq", p.faq.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI assist</h3>
            <div className="grid grid-cols-2 gap-2">
              {([["outline", "Draft outline"], ["seo", "SEO title & meta"], ["faq", "Generate FAQ"], ["summary", "AI summary"]] as const).map(([t, l]) => (
                <Button key={t} type="button" size="sm" variant="outline" disabled={!!ai || !p.title} onClick={() => runAi(t)}>{ai === t ? "Working…" : l}</Button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">Suggestions are inserted as editable text. Nothing is published automatically.</p>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
            <h3 className="font-semibold text-sm">Publishing</h3>
            <div><Label className="text-xs">URL slug</Label><Input value={p.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} className="font-mono text-xs" /></div>
            {canPublish && <div><Label className="text-xs">Go-live time for scheduling (IST)</Label><Input type="datetime-local" value={toLocalInput(p.scheduled_for)} onChange={(e) => set("scheduled_for", fromLocalInput(e.target.value))} />
              {p.status === "scheduled" && <p className="text-[11px] text-muted-foreground mt-1">Goes live {fmtIST(p.scheduled_for)}</p>}
              {p.status === "published" && <p className="text-[11px] text-muted-foreground mt-1">Live since {fmtIST(p.published_at)}</p>}</div>}
            <div><div className="flex justify-between items-center"><Label className="text-xs">Author</Label>{canPublish && <button type="button" className="text-[11px] text-primary" onClick={() => addLookup("content_authors")}>+ New</button>}</div>
              <Select value={p.author_id || "none"} onValueChange={(v) => set("author_id", v === "none" ? "" : v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">PrivcybHub (no author)</SelectItem>{lookups.authors.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
            <div><div className="flex justify-between items-center"><Label className="text-xs">Category</Label>{canPublish && <button type="button" className="text-[11px] text-primary" onClick={() => addLookup("content_categories")}>+ New</button>}</div>
              <Select value={p.category_id || "none"} onValueChange={(v) => set("category_id", v === "none" ? "" : v)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="none">No category</SelectItem>{lookups.cats.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>
            <div><div className="flex justify-between items-center"><Label className="text-xs">Tags</Label>{canPublish && <button type="button" className="text-[11px] text-primary" onClick={() => addLookup("content_tags")}>+ New</button>}</div>
              <div className="flex flex-wrap gap-1 mt-1">{lookups.tags.map((t) => { const on = tagIds.includes(t.id); return (
                <button key={t.id} type="button" aria-pressed={on} onClick={() => setTagIds((x) => on ? x.filter((y) => y !== t.id) : [...x, t.id].slice(0, 12))}
                  className={`text-[11px] rounded-full border px-2 py-0.5 ${on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{t.name}</button>); })}</div></div>
            <div><Label className="text-xs">Cover image</Label>
              {p.cover_image_url && <img src={p.cover_image_url} alt="" className="rounded-md mt-1 h-28 w-full object-cover" />}
              <Input type="file" accept="image/*" disabled={uploading} className="mt-1" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }} />
              {uploading && <p className="text-[11px] text-muted-foreground">Uploading…</p>}
              <Input className="mt-1" value={p.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} placeholder="or paste https://…" /></div>
            <label className="flex items-center justify-between text-sm">Featured on Learn hub<Switch checked={p.featured} onCheckedChange={(v) => set("featured", v)} /></label>
          </div>

          <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
            <h3 className="font-semibold text-sm">SEO & AI crawling</h3>
            <div><Label className="text-xs">Focus keyword</Label><Input value={p.focus_keyword} onChange={(e) => set("focus_keyword", e.target.value)} /></div>
            <div><Label className="text-xs">SEO title ({(p.seo_title || p.title).length}/60)</Label><Input value={p.seo_title} placeholder={p.title} onChange={(e) => set("seo_title", e.target.value)} /></div>
            <div><Label className="text-xs">Meta description ({p.seo_description.length}/155)</Label><Textarea rows={3} value={p.seo_description} onChange={(e) => set("seo_description", e.target.value)} /></div>
            <div><Label className="text-xs">AI summary (shown as key takeaway, listed for AI assistants)</Label><Textarea rows={3} value={p.ai_summary} onChange={(e) => set("ai_summary", e.target.value)} /></div>
            <div><Label className="text-xs">Canonical URL (optional)</Label><Input value={p.canonical_url} placeholder={previewUrl} onChange={(e) => set("canonical_url", e.target.value)} /></div>
            <div><Label className="text-xs">Social share image URL (1200×630)</Label><Input value={p.og_image_url} onChange={(e) => set("og_image_url", e.target.value)} /></div>
            <label className="flex items-center justify-between text-sm">Hide from search engines<Switch checked={p.noindex} onCheckedChange={(v) => set("noindex", v)} /></label>
            <div className="rounded-md border border-border p-3 bg-background">
              <p className="text-[11px] text-muted-foreground truncate">{previewUrl}</p>
              <p className="text-primary text-sm font-medium truncate">{p.seo_title || p.title || "Page title"}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{p.seo_description || p.excerpt || "Meta description preview"}</p>
            </div>
            <ul className="space-y-1">{checks.map((c) => <li key={c.label} className="flex items-center gap-2 text-xs">{c.ok ? <Check className="h-3 w-3 text-primary" /> : <X className="h-3 w-3 text-destructive" />}{c.label}</li>)}</ul>
          </div>

          {versions.length > 0 && (
            <div className="border border-border rounded-lg p-4 bg-card">
              <h3 className="font-semibold text-sm mb-2">Version history</h3>
              <ul className="space-y-1 text-xs text-muted-foreground max-h-48 overflow-auto">{versions.map((v) => <li key={v.id} className="flex justify-between items-center gap-2"><span>{v.version_number ? `v${v.version_number} · ` : ""}{fmtIST(v.created_at)} — {STATUS_LABELS[v.status as ContentStatus] || v.status}</span>
                {editable && <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[11px]" disabled={!!restoring} onClick={() => restore(v.id)}>{restoring === v.id ? "…" : "Restore"}</Button>}</li>)}</ul>
            </div>
          )}
        </div>
      </fieldset>
    </div>
  );
}
