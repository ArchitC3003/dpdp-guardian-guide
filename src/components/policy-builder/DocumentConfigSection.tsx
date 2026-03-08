import { useState } from "react";
import {
  FileText,
  Shield,
  Building2,
  Users,
  BarChart3,
  FileOutput,
  Tag,
  Sparkles,
  Check,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  onGenerate?: () => void;
}

const DOC_TYPE_ICONS: Record<string, typeof FileText> = {};

export default function DocumentConfigSection({ config, onChange, onGenerate }: Props) {
  const policies = DOCUMENT_TYPES.filter((d) => d.category === "Policy");
  const sops = DOCUMENT_TYPES.filter((d) => d.category === "SOP");

  const toggleFramework = (value: string) => {
    const next = config.frameworks.includes(value)
      ? config.frameworks.filter((f) => f !== value)
      : [...config.frameworks, value];
    onChange({ ...config, frameworks: next });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
          Document Configuration
        </p>
      </div>

      {/* Row 1 — Document Type */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          Select Document Type
        </div>
        <Tabs defaultValue="policies">
          <TabsList className="bg-background/50">
            <TabsTrigger value="policies" className="text-xs">Policies ({policies.length})</TabsTrigger>
            <TabsTrigger value="sops" className="text-xs">SOPs ({sops.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="policies" className="mt-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {policies.map((dt) => (
                <button
                  key={dt.value}
                  onClick={() => onChange({ ...config, documentType: dt.value })}
                  className={cn(
                    "relative text-left px-3 py-3 rounded-lg border text-xs transition-all",
                    config.documentType === dt.value
                      ? "bg-primary/10 border-primary/50 text-primary font-medium"
                      : "border-border hover:border-primary/30 text-foreground/80 hover:bg-muted/10"
                  )}
                >
                  {config.documentType === dt.value && (
                    <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-primary" />
                  )}
                  <FileText className="h-4 w-4 mb-1.5 text-primary/60" />
                  <span className="block leading-snug">{dt.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="sops" className="mt-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {sops.map((dt) => (
                <button
                  key={dt.value}
                  onClick={() => onChange({ ...config, documentType: dt.value })}
                  className={cn(
                    "relative text-left px-3 py-3 rounded-lg border text-xs transition-all",
                    config.documentType === dt.value
                      ? "bg-primary/10 border-primary/50 text-primary font-medium"
                      : "border-border hover:border-primary/30 text-foreground/80 hover:bg-muted/10"
                  )}
                >
                  {config.documentType === dt.value && (
                    <Check className="absolute top-2 right-2 h-3.5 w-3.5 text-primary" />
                  )}
                  <FileText className="h-4 w-4 mb-1.5 text-primary/60" />
                  <span className="block leading-snug">{dt.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Row 2 — Context Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Frameworks */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" /> Frameworks
          </div>
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
        </div>

        {/* Industry */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Building2 className="h-3.5 w-3.5 text-primary" /> Industry Vertical
          </div>
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
        </div>

        {/* Org Size */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Users className="h-3.5 w-3.5 text-primary" /> Organization Size
          </div>
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
        </div>

        {/* Maturity */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <BarChart3 className="h-3.5 w-3.5 text-primary" /> Compliance Maturity
          </div>
          <div className="flex items-center gap-1.5">
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
                <span
                  className={cn(
                    "text-[7px] leading-tight text-center",
                    i <= config.maturity ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  {level}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3 — Output Options */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-6">
          {/* Output Format */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileOutput className="h-3.5 w-3.5 text-primary" /> Output
            </span>
            <div className="flex gap-1.5">
              {OUTPUT_FORMATS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => onChange({ ...config, outputFormat: fmt.value })}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[10px] font-medium border transition-all",
                    config.outputFormat === fmt.value
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border text-foreground/60 hover:border-primary/30"
                  )}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Classification */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" /> Classification
            </span>
            <div className="flex gap-1.5">
              {CLASSIFICATIONS.map((cls) => (
                <button
                  key={cls.value}
                  onClick={() => onChange({ ...config, classification: cls.value })}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-[10px] font-medium border transition-all",
                    config.classification === cls.value
                      ? "bg-primary/15 border-primary/40 text-primary"
                      : "border-border text-foreground/60 hover:border-primary/30"
                  )}
                >
                  {cls.label}
                </button>
              ))}
            </div>
          </div>

          {onGenerate && (
            <div className="ml-auto">
            <Button
              onClick={onGenerate}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Document
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
