import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  FileText,
  Search,
  BookMarked,
  AlertTriangle,
  Download,
  Eye,
  Pencil,
  Archive,
  ChevronRight,
  Loader2,
  Bot,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { exportToDOCX, exportToPDF, ExportDocument } from "@/utils/exportUtils";
import PolicyDetailSlideOver from "@/components/policy-library/PolicyDetailSlideOver";

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

const STATUS_COLORS: Record<string, string> = {
  Draft: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  "Under Review": "border-orange-500/40 text-orange-400 bg-orange-500/10",
  Approved: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  Published: "border-primary/40 text-primary bg-primary/10",
  Retired: "border-muted-foreground/40 text-muted-foreground bg-muted/20",
};

const TYPE_COLORS: Record<string, string> = {
  policy: "border-blue-500/40 text-blue-400 bg-blue-500/10",
  sop: "border-purple-500/40 text-purple-400 bg-purple-500/10",
};

function isExpiringSoon(reviewDate: string | null): boolean {
  if (!reviewDate) return false;
  const diff = new Date(reviewDate).getTime() - Date.now();
  return diff > 0 && diff <= 30 * 86400000;
}

function isOverdue(reviewDate: string | null): boolean {
  if (!reviewDate) return false;
  return new Date(reviewDate).getTime() < Date.now();
}

export default function PolicyLibrary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<PolicyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const [selectedDoc, setSelectedDoc] = useState<PolicyDoc | null>(null);

  useEffect(() => {
    if (!user) return;
    loadDocs();
  }, [user]);

  const loadDocs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("policy_documents")
      .select("*")
      .order("updated_at", { ascending: false });
    setDocs((data as PolicyDoc[]) ?? []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    let list = docs;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.document_ref.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") list = list.filter((d) => d.document_type === typeFilter);
    if (statusFilter !== "all") list = list.filter((d) => d.status === statusFilter);
    list = [...list].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "review") return (a.review_date ?? "").localeCompare(b.review_date ?? "");
      if (sortBy === "status") return a.status.localeCompare(b.status);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return list;
  }, [docs, search, typeFilter, statusFilter, sortBy]);

  const totalDocs = docs.length;
  const publishedCount = docs.filter((d) => d.status === "Published").length;
  const reviewCount = docs.filter((d) => d.status === "Under Review").length;
  const expiringCount = docs.filter((d) => isExpiringSoon(d.review_date)).length;

  const stats = [
    { label: "Total Documents", value: totalDocs, icon: FileText, color: "text-primary" },
    { label: "Published", value: publishedCount, icon: BookMarked, color: "text-emerald-400" },
    { label: "Under Review", value: reviewCount, icon: Eye, color: "text-orange-400" },
    { label: "Expiring Soon", value: expiringCount, icon: AlertTriangle, color: expiringCount > 0 ? "text-amber-400" : "text-muted-foreground" },
  ];

  const handleExport = async (doc: PolicyDoc, format: "DOCX" | "PDF") => {
    const { data: version } = await supabase
      .from("policy_versions")
      .select("content")
      .eq("document_id", doc.id)
      .eq("is_current", true)
      .maybeSingle();

    if (!version?.content) {
      toast.error("No content found for this document");
      return;
    }

    const exportDoc: ExportDocument = {
      title: doc.title,
      documentRef: doc.document_ref,
      version: doc.current_version,
      status: doc.status,
      classification: doc.classification,
      effectiveDate: doc.effective_date ?? new Date().toISOString().slice(0, 10),
      reviewDate: doc.review_date ?? "",
      selectedFrameworks: doc.selected_frameworks ?? [],
      industryVertical: doc.industry_vertical ?? "",
      orgSize: doc.org_size ?? "",
      content: version.content,
    };

    try {
      if (format === "DOCX") await exportToDOCX(exportDoc);
      else await exportToPDF(exportDoc);
      toast.success(`Exported as ${format}`);
    } catch {
      toast.error(`${format} export failed`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Policy Register</h1>
          <p className="text-muted-foreground text-sm">Organisation's official policy lifecycle register — Draft, Review, Published</p>
        </div>
        <Button onClick={() => navigate("/policy-sop-builder")} className="gradient-primary">
          <Bot className="h-4 w-4 mr-2" /> Generate New Document
        </Button>
      </div>

      {/* Expiring alert */}
      {expiringCount > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-300">
            ⚠️ {expiringCount} document{expiringCount > 1 ? "s are" : " is"} due for review within 30 days
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className={cn("text-2xl font-bold mt-1", s.color)}>{s.value}</p>
                </div>
                <s.icon className={cn("h-7 w-7 opacity-40", s.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or reference…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] h-9 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="sop">SOP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Under Review">Under Review</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Published">Published</SelectItem>
            <SelectItem value="Retired">Retired</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[150px] h-9 text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last Updated</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="review">Review Date</SelectItem>
            <SelectItem value="status">Status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <div className="h-14 w-14 rounded-xl bg-muted/20 flex items-center justify-center">
            <FileText className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No policies generated yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-md">
            Use the Policy & SOP Builder to create your first document.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate("/policy-sop-builder")}>
            <Bot className="h-3 w-3 mr-1.5" /> Go to Policy & SOP Builder
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4">Document</th>
                  <th className="py-3 px-3">Ref</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Version</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Classification</th>
                  <th className="py-3 px-3">Frameworks</th>
                  <th className="py-3 px-3">Review Date</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => {
                  const frameworks = doc.selected_frameworks ?? [];
                  const overdue = isOverdue(doc.review_date);
                  const expiring = isExpiringSoon(doc.review_date);
                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-border/30 hover:bg-muted/10 transition-colors cursor-pointer"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium text-foreground truncate max-w-[200px]">{doc.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground font-mono">{doc.document_ref}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className={cn("text-[9px]", TYPE_COLORS[doc.document_type] ?? "")}>
                          {doc.document_type === "sop" ? "SOP" : "Policy"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground">v{doc.current_version}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className={cn("text-[9px]", STATUS_COLORS[doc.status] ?? "")}>
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-xs text-muted-foreground capitalize">{doc.classification}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          {frameworks.slice(0, 2).map((fw) => (
                            <Badge key={fw} variant="outline" className="text-[8px] border-primary/30 text-primary">
                              {fw}
                            </Badge>
                          ))}
                          {frameworks.length > 2 && (
                            <span className="text-[9px] text-muted-foreground">+{frameworks.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {doc.review_date ? (
                          <span
                            className={cn(
                              "text-xs",
                              overdue ? "text-destructive font-medium" : expiring ? "text-amber-400 font-medium" : "text-muted-foreground"
                            )}
                          >
                            {new Date(doc.review_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setSelectedDoc(doc)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate("/policy-sop-builder")}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleExport(doc, "DOCX")}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Slide-Over */}
      {selectedDoc && (
        <PolicyDetailSlideOver
          doc={selectedDoc}
          open={!!selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onExport={handleExport}
          onRefresh={loadDocs}
        />
      )}
    </div>
  );
}
