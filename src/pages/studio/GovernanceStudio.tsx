import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUp, Copy, ExternalLink, FilePlus2, History, Plus, Save, Send, Trash2, Undo2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { GovDocumentView } from "@/components/governance/GovDocumentView";
import {
  type GovDocument, type GovSection, type GovSectionType, PRESET_DOCUMENTS, SECTION_TYPES,
  bumpVersion, moveItem, newId, newSection, publicPath, publishProblems, slugify,
} from "@/lib/governance";

const table = () => supabase.from("site_governance_documents");
const statusVariant = (s: string) => (s === "published" ? "default" : s === "draft" ? "secondary" : "outline") as any;
const fmt = (d: string | null) => d ? new Date(d).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST" : "—";

export default function GovernanceStudio() {
  const { userRole, loading: permLoading } = usePermissions();
  const canPublish = userRole === "admin" || userRole === "moderator";
  const [docs, setDocs] = useState<GovDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GovDocument | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | "publish" | "withdraw" | "delete">(null);

  const load = async (keep?: string) => {
    const { data, error } = await table().select("*").order("updated_at", { ascending: false });
    if (error) toast({ title: "Could not load documents", description: error.message, variant: "destructive" });
    const list = (data as unknown as GovDocument[]) ?? [];
    setDocs(list); setLoading(false);
    const id = keep ?? selectedId;
    const found = list.find((d) => d.id === id);
    if (found) { setSelectedId(found.id); setDraft(structuredClone(found)); setDirty(false); }
  };
  useEffect(() => { if (canPublish) load(); }, [canPublish]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const groups = useMemo(() => {
    const m = new Map<string, GovDocument[]>();
    docs.forEach((d) => m.set(d.slug, [...(m.get(d.slug) ?? []), d]));
    return [...m.entries()].map(([slug, versions]) => ({
      slug, versions,
      title: versions[0].title,
      live: versions.find((v) => v.status === "published"),
      pendingDraft: versions.find((v) => v.status === "draft"),
    })).sort((a, b) => a.title.localeCompare(b.title));
  }, [docs]);

  const select = (d: GovDocument) => {
    if (dirty && !window.confirm("You have unsaved changes. Discard them?")) return;
    setSelectedId(d.id); setDraft(structuredClone(d)); setDirty(false);
  };
  const patch = (p: Partial<GovDocument>) => { setDraft((d) => d && { ...d, ...p }); setDirty(true); };
  const setSections = (fn: (s: GovSection[]) => GovSection[]) => { setDraft((d) => d && { ...d, sections: fn(d.sections) }); setDirty(true); };
  const editable = draft?.status === "draft";

  const save = async () => {
    if (!draft) return false;
    setBusy(true);
    const { error } = await table().update({
      title: draft.title, slug: draft.slug, category: draft.category, version: draft.version,
      effective_date: draft.effective_date || null, is_material_change: draft.is_material_change,
      summary_of_changes: draft.summary_of_changes, intro: draft.intro, sections: draft.sections as any,
    }).eq("id", draft.id);
    setBusy(false);
    if (error) { toast({ title: "Not saved", description: error.message.includes("slug_version") ? "That version number already exists for this document." : error.message, variant: "destructive" }); return false; }
    toast({ title: "Draft saved" }); await load(draft.id); return true;
  };

  const create = async (init: Partial<GovDocument>) => {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await table().insert({ status: "draft", created_by: u.user?.id, ...init, sections: (init.sections ?? []) as any } as any).select().single();
    setBusy(false);
    if (error) { toast({ title: "Could not create", description: error.message.includes("slug_version") ? "That document already has this version — open it instead." : error.message, variant: "destructive" }); return; }
    setNewOpen(false); setDirty(false); await load(data.id);
  };

  const newVersion = (src: GovDocument, major: boolean) => {
    const existing = docs.find((d) => d.slug === src.slug && d.status === "draft");
    if (existing) { select(existing); toast({ title: "A draft already exists", description: "Opened the existing draft for this document." }); return; }
    let v = bumpVersion(src.version, major);
    while (docs.some((d) => d.slug === src.slug && d.version === v)) v = bumpVersion(v);
    create({ slug: src.slug, title: src.title, category: src.category, version: v, intro: src.intro,
      sections: src.sections.map((s) => ({ ...s, id: newId() })), is_material_change: major, summary_of_changes: "" });
  };

  const publish = async () => {
    if (!draft) return;
    if (dirty && !(await save())) return;
    setBusy(true);
    const { error } = await supabase.rpc("rpc_publish_governance_document" as any, { doc_id: draft.id });
    setBusy(false); setConfirm(null);
    if (error) return toast({ title: "Not published", description: error.message, variant: "destructive" });
    toast({ title: "Published", description: `${draft.title} ${draft.version} is now live at ${publicPath(draft.slug)}.` });
    load(draft.id);
  };
  const withdraw = async () => {
    if (!draft) return;
    const { error } = await supabase.rpc("rpc_unpublish_governance_document" as any, { doc_id: draft.id });
    setConfirm(null);
    if (error) return toast({ title: "Not withdrawn", description: error.message, variant: "destructive" });
    toast({ title: "Withdrawn", description: "The public page now shows the built-in text, or nothing for custom documents." });
    load(draft.id);
  };
  const remove = async () => {
    if (!draft) return;
    const { error } = await table().delete().eq("id", draft.id);
    setConfirm(null);
    if (error) return toast({ title: "Not deleted", description: error.message, variant: "destructive" });
    setSelectedId(null); setDraft(null); setDirty(false); load();
  };

  if (permLoading) return <p className="p-8 text-muted-foreground">Loading…</p>;
  if (!canPublish) return <div className="p-8"><h1 className="text-xl font-semibold">Governance studio</h1><p className="text-muted-foreground mt-2">Only Super Admins and GRC Managers can manage site policies.</p></div>;

  const problems = draft ? publishProblems(draft) : [];
  const history = draft ? docs.filter((d) => d.slug === draft.slug) : [];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Governance studio</h1>
          <p className="text-sm text-muted-foreground">Draft, review and publish your Privacy Policy, Terms and other site policies.</p>
        </div>
        <Button onClick={() => setNewOpen(true)}><FilePlus2 className="h-4 w-4 mr-2" />New document</Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[17rem_1fr]">
        <aside className="space-y-2">
          {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : groups.length === 0 ? (
            <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">No documents yet. Choose <strong>New document</strong> to start with the Privacy Policy.</div>
          ) : groups.map((g) => {
            const pick = g.pendingDraft ?? g.live ?? g.versions[0];
            const active = draft?.slug === g.slug;
            return (
              <button key={g.slug} onClick={() => select(pick)} className={`w-full text-left rounded-lg border p-3 transition-colors ${active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
                <p className="font-medium text-sm">{g.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">{publicPath(g.slug)}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {g.live ? <Badge variant="default">Live {g.live.version}</Badge> : <Badge variant="outline">Not live</Badge>}
                  {g.pendingDraft && <Badge variant="secondary">Draft {g.pendingDraft.version}</Badge>}
                </div>
              </button>
            );
          })}
        </aside>

        {!draft ? (
          <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">Select a document on the left, or create a new one.</div>
        ) : (
          <div className="space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3">
              <Badge variant={statusVariant(draft.status)} className="capitalize">{draft.status}</Badge>
              <span className="text-sm font-medium">{draft.title} · {draft.version}</span>
              {dirty && <span className="text-xs text-destructive">Unsaved changes</span>}
              <div className="ml-auto flex flex-wrap gap-2">
                {editable && <Button variant="outline" size="sm" disabled={busy || !dirty} onClick={save}><Save className="h-4 w-4 mr-1" />Save draft</Button>}
                {editable && <Button size="sm" disabled={busy || problems.length > 0} onClick={() => setConfirm("publish")}><Send className="h-4 w-4 mr-1" />Publish</Button>}
                {editable && <Button variant="ghost" size="sm" onClick={() => setConfirm("delete")}><Trash2 className="h-4 w-4 mr-1" />Delete draft</Button>}
                {draft.status !== "draft" && <Button variant="outline" size="sm" onClick={() => newVersion(draft, false)}><Copy className="h-4 w-4 mr-1" />New minor version</Button>}
                {draft.status !== "draft" && <Button variant="outline" size="sm" onClick={() => newVersion(draft, true)}><Copy className="h-4 w-4 mr-1" />New major version</Button>}
                {draft.status === "published" && <Button variant="ghost" size="sm" onClick={() => setConfirm("withdraw")}><Undo2 className="h-4 w-4 mr-1" />Withdraw</Button>}
                {draft.status === "published" && <Button variant="ghost" size="sm" asChild><a href={publicPath(draft.slug)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4 mr-1" />View live</a></Button>}
              </div>
            </div>
            {!editable && <p className="text-sm text-muted-foreground">This version is {draft.status} and can't be edited. Start a new version to make changes — the live page stays as it is until you publish.</p>}

            <Tabs defaultValue="edit">
              <TabsList><TabsTrigger value="edit">Edit</TabsTrigger><TabsTrigger value="preview">Preview</TabsTrigger><TabsTrigger value="history"><History className="h-4 w-4 mr-1" />History ({history.length})</TabsTrigger></TabsList>

              <TabsContent value="edit" className="space-y-4">
                <fieldset disabled={!editable} className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2 rounded-lg border border-border p-4">
                    <div><Label>Title</Label><Input value={draft.title} onChange={(e) => patch({ title: e.target.value })} /></div>
                    <div><Label>Version</Label><Input value={draft.version} onChange={(e) => patch({ version: e.target.value })} /></div>
                    <div><Label>Effective date</Label><Input type="date" value={draft.effective_date ?? ""} onChange={(e) => patch({ effective_date: e.target.value || null })} /><p className="text-xs text-muted-foreground mt-1">Left empty, it becomes the publish date.</p></div>
                    <div><Label>Category</Label>
                      <Select value={draft.category} onValueChange={(v) => patch({ category: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="legal">Legal</SelectItem><SelectItem value="security">Security</SelectItem><SelectItem value="compliance">Compliance</SelectItem></SelectContent></Select></div>
                    <div className="md:col-span-2 flex items-center gap-3"><Switch checked={draft.is_material_change} onCheckedChange={(v) => patch({ is_material_change: v })} /><div><Label>Material change</Label><p className="text-xs text-muted-foreground">Turn on when this changes people's rights or how their data is used. A summary of changes becomes required.</p></div></div>
                    <div className="md:col-span-2"><Label>Summary of changes</Label><Textarea rows={2} value={draft.summary_of_changes ?? ""} onChange={(e) => patch({ summary_of_changes: e.target.value })} placeholder="What changed in this version? Saved in the audit log when you publish." /></div>
                    <div className="md:col-span-2"><Label>Introduction (optional)</Label><Textarea rows={3} value={draft.intro ?? ""} onChange={(e) => patch({ intro: e.target.value })} placeholder="Shown under the title, before the contents list." /></div>
                  </div>

                  {draft.sections.map((s, i) => (
                    <SectionEditor key={s.id} index={i} total={draft.sections.length} section={s}
                      onChange={(n) => setSections((all) => all.map((x) => x.id === s.id ? n : x))}
                      onMove={(d) => setSections((all) => moveItem(all, i, d))}
                      onDuplicate={() => setSections((all) => [...all.slice(0, i + 1), { ...structuredClone(s), id: newId(), heading: `${s.heading} (copy)` }, ...all.slice(i + 1)])}
                      onDelete={() => window.confirm(`Delete section "${s.heading}"?`) && setSections((all) => all.filter((x) => x.id !== s.id))} />
                  ))}

                  <div className="rounded-lg border border-dashed border-border p-4">
                    <p className="text-sm font-medium mb-2">Add a section</p>
                    <div className="flex flex-wrap gap-2">
                      {SECTION_TYPES.map((t) => <Button key={t.type} type="button" variant="outline" size="sm" title={t.hint} onClick={() => setSections((all) => [...all, newSection(t.type)])}><Plus className="h-4 w-4 mr-1" />{t.label}</Button>)}
                    </div>
                  </div>
                </fieldset>

                {editable && (problems.length > 0 ? (
                  <div className="rounded-lg border border-border p-4 text-sm"><p className="font-medium mb-1">Before you can publish</p><ul className="list-disc pl-5 text-muted-foreground">{problems.map((p) => <li key={p}>{p}</li>)}</ul></div>
                ) : <p className="text-sm text-muted-foreground">Ready to publish.</p>)}
              </TabsContent>

              <TabsContent value="preview" className="rounded-lg border border-border p-6">
                <GovDocumentView draft={draft.status === "draft"} title={draft.title} version={draft.version} effectiveDate={draft.effective_date} intro={draft.intro} sections={draft.sections} />
              </TabsContent>

              <TabsContent value="history">
                <div className="overflow-x-auto rounded-lg border border-border"><table className="w-full text-sm">
                  <thead className="bg-muted/50"><tr><th className="text-left p-2">Version</th><th className="text-left p-2">Status</th><th className="text-left p-2">Published</th><th className="text-left p-2">Changes</th><th /></tr></thead>
                  <tbody>{history.map((h) => (
                    <tr key={h.id} className="border-t border-border">
                      <td className="p-2 font-mono">{h.version}{h.is_material_change && <Badge variant="outline" className="ml-2">Material</Badge>}</td>
                      <td className="p-2"><Badge variant={statusVariant(h.status)} className="capitalize">{h.status}</Badge></td>
                      <td className="p-2 text-muted-foreground">{fmt(h.published_at)}</td>
                      <td className="p-2 text-muted-foreground">{h.summary_of_changes || "—"}</td>
                      <td className="p-2 text-right"><Button variant="ghost" size="sm" onClick={() => select(h)}>Open</Button>
                        {h.status === "archived" && <Button variant="ghost" size="sm" onClick={() => newVersion(h, false)}>Restore as draft</Button>}</td>
                    </tr>))}</tbody></table></div>
                <p className="text-xs text-muted-foreground mt-2">Every publish and withdrawal is also recorded in the <Link to="/consent/audit-log" className="text-primary">Audit Log</Link>.</p>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      <NewDocumentDialog open={newOpen} onOpenChange={setNewOpen} busy={busy} existing={groups.map((g) => g.slug)} onCreate={create} />

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "publish" ? `Publish ${draft?.title} ${draft?.version}?` : confirm === "withdraw" ? "Withdraw this document?" : "Delete this draft?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "publish" && `It goes live at ${draft ? publicPath(draft.slug) : ""} straight away and replaces the current live version, which is kept in history.`}
              {confirm === "withdraw" && "The live page stops showing this version. Privacy and Terms fall back to the built-in text; other documents stop being available."}
              {confirm === "delete" && "This draft is removed permanently. Published and archived versions are not affected."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); confirm === "publish" ? publish() : confirm === "withdraw" ? withdraw() : remove(); }}>
              {confirm === "publish" ? "Publish" : confirm === "withdraw" ? "Withdraw" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function NewDocumentDialog({ open, onOpenChange, busy, existing, onCreate }: { open: boolean; onOpenChange: (o: boolean) => void; busy: boolean; existing: string[]; onCreate: (d: Partial<GovDocument>) => void }) {
  const [title, setTitle] = useState(""); const [slug, setSlug] = useState(""); const [touched, setTouched] = useState(false);
  const free = PRESET_DOCUMENTS.filter((p) => !existing.includes(p.slug));
  const finalSlug = touched ? slug : slugify(title);
  const taken = existing.includes(finalSlug);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New document</DialogTitle></DialogHeader>
        {free.length > 0 && <div className="space-y-2"><p className="text-sm font-medium">Start one of these</p><div className="flex flex-wrap gap-2">
          {free.map((p) => <Button key={p.slug} variant="outline" size="sm" disabled={busy} onClick={() => onCreate({ slug: p.slug, title: p.title, category: p.category, version: "v1.0", sections: [newSection("markdown")] })}>{p.title}</Button>)}
        </div></div>}
        <div className="space-y-3 border-t border-border pt-3">
          <p className="text-sm font-medium">Or create your own</p>
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Refund Policy" /></div>
          <div><Label>Web address</Label><div className="flex items-center gap-1"><span className="text-sm text-muted-foreground font-mono">/policies/</span><Input value={finalSlug} onChange={(e) => { setTouched(true); setSlug(slugify(e.target.value)); }} /></div>
            {taken && <p className="text-xs text-destructive mt-1">A document already uses this address.</p>}</div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
          <Button disabled={busy || !title.trim() || !finalSlug || taken} onClick={() => onCreate({ slug: finalSlug, title: title.trim(), category: "legal", version: "v1.0", sections: [newSection("markdown")] })}>Create draft</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type SEProps = { section: GovSection; index: number; total: number; onChange: (s: GovSection) => void; onMove: (d: number) => void; onDuplicate: () => void; onDelete: () => void };

function SectionEditor({ section: s, index, total, onChange, onMove, onDuplicate, onDelete }: SEProps) {
  const label = SECTION_TYPES.find((t) => t.type === s.type)?.label;
  const set = (p: Partial<GovSection>) => onChange({ ...s, ...p } as GovSection);
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-muted-foreground">{index + 1}</span>
        <Badge variant="outline">{label}</Badge>
        <Input className="flex-1 min-w-[12rem] font-medium" value={s.heading} onChange={(e) => set({ heading: e.target.value })} placeholder="Section heading" />
        <div className="flex gap-1">
          <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Move down" disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Duplicate" onClick={onDuplicate}><Copy className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Delete section" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {s.type === "markdown" && <><Textarea rows={8} value={s.body} onChange={(e) => set({ body: e.target.value })} placeholder="Write the text. **bold**, *italic*, [link](https://…), - bullet, ### subheading" />
        <p className="text-xs text-muted-foreground">Formatting: **bold**, *italic*, [link text](https://…), lines starting with "- " become bullets, "### " a subheading.</p></>}

      {s.type === "callout" && <>
        <Select value={s.tone} onValueChange={(v) => set({ tone: v as any })}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="info">Information</SelectItem><SelectItem value="warning">Warning</SelectItem></SelectContent></Select>
        <Textarea rows={3} value={s.body} onChange={(e) => set({ body: e.target.value })} placeholder="e.g. AI-generated drafts are not legal advice." /></>}

      {(s.type === "list" || s.type === "key_value" || s.type === "table") &&
        <Input value={s.note ?? ""} onChange={(e) => set({ note: e.target.value })} placeholder="Optional line of text above the content" />}

      {s.type === "list" && <div className="space-y-2">
        {s.items.map((it, i) => <div key={i} className="flex gap-2"><Input value={it} onChange={(e) => set({ items: s.items.map((x, j) => j === i ? e.target.value : x) })} placeholder={`Point ${i + 1}`} />
          <Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => set({ items: moveItem(s.items, i, -1) })}><ArrowUp className="h-4 w-4" /></Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Remove point" onClick={() => set({ items: s.items.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button></div>)}
        <Button type="button" variant="outline" size="sm" onClick={() => set({ items: [...s.items, ""] })}><Plus className="h-4 w-4 mr-1" />Add point</Button>
      </div>}

      {s.type === "key_value" && <div className="space-y-2">
        {s.fields.map((f, i) => <div key={i} className="grid gap-2 sm:grid-cols-[12rem_1fr_auto]">
          <Input value={f.label} onChange={(e) => set({ fields: s.fields.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} placeholder="Label, e.g. Email" />
          <Input value={f.value} onChange={(e) => set({ fields: s.fields.map((x, j) => j === i ? { ...x, value: e.target.value } : x) })} placeholder="Value" />
          <div className="flex"><Button type="button" variant="ghost" size="icon" aria-label="Move up" disabled={i === 0} onClick={() => set({ fields: moveItem(s.fields, i, -1) })}><ArrowUp className="h-4 w-4" /></Button>
            <Button type="button" variant="ghost" size="icon" aria-label="Remove field" onClick={() => set({ fields: s.fields.filter((_, j) => j !== i) })}><X className="h-4 w-4" /></Button></div></div>)}
        <Button type="button" variant="outline" size="sm" onClick={() => set({ fields: [...s.fields, { label: "", value: "" }] })}><Plus className="h-4 w-4 mr-1" />Add field</Button>
      </div>}

      {s.type === "table" && <div className="space-y-2 overflow-x-auto">
        <table className="text-sm"><thead><tr>
          {s.columns.map((c, ci) => <th key={ci} className="p-1"><div className="flex gap-1">
            <Input className="min-w-[9rem] font-medium" value={c} onChange={(e) => set({ columns: s.columns.map((x, j) => j === ci ? e.target.value : x) })} />
            <Button type="button" variant="ghost" size="icon" aria-label="Remove column" disabled={s.columns.length === 1} onClick={() => set({ columns: s.columns.filter((_, j) => j !== ci), rows: s.rows.map((r) => r.filter((_, j) => j !== ci)) })}><X className="h-4 w-4" /></Button></div></th>)}
          <th /></tr></thead>
          <tbody>{s.rows.map((r, ri) => <tr key={ri}>
            {s.columns.map((_, ci) => <td key={ci} className="p-1"><Textarea rows={1} className="min-w-[9rem] min-h-9" value={r[ci] ?? ""} onChange={(e) => set({ rows: s.rows.map((row, j) => j === ri ? s.columns.map((__, k) => k === ci ? e.target.value : row[k] ?? "") : row) })} /></td>)}
            <td className="p-1 whitespace-nowrap"><Button type="button" variant="ghost" size="icon" aria-label="Move row up" disabled={ri === 0} onClick={() => set({ rows: moveItem(s.rows, ri, -1) })}><ArrowUp className="h-4 w-4" /></Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Remove row" onClick={() => set({ rows: s.rows.filter((_, j) => j !== ri) })}><X className="h-4 w-4" /></Button></td></tr>)}</tbody></table>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => set({ rows: [...s.rows, s.columns.map(() => "")] })}><Plus className="h-4 w-4 mr-1" />Add row</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => set({ columns: [...s.columns, `Column ${s.columns.length + 1}`], rows: s.rows.map((r) => [...r, ""]) })}><Plus className="h-4 w-4 mr-1" />Add column</Button>
        </div>
      </div>}
    </div>
  );
}
