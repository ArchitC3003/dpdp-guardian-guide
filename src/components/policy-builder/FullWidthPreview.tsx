import {
  Eye,
  Copy,
  Download,
  Save,
  FileText,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  DocumentConfig,
  DOCUMENT_TYPES,
  FRAMEWORKS,
  CLASSIFICATIONS,
} from "./types";
import { toast } from "sonner";

interface Props {
  config: DocumentConfig;
  latestResponse: string | null;
  isExpanded: boolean;
  onToggle: () => void;
}

function getDocTitle(config: DocumentConfig) {
  return DOCUMENT_TYPES.find((d) => d.value === config.documentType)?.label ?? "Policy Document";
}

function today() {
  return new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function nextYear() {
  return new Date(Date.now() + 365 * 86400000).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function FullWidthPreview({ config, latestResponse, isExpanded, onToggle }: Props) {
  const cls = CLASSIFICATIONS.find((c) => c.value === config.classification);
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
              <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">
                Draft
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
            <div className="p-6 space-y-5">
              {latestResponse ? (
                <>
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="text-[10px]">Version 1.0</Badge>
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">Draft</Badge>
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
                  </div>

                  <Separator />

                  {/* Document Body */}
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
                              <span key={ci} className="flex-1 truncate">{cell}</span>
                            ))}
                          </div>
                        );
                      }
                      let processed = line
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\[([A-Z][^\]]+)\]/g, '<span class="text-primary font-mono text-[9px]">[$1]</span>');
                      return <p key={i} className="text-[11px] text-foreground/70 leading-relaxed" dangerouslySetInnerHTML={{ __html: processed }} />;
                    })}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <div className="h-14 w-14 rounded-xl bg-muted/20 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-muted-foreground/50" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">No Document Generated</p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-md">
                      Configure your document type and use the chat or "Generate Document" button to create content. The preview will appear here.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            {latestResponse && (
              <div className="px-6 py-3 border-t border-border flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => toast.info("DOCX export coming soon")}>
                  <Download className="h-3 w-3 mr-1.5" /> Export DOCX
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => toast.info("PDF export coming soon")}>
                  <Download className="h-3 w-3 mr-1.5" /> Export PDF
                </Button>
                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => toast.info("Save to repository coming soon")}>
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
  );
}
