import {
  Eye,
  Copy,
  Download,
  Save,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DocumentConfig,
  DOCUMENT_TYPES,
  FRAMEWORKS,
  CLASSIFICATIONS,
} from "./types";
import { toast } from "sonner";
import { exportToDOCX, exportToPDF, ExportDocument } from "@/utils/exportUtils";

interface Props {
  config: DocumentConfig;
  latestResponse: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function getDocTitle(config: DocumentConfig) {
  return DOCUMENT_TYPES.find((d) => d.value === config.documentType)?.label ?? "Policy Document";
}

function getClassification(value: string) {
  return CLASSIFICATIONS.find((c) => c.value === value);
}

function today() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function nextYear() {
  return new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DocumentPreviewPanel({ config, latestResponse, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const cls = getClassification(config.classification);
  const docTitle = getDocTitle(config);
  const selectedFrameworks = config.frameworks
    .map((f) => FRAMEWORKS.find((fw) => fw.value === f)?.label)
    .filter(Boolean);

  const copyAll = () => {
    if (latestResponse) {
      navigator.clipboard.writeText(latestResponse);
      toast.success("Document copied to clipboard");
    }
  };

  return (
    <div className="w-[320px] min-w-[320px] border-l border-border bg-card/30 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Document Preview</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyAll}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Metadata */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">{docTitle}</h2>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
              <span>Version 1.0</span>
              <span>•</span>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0">Draft</Badge>
              <span>•</span>
              {cls && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/40 text-primary">
                  {cls.label}
                </Badge>
              )}
            </div>
            <div className="text-[10px] text-muted-foreground space-y-0.5">
              <p>Effective Date: {today()}</p>
              <p>Review Date: {nextYear()}</p>
            </div>
            {selectedFrameworks.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedFrameworks.map((fw) => (
                  <Badge key={fw} variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                    {fw}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Document Body */}
          {latestResponse ? (
            <div className="space-y-1">
              {latestResponse.split("\n").map((line, i) => {
                if (line.startsWith("# ")) return <h2 key={i} className="text-xs font-bold text-foreground mt-3 mb-1">{line.slice(2)}</h2>;
                if (line.startsWith("## ")) return <h3 key={i} className="text-[11px] font-bold text-foreground mt-2 mb-1">{line.slice(3)}</h3>;
                if (line.startsWith("### ")) return <h4 key={i} className="text-[10px] font-semibold text-foreground mt-1.5 mb-0.5">{line.slice(4)}</h4>;
                if (line.startsWith("---")) return <Separator key={i} className="my-1.5" />;
                if (line.trim() === "") return <div key={i} className="h-1" />;

                if (line.startsWith("|")) {
                  if (line.replace(/[|\-\s]/g, "") === "") return null;
                  const cells = line.split("|").filter(Boolean).map((c) => c.trim());
                  return (
                    <div key={i} className="flex gap-1 text-[9px] text-foreground/70">
                      {cells.map((cell, ci) => (
                        <span key={ci} className="flex-1 truncate">{cell}</span>
                      ))}
                    </div>
                  );
                }

                let processed = line
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\[([A-Z][^\]]+)\]/g, '<span class="text-primary font-mono text-[8px]">[$1]</span>');

                return <p key={i} className="text-[10px] text-foreground/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />;
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-xl bg-muted/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">No Document Generated</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">Configure your document and use the chat to generate content.</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom Action Bar */}
      <div className="p-3 border-t border-border flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8" onClick={async () => {
          if (!latestResponse) { toast.info("No content to export"); return; }
          const exportDoc: ExportDocument = {
            title: getDocTitle(config),
            documentRef: "POL-001",
            version: "1.0",
            status: "Draft",
            classification: config.classification || "Confidential",
            effectiveDate: new Date().toISOString().split("T")[0],
            reviewDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
            selectedFrameworks: config.frameworks || [],
            industryVertical: "General",
            orgSize: "enterprise",
            content: latestResponse,
          };
          try { toast.success("Downloading DOCX..."); await exportToDOCX(exportDoc); } catch { toast.error("DOCX export failed"); }
        }}>
          <Download className="h-3 w-3 mr-1" /> Export DOCX
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8" onClick={async () => {
          if (!latestResponse) { toast.info("No content to export"); return; }
          const exportDoc: ExportDocument = {
            title: getDocTitle(config),
            documentRef: "POL-001",
            version: "1.0",
            status: "Draft",
            classification: config.classification || "Confidential",
            effectiveDate: new Date().toISOString().split("T")[0],
            reviewDate: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
            selectedFrameworks: config.frameworks || [],
            industryVertical: "General",
            orgSize: "enterprise",
            content: latestResponse,
          };
          try { toast.success("Downloading PDF..."); await exportToPDF(exportDoc); } catch { toast.error("PDF export failed"); }
        }}>
          <Download className="h-3 w-3 mr-1" /> Export PDF
        </Button>
        <Button variant="outline" size="sm" className="flex-1 text-[10px] h-8" onClick={() => toast.info("Save to repository coming soon")}>
          <Save className="h-3 w-3 mr-1" /> Save
        </Button>
      </div>
    </div>
  );
}
