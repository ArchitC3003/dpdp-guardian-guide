import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
  Mail,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Shield,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ScrollArea } from "@/components/ui/scroll-area";

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

// Quality score calculation
function calcQualityScores(text: string, orgName?: string) {
  const expectedSections = [
    "purpose", "scope", "definitions", "roles", "responsibilities",
    "implementation", "monitoring", "audit", "review", "compliance",
    "version", "appendix"
  ];
  const headings = (text.match(/^#{1,3}\s+.+$/gm) || []).map(h => h.toLowerCase());
  const sectionsFound = expectedSections.filter(s => headings.some(h => h.includes(s))).length;
  const completeness = Math.min(100, Math.round((sectionsFound / expectedSections.length) * 100));

  const orgMentions = orgName && orgName !== "the Organisation"
    ? (text.match(new RegExp(orgName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0;
  const genericMentions = (text.match(/the organisation|the company|the entity/gi) || []).length;
  const totalRefs = orgMentions + genericMentions;
  const personalisation = totalRefs > 0 ? Math.min(100, Math.round((orgMentions / totalRefs) * 100)) : 0;

  const regPatterns = [/DPDP/gi, /NIST/gi, /ISO\s*2700/gi, /CERT-In/gi, /GDPR/gi, /IT\s*Act/gi, /RBI/gi, /SEBI/gi, /IRDAI/gi, /PMLA/gi];
  const regsFound = regPatterns.filter(p => p.test(text)).length;
  const regulatory = Math.min(100, Math.round((regsFound / regPatterns.length) * 100));

  return { completeness, personalisation, regulatory };
}

function QualityCircle({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="3" opacity={0.3} />
          <circle cx="22" cy="22" r={radius} fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
            strokeLinecap="round" className="transition-all duration-700" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
          {value}%
        </span>
      </div>
      <span className="text-[8px] text-muted-foreground text-center leading-tight">{label}</span>
    </div>
  );
}

// Section nav parser
function parseSectionHeadings(text: string): { id: string; label: string; level: number }[] {
  const lines = text.split("\n");
  const headings: { id: string; label: string; level: number }[] = [];
  lines.forEach((line, i) => {
    const m2 = line.match(/^## (.+)$/);
    const m3 = line.match(/^### (.+)$/);
    if (m2) {
      headings.push({ id: `section-${i}`, label: m2[1].replace(/\*\*/g, ""), level: 2 });
    } else if (m3) {
      headings.push({ id: `section-${i}`, label: m3[1].replace(/\*\*/g, ""), level: 3 });
    }
  });
  return headings;
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
  const [activeSection, setActiveSection] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  const cls = CLASSIFICATIONS.find((c) => c.value === config.classification);
  const docTitle = latestResponse ? extractTitleFromResponse(latestResponse, config) : getDocTitle(config);
  const selectedFrameworks = config.frameworks
    .map((f) => FRAMEWORKS.find((fw) => fw.value === f)?.label)
    .filter(Boolean);

  const docVersion = currentDoc?.current_version ?? "1.0";
  const docStatus = currentDoc?.status ?? "Draft";

  const quality = useMemo(() => {
    if (!latestResponse) return null;
    return calcQualityScores(latestResponse, config.orgName || config.industry);
  }, [latestResponse, config.orgName, config.industry]);

  const sectionHeadings = useMemo(() => {
    if (!latestResponse) return [];
    return parseSectionHeadings(latestResponse);
  }, [latestResponse]);

  const copyAll = () => {
    if (latestResponse) {
      navigator.clipboard.writeText(latestResponse);
      toast.success("Document copied to clipboard");
    }
  };

  const copyAsPlainText = () => {
    if (latestResponse) {
      const plain = latestResponse
        .replace(/#{1,3}\s+/g, "")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\[([^\]]+)\]/g, "$1");
      navigator.clipboard.writeText(plain);
      toast.success("Copied as plain text");
    }
  };

  const sendForReview = () => {
    if (!latestResponse) return;
    const subject = encodeURIComponent(`Review: ${docTitle}`);
    const body = encodeURIComponent(`Please review the attached ${docTitle}.\n\nSummary:\n${latestResponse.slice(0, 200)}...`);
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(sectionId);
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
    effectiveDate: today(),
    reviewDate: nextYear(),
    selectedFrameworks: selectedFrameworks as string[],
    industryVertical: config.industry,
    orgSize: config.orgSize,
    content: latestResponse ?? "",
  });

  // Render document lines with section IDs
  const renderDocumentContent = () => {
    if (!latestResponse) return null;
    const lines = latestResponse.split("\n");
    let sectionIdx = 0;

    return lines.map((line, i) => {
      const isH2 = line.startsWith("## ");
      const isH3 = line.startsWith("### ");
      let sectionId = "";
      if (isH2 || isH3) {
        sectionId = `section-${i}`;
      }

      if (line.startsWith("# ")) return <h2 key={i} id={sectionId || undefined} className="text-sm font-bold text-foreground mt-4 mb-1">{line.slice(2)}</h2>;
      if (isH2) return <h3 key={i} id={sectionId} className="text-xs font-bold text-foreground mt-3 mb-1">{line.slice(3)}</h3>;
      if (isH3) return <h4 key={i} id={sectionId} className="text-[11px] font-semibold text-foreground mt-2 mb-0.5">{line.slice(4)}</h4>;
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
    });
  };

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
                  {/* Quality Indicators */}
                  {quality && (
                    <div className="flex items-center gap-6 p-3 rounded-lg border border-border bg-muted/5">
                      <QualityCircle
                        value={quality.completeness}
                        label="Completeness"
                        color={quality.completeness >= 70 ? "hsl(var(--primary))" : quality.completeness >= 40 ? "hsl(45, 93%, 47%)" : "hsl(0, 84%, 60%)"}
                      />
                      <QualityCircle
                        value={quality.personalisation}
                        label="Personalisation"
                        color={quality.personalisation >= 70 ? "hsl(var(--primary))" : quality.personalisation >= 40 ? "hsl(45, 93%, 47%)" : "hsl(0, 84%, 60%)"}
                      />
                      <QualityCircle
                        value={quality.regulatory}
                        label="Regulatory Coverage"
                        color={quality.regulatory >= 70 ? "hsl(var(--primary))" : quality.regulatory >= 40 ? "hsl(45, 93%, 47%)" : "hsl(0, 84%, 60%)"}
                      />
                      <div className="ml-auto text-right">
                        <p className="text-[9px] text-muted-foreground">Document Quality</p>
                        <p className={cn("text-sm font-bold", 
                          Math.round((quality.completeness + quality.personalisation + quality.regulatory) / 3) >= 70 ? "text-primary" : "text-amber-400"
                        )}>
                          {Math.round((quality.completeness + quality.personalisation + quality.regulatory) / 3)}%
                        </p>
                      </div>
                    </div>
                  )}

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
                      <div className="flex gap-4">
                        {/* Section Navigation Sidebar */}
                        {sectionHeadings.length > 3 && (
                          <div className="hidden lg:block w-48 shrink-0">
                            <div className="sticky top-4">
                              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Sections</p>
                              <ScrollArea className="h-[500px]">
                                <div className="space-y-0.5 pr-2">
                                  {sectionHeadings.map((h) => (
                                    <button
                                      key={h.id}
                                      onClick={() => scrollToSection(h.id)}
                                      className={cn(
                                        "block w-full text-left text-[10px] py-1 px-2 rounded transition-colors truncate",
                                        h.level === 3 ? "pl-4" : "",
                                        activeSection === h.id
                                          ? "bg-primary/10 text-primary font-medium"
                                          : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
                                      )}
                                    >
                                      {h.label}
                                    </button>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </div>
                        )}

                        {/* Document content */}
                        <div className="flex-1 max-w-4xl space-y-1" ref={contentRef}>
                          {renderDocumentContent()}
                        </div>
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

                  {/* Extended Export Options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs h-8 gap-1">
                        <FileDown className="h-3 w-3" /> More Exports
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={copyAll} className="text-xs gap-2">
                        <Copy className="h-3 w-3" /> Copy as Markdown
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={copyAsPlainText} className="text-xs gap-2">
                        <FileText className="h-3 w-3" /> Copy as Plain Text
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={sendForReview} className="text-xs gap-2">
                        <Mail className="h-3 w-3" /> Send for Review
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

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
