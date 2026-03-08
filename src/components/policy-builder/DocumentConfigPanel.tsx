import { useState } from "react";
import {
  FileText,
  Settings2,
  Shield,
  Building2,
  Users,
  BarChart3,
  FileOutput,
  Tag,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  INDUSTRIES,
  ORG_SIZES,
  MATURITY_LEVELS,
  OUTPUT_FORMATS,
  CLASSIFICATIONS,
} from "./types";

interface Props {
  config: DocumentConfig;
  onChange: (config: DocumentConfig) => void;
  onGenerate: () => void;
}

export default function DocumentConfigPanel({ config, onChange, onGenerate }: Props) {
  const [docTypeExpanded, setDocTypeExpanded] = useState(true);

  const toggleFramework = (value: string) => {
    const next = config.frameworks.includes(value)
      ? config.frameworks.filter((f) => f !== value)
      : [...config.frameworks, value];
    onChange({ ...config, frameworks: next });
  };

  const policies = DOCUMENT_TYPES.filter((d) => d.category === "Policy");
  const sops = DOCUMENT_TYPES.filter((d) => d.category === "SOP");

  return (
    <div className="w-[280px] min-w-[280px] border-r border-border bg-card/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">Document Configuration</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Document Type */}
          <section>
            <button
              onClick={() => setDocTypeExpanded(!docTypeExpanded)}
              className="flex items-center justify-between w-full text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="h-3 w-3" /> Document Type
              </span>
              {docTypeExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {docTypeExpanded && (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-wide">Policies</p>
                  <div className="space-y-1">
                    {policies.map((dt) => (
                      <button
                        key={dt.value}
                        onClick={() => onChange({ ...config, documentType: dt.value })}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all border",
                          config.documentType === dt.value
                            ? "bg-primary/15 border-primary/40 text-primary font-medium"
                            : "border-transparent hover:bg-muted/20 text-foreground/80"
                        )}
                      >
                        {dt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground mb-1 tracking-wide">Standard Operating Procedures</p>
                  <div className="space-y-1">
                    {sops.map((dt) => (
                      <button
                        key={dt.value}
                        onClick={() => onChange({ ...config, documentType: dt.value })}
                        className={cn(
                          "w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-all border",
                          config.documentType === dt.value
                            ? "bg-primary/15 border-primary/40 text-primary font-medium"
                            : "border-transparent hover:bg-muted/20 text-foreground/80"
                        )}
                      >
                        {dt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          <Separator />

          {/* Framework Source */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Shield className="h-3 w-3" /> Frameworks
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FRAMEWORKS.map((fw) => (
                <button
                  key={fw.value}
                  onClick={() => toggleFramework(fw.value)}
                  className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-medium border transition-all",
                    config.frameworks.includes(fw.value)
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "border-border text-foreground/60 hover:border-primary/30"
                  )}
                >
                  {fw.label}
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Industry */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="h-3 w-3" /> Industry Vertical
            </p>
            <Select value={config.industry} onValueChange={(v) => onChange({ ...config, industry: v })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((ind) => (
                  <SelectItem key={ind} value={ind} className="text-xs">
                    {ind}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>

          {/* Org Size */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="h-3 w-3" /> Organization Size
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {ORG_SIZES.map((os) => (
                <button
                  key={os.value}
                  onClick={() => onChange({ ...config, orgSize: os.value })}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[10px] font-medium border transition-all text-center",
                    config.orgSize === os.value
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border text-foreground/60 hover:border-primary/30"
                  )}
                >
                  {os.label}
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Compliance Maturity */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" /> Compliance Maturity
            </p>
            <div className="flex items-center gap-1">
              {MATURITY_LEVELS.map((level, i) => (
                <button
                  key={level}
                  onClick={() => onChange({ ...config, maturity: i })}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={cn(
                      "w-full h-2 rounded-full transition-all",
                      i <= config.maturity ? "bg-primary" : "bg-muted/30"
                    )}
                  />
                  <span className={cn(
                    "text-[8px] leading-tight",
                    i <= config.maturity ? "text-primary font-medium" : "text-muted-foreground"
                  )}>
                    {level}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Output Format */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileOutput className="h-3 w-3" /> Output Format
            </p>
            <div className="flex gap-1.5">
              {OUTPUT_FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => onChange({ ...config, outputFormat: fmt.value })}
                  className={cn(
                    "flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium border transition-all text-center",
                    config.outputFormat === fmt.value
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border text-foreground/60 hover:border-primary/30"
                  )}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Classification */}
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="h-3 w-3" /> Classification Label
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {CLASSIFICATIONS.map((cls) => (
                <button
                  key={cls.value}
                  onClick={() => onChange({ ...config, classification: cls.value })}
                  className={cn(
                    "px-2 py-1.5 rounded-md text-[10px] font-medium border transition-all text-center",
                    config.classification === cls.value
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border text-foreground/60 hover:border-primary/30"
                  )}
                >
                  {cls.label}
                </button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>

      {/* Generate CTA */}
      <div className="p-3 border-t border-border">
        <Button
          onClick={onGenerate}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Document
        </Button>
      </div>
    </div>
  );
}
