import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Pencil,
  ClipboardList,
  History,
  Eye,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { exportToDOCX, exportToPDF, ExportDocument } from "@/utils/exportUtils";

interface PolicyDoc {
  id: string;
  title: string;
  document_type: string;
  document_ref: string;
  current_version: string;
  status: string;
  classification: string;
  selected_frameworks: string[] | null;
  industry_vertical: string | null;
  org_size: string | null;
  maturity_level: number | null;
  owner_name: string | null;
  effective_date: string | null;
  review_date: string | null;
  created_at: string;
  updated_at: string;
}

interface Version {
  id: string;
  version: string;
  content: string;
  change_summary: string | null;
  generated_by: string;
  created_at: string;
  is_current: boolean;
}

interface AuditEntry {
  id: string;
  action: string;
  action_detail: string | null;
  performed_by_name: string | null;
  performed_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  "Under Review": "border-orange-500/40 text-orange-400 bg-orange-500/10",
  Approved: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  Published: "border-primary/40 text-primary bg-primary/10",
  Retired: "border-muted-foreground/40 text-muted-foreground bg-muted/20",
};

const ACTION_COLORS: Record<string, string> = {
  Created: "bg-primary/20 text-primary",
  Updated: "bg-blue-500/20 text-blue-400",
  "Status Changed": "bg-orange-500/20 text-orange-400",
  Exported: "bg-purple-500/20 text-purple-400",
  Regenerated: "bg-primary/20 text-primary",
};

const STATUS_OPTIONS = ["Draft", "Under Review", "Approved", "Published", "Retired"];

interface Props {
  doc: PolicyDoc;
  open: boolean;
  onClose: () => void;
  onExport: (doc: PolicyDoc, format: "DOCX" | "PDF") => void;
  onRefresh: () => void;
}

export default function PolicyDetailSlideOver({ doc, open, onClose, onExport, onRefresh }: Props) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("document");
  const [content, setContent] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(doc.status);

  useEffect(() => {
    if (!open) return;
    setStatus(doc.status);
    loadContent();
  }, [open, doc.id]);

  const loadContent = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("policy_versions")
      .select("*")
      .eq("document_id", doc.id)
      .eq("is_current", true)
      .maybeSingle();
    setContent(data?.content ?? null);
    setLoading(false);
  };

  const loadVersions = async () => {
    const { data } = await supabase
      .from("policy_versions")
      .select("*")
      .eq("document_id", doc.id)
      .order("created_at", { ascending: false });
    setVersions((data as Version[]) ?? []);
  };

  const loadAudit = async () => {
    const { data } = await supabase
      .from("policy_audit_log")
      .select("*")
      .eq("document_id", doc.id)
      .order("performed_at", { ascending: false });
    setAudit((data as AuditEntry[]) ?? []);
  };

  const handleTabChange = (val: string) => {
    setTab(val);
    if (val === "versions") loadVersions();
    if (val === "audit") loadAudit();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;
    const oldStatus = status;
    await supabase.from("policy_documents").update({ status: newStatus }).eq("id", doc.id);
    await supabase.from("policy_audit_log").insert({
      document_id: doc.id,
      action: "Status Changed",
      action_detail: `${oldStatus} → ${newStatus}`,
      performed_by: user.id,
      performed_by_name: profile?.full_name ?? user.email,
    });
    setStatus(newStatus);
    toast.success(`Status changed to ${newStatus}`);
    onRefresh();
  };

  const viewVersion = (vContent: string) => {
    setContent(vContent);
    setTab("document");
  };

  const frameworks = doc.selected_frameworks ?? [];

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-3 pb-4">
          <SheetTitle className="text-lg">{doc.title}</SheetTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[9px] font-mono">{doc.document_ref}</Badge>
            <Badge variant="outline" className="text-[9px]">v{doc.current_version}</Badge>
            <Badge variant="outline" className={cn("text-[9px]", STATUS_COLORS[status])}>{status}</Badge>
            <Badge variant="outline" className="text-[9px] capitalize">{doc.classification}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {frameworks.map((fw) => (
              <Badge key={fw} variant="outline" className="text-[8px] border-primary/30 text-primary">{fw}</Badge>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[10px] text-muted-foreground">
            <span>Industry: {doc.industry_vertical ?? "—"}</span>
            <span>Org Size: {doc.org_size ?? "—"}</span>
            <span>Maturity: {doc.maturity_level ?? "—"}/5</span>
            <span>Owner: {doc.owner_name ?? "—"}</span>
            <span>Effective: {doc.effective_date ?? "—"}</span>
            <span>Review: {doc.review_date ?? "—"}</span>
          </div>
        </SheetHeader>

        <Separator />

        <Tabs value={tab} onValueChange={handleTabChange} className="mt-4">
          <TabsList className="h-8">
            <TabsTrigger value="document" className="text-[10px] gap-1 h-7">
              <FileText className="h-3 w-3" /> Document
            </TabsTrigger>
            <TabsTrigger value="versions" className="text-[10px] gap-1 h-7">
              <History className="h-3 w-3" /> Versions
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-[10px] gap-1 h-7">
              <ClipboardList className="h-3 w-3" /> Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="document" className="mt-4 space-y-1">
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
            ) : content ? (
              <div className="max-w-full">
                {content.split("\n").map((line, i) => {
                  if (line.startsWith("# ")) return <h2 key={i} className="text-sm font-bold text-foreground mt-4 mb-1">{line.slice(2)}</h2>;
                  if (line.startsWith("## ")) return <h3 key={i} className="text-xs font-bold text-foreground mt-3 mb-1">{line.slice(3)}</h3>;
                  if (line.startsWith("### ")) return <h4 key={i} className="text-[11px] font-semibold text-foreground mt-2 mb-0.5">{line.slice(4)}</h4>;
                  if (line.startsWith("---")) return <Separator key={i} className="my-2" />;
                  if (line.trim() === "") return <div key={i} className="h-1" />;
                  return <p key={i} className="text-[11px] text-foreground/70 leading-relaxed">{line}</p>;
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No content available</p>
            )}
          </TabsContent>

          <TabsContent value="versions" className="mt-4 space-y-2">
            {versions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No versions recorded</p>
            ) : (
              versions.map((v) => (
                <div key={v.id} className={cn("rounded-lg border p-3 space-y-1", v.is_current ? "border-primary/40 bg-primary/5" : "border-border")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px]">v{v.version}</Badge>
                      {v.is_current && <Badge className="text-[8px] bg-primary/20 text-primary border-0">Current</Badge>}
                      <span className="text-[9px] text-muted-foreground">{v.generated_by}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  {v.change_summary && <p className="text-[10px] text-muted-foreground">{v.change_summary}</p>}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-6 text-[9px]" onClick={() => viewVersion(v.content)}>
                      <Eye className="h-3 w-3 mr-1" /> View
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="audit" className="mt-4 space-y-2">
            {audit.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No audit events</p>
            ) : (
              <div className="relative pl-4 border-l border-border space-y-3">
                {audit.map((entry) => (
                  <div key={entry.id} className="relative">
                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                    <div className="flex items-start gap-2">
                      <Badge className={cn("text-[8px] border-0 shrink-0", ACTION_COLORS[entry.action] ?? "bg-muted text-muted-foreground")}>
                        {entry.action}
                      </Badge>
                      <div>
                        <p className="text-[10px] text-foreground">{entry.action_detail ?? entry.action}</p>
                        <p className="text-[9px] text-muted-foreground">
                          {entry.performed_by_name ?? "System"} · {new Date(entry.performed_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-4" />

        {/* Bottom action bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 w-[140px] text-[10px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => { onClose(); navigate("/policy-sop-builder"); }}>
            <Pencil className="h-3 w-3 mr-1.5" /> Edit in Builder
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onExport(doc, "DOCX")}>
            <Download className="h-3 w-3 mr-1.5" /> DOCX
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onExport(doc, "PDF")}>
            <Download className="h-3 w-3 mr-1.5" /> PDF
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
