import { useState, useEffect } from "react";
import {
  Eye,
  Copy,
  Download,
  Save,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
  History,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  DocumentConfig,
  DOCUMENT_TYPES,
  FRAMEWORKS,
  CLASSIFICATIONS,
} from "./types";
import { PolicyDocument, PolicyVersion, AuditEntry } from "@/hooks/usePolicyVersioning";
import VersionHistoryPanel from "./VersionHistoryPanel";
import AuditTrailPanel from "./AuditTrailPanel";
import { toast } from "sonner";
import { exportToDOCX, exportToPDF, ExportDocument } from "@/utils/exportUtils";
import { Loader2 } from "lucide-react";

interface Props {
  config: DocumentConfig;
  latestResponse: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  currentDoc: PolicyDocument | null;
  versions: PolicyVersion[];
  auditLog: AuditEntry[];
  versionsLoading: boolean;
  onStatusChange: (status: string) => void;
  onLoadVersions: () => void;
  onLoadAuditLog: () => void;
  onViewVersion: (content: string) => void;
  onRestoreVersion: (versionId: string) => void;
  onSaveToRepo: () => void;
  onExport: (format: string) => void;
}

const STATUS_OPTIONS = ["Draft", "Under Review", "Approved", "Published", "Retired"];
const STATUS_COLORS: Record<string, string> = {
  Draft: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  "Under Review": "border-orange-500/40 text-orange-400 bg-orange-500/10",
  Approved: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  Published: "border-primary/40 text-primary bg-primary/10",
  Retired: "border-muted-foreground/40 text-muted-foreground bg-muted/20",
};

function getDocTitle(config: DocumentConfig) {
  return DOCUMENT_TYPES.find((d) => d.value === config.documentType)?.label ?? "Policy Document";
}

function today() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function nextYear() {
  return new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function processInlinePreview(text: string): string {
  let out = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(
    /\[([A-Z][^\]]+)\]/g,
    '<span class="inline-flex items-center px-1 py-0 rounded text-[8px] font-mono bg-primary/15 text-primary border border-primary/20 mx-0.5 whitespace-nowrap">$1</span>'
  );
  return out;
}

export default function FullWidthPreview({
  config,
  latestResponse,
  isExpanded,
  onToggle,
  currentDoc,
  versions,
  auditLog,
  versionsLoading,
  onStatusChange,
  onLoadVersions,
  onLoadAuditLog,
  onViewVersion,
  onRestoreVersion,
  onSaveToRepo,
  onExport,
}: Props) {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("document");
  const [exportingDocx, setExportingDocx] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const cls = CLASSIFICATIONS.find((c) => c.value === config.classification);
  const docTitle = latestResponse ? extractTitleFromResponse(latestResponse, config) : getDocTitle(config);
  const selectedFrameworks = config.frameworks
    .map((f) => FRAMEWORKS.find((fw) => fw.value === f)?.label)
    .filter(Boolean);

  const docVersion = currentDoc?.current_version ?? "1.0";
  const docStatus = currentDoc?.status ?? "Draft";

  const copyAll = () => {
    if (latestResponse) {
      navigator.clipboard.writeText(latestResponse);
      toast.success("Document copied to clipboard");
    }
  };

  const handleOpenVersions = () => {
    onLoadVersions();
    setShowVersionHistory(true);
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    if (val === "audit") onLoadAuditLog();
  };

  const buildExportDoc = (): ExportDocument => ({
    title: docTitle,
    documentRef: currentDoc?.document_ref ?? "POL-GEN-001",
    version: docVersion,
    status: docStatus,
    classification: config.classification,
    effectiveDate: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    reviewDate: new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    selectedFrameworks: selectedFrameworks as string[],
    industryVertical: config.industry,
    orgSize: config.orgSize,
    content: latestResponse ?? "",
  });

  return (
    <>
      <section className="space-y-3 pb-8">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Document Preview
        </p>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Toggle Header */}
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                {latestResponse ? docTitle : "No Document Generated Yet"}
              </span>
              {latestResponse && (
                <Badge
                  variant="outline"
                  className={cn("text-[9px] cursor-pointer", STATUS_COLORS[docStatus])}
                  onClick={(e) => { e.stopPropagation(); handleOpenVersions(); }}
                >
                  v{docVersion}
                </Badge>
              )}
              {latestResponse && (
                <Badge
                  variant="outline"
                  className={cn("text-[9px]", STATUS_COLORS[docStatus])}
                >
                  {docStatus}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {latestResponse && !isExpanded && (
                <span className="text-[10px] text-muted-foreground">Click to view</span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {isExpanded && (
            <div className="animate-fade-in">
              <Separator />

              {latestResponse ? (
                <div className="p-6 space-y-5">
                  {/* Metadata bar */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] cursor-pointer", STATUS_COLORS[docStatus])}
                      onClick={handleOpenVersions}
                    >
                      v{docVersion}
                    </Badge>

                    {/* Status dropdown */}
                    <Select value={docStatus} onValueChange={onStatusChange}>
                      <SelectTrigger className="h-7 w-[140px] text-[10px] border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs">
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {cls && (
                      <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                        {cls.label}
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">Effective: {today()}</span>
                    <span className="text-[10px] text-muted-foreground">Review: {nextYear()}</span>
                    {selectedFrameworks.map((fw) => (
                      <Badge key={fw} variant="outline" className="text-[9px] border-primary/30 text-primary">
                        {fw}
                      </Badge>
                    ))}

                    <div className="ml-auto flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 gap-1"
                        onClick={handleOpenVersions}
                      >
                        <History className="h-3 w-3" /> Version History
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Tabs: Document / Audit Trail */}
                  <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="h-8">
                      <TabsTrigger value="document" className="text-[10px] gap-1 h-7">
                        <FileText className="h-3 w-3" /> Document
                      </TabsTrigger>
                      <TabsTrigger value="audit" className="text-[10px] gap-1 h-7">
                        <ClipboardList className="h-3 w-3" /> Audit Trail
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="document" className="mt-4">
                      <div className="max-w-4xl space-y-1">
                        {latestResponse.split("\n").map((line, i) => {
                          if (line.startsWith("# ")) return <h2 key={i} className="text-sm font-bold text-foreground mt-4 mb-1">{line.slice(2)}</h2>;
                          if (line.startsWith("## ")) return <h3 key={i} className="text-xs font-bold text-foreground mt-3 mb-1">{line.slice(3)}</h3>;
                          if (line.startsWith("### ")) return <h4 key={i} className="text-[11px] font-semibold text-foreground mt-2 mb-0.5">{line.slice(4)}</h4>;
                          if (line.startsWith("---")) return <Separator key={i} className="my-2" />;
                          if (line.trim() === "") return <div key={i} className="h-1" />;
                          if (line.startsWith("|")) {
                            if (line.replace(/[|\-\s]/g, "") === "") return null;
                            const cells = line.split("|").filter(Boolean).map((c) => c.trim());
                            return (
                              <div key={i} className="flex gap-2 text-[10px] text-foreground/70 py-0.5">
                                {cells.map((cell, ci) => (
                                  <span key={ci} className="flex-1 truncate" dangerouslySetInnerHTML={{ __html: processInlinePreview(cell) }} />
                                ))}
                              </div>
                            );
                          }
                          const processed = processInlinePreview(line);
                          return <p key={i} className="text-[11px] text-foreground/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />;
                        })}
                      </div>
                    </TabsContent>

                    <TabsContent value="audit" className="mt-4">
                      <AuditTrailPanel entries={auditLog} loading={versionsLoading} />
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                    <div className="h-14 w-14 rounded-xl bg-muted/20 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">No Document Generated</p>
                      <p className="text-xs text-muted-foreground/70 mt-1 max-w-md">
                        Configure your document type and use the chat or "Generate Document" button to create content.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Bar */}
              {latestResponse && (
              <div className="px-6 py-3 border-t border-border flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    disabled={exportingDocx}
                    onClick={async () => {
                      setExportingDocx(true);
                      try {
                        await exportToDOCX(buildExportDoc());
                        onExport("DOCX");
                        toast.success("Document exported as DOCX");
                      } catch (e) {
                        toast.error("DOCX export failed");
                      } finally {
                        setExportingDocx(false);
                      }
                    }}
                  >
                    {exportingDocx ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Download className="h-3 w-3 mr-1.5" />} Export DOCX
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                    disabled={exportingPdf}
                    onClick={async () => {
                      setExportingPdf(true);
                      try {
                        await exportToPDF(buildExportDoc());
                        onExport("PDF");
                        toast.success("Document exported as PDF");
                      } catch (e) {
                        toast.error("PDF export failed");
                      } finally {
                        setExportingPdf(false);
                      }
                    }}
                  >
                    {exportingPdf ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Download className="h-3 w-3 mr-1.5" />} Export PDF
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8" onClick={onSaveToRepo}>
                    <Save className="h-3 w-3 mr-1.5" /> Save to Repository
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => window.print()}>
                    <Printer className="h-3 w-3 mr-1.5" /> Print
                  </Button>
                  <div className="ml-auto">
                    <Button variant="outline" size="sm" className="text-xs h-8" onClick={copyAll}>
                      <Copy className="h-3 w-3 mr-1.5" /> Copy All
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Version History Slide-over */}
      <VersionHistoryPanel
        open={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        versions={versions}
        currentVersion={docVersion}
        loading={versionsLoading}
        onView={onViewVersion}
        onRestore={onRestoreVersion}
      />
    </>
  );
}

function extractTitleFromResponse(response: string, config: DocumentConfig): string {
  const match = response.match(/^# (.+)$/m);
  if (match) return match[1];
  return DOCUMENT_TYPES.find((d) => d.value === config.documentType)?.label ?? "Policy Document";
}
