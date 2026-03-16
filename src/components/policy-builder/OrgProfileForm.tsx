import { useState, useEffect, useRef, useCallback, KeyboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Building2, ChevronDown, Sparkles, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OrgContext,
  INDUSTRY_OPTIONS,
  ORG_SIZE_OPTIONS,
  SDF_OPTIONS,
  GEOGRAPHY_OPTIONS,
  PROCESSING_ACTIVITIES,
  MATURITY_OPTIONS,
  getOrgProfileCompleteness,
} from "./orgContextTypes";
import { inferSmartContext } from "@/utils/smartContextEngine";
import { KMSourcesPanel } from "@/components/km/KMSourcesPanel";
import { SectorInsightsPanel } from "@/components/km/SectorInsightsPanel";
import { getKMContext, type KMContext } from "@/services/kmRetrievalService";

// Expanded industry list per requirements
const MULTI_INDUSTRY_OPTIONS = [
  "Manufacturing",
  "Retail/E-commerce",
  "HealthTech/Healthcare",
  "BFSI/Banking",
  "EdTech/Education",
  "Technology/IT Services",
  "Logistics",
  "Retail",
  "Pharma",
  "Media & Entertainment",
  "Government/PSU",
  "Insurance",
  "Telecom",
  "Legal/Professional Services",
  "Other",
];

const MATURITY_RANK: Record<string, number> = {
  initial: 0,
  developing: 1,
  defined: 2,
  managed: 3,
  optimising: 4,
};

interface Props {
  ctx: OrgContext;
  onChange: (ctx: OrgContext) => void;
  compact?: boolean;
  documentType?: string;
}

export default function OrgProfileForm({ ctx, onChange, compact = false, documentType }: Props) {
  const [open, setOpen] = useState(true);
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());
  const [flashFields, setFlashFields] = useState<Set<string>>(new Set());
  const [customDataTypeInput, setCustomDataTypeInput] = useState("");
  const [customActivityInput, setCustomActivityInput] = useState("");
  const [customIndustryInput, setCustomIndustryInput] = useState("");
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);
  const prevTriggerRef = useRef<string>("");
  const userAddedActivities = useRef<Set<string>>(new Set());
  const userAddedDataTypes = useRef<Set<string>>(new Set());
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const { filled, total } = getOrgProfileCompleteness(ctx);
  const pct = Math.round((filled / total) * 100);

  const industries = ctx.industries || (ctx.industry ? [ctx.industry] : []);

  // Close industry dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(e.target as Node)) {
        setShowIndustryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Smart Context Inference — runs per industry, merges results
  useEffect(() => {
    const triggerKey = `${industries.join(",")}|${ctx.geographies}|${ctx.sdfClassification}|${documentType || ""}`;
    if (triggerKey === prevTriggerRef.current) return;
    prevTriggerRef.current = triggerKey;

    if (industries.length === 0) {
      setAutoFilledFields(new Set());
      return;
    }

    // Run inference for EACH industry and merge
    const allActivities = new Set<string>(Array.from(userAddedActivities.current));
    const allDataTypes = new Set<string>(Array.from(userAddedDataTypes.current));
    let highestMaturity = "";
    let highestRank = -1;
    let anyMatch = false;

    for (const ind of industries) {
      const result = inferSmartContext(ind, ctx.geographies, ctx.sdfClassification, documentType);
      if (!result) continue;
      anyMatch = true;
      result.processingActivities.forEach((a) => allActivities.add(a));
      (result.personalDataTypes || []).forEach((d) => allDataTypes.add(d));
      const rank = MATURITY_RANK[result.maturityLevel] ?? -1;
      if (rank > highestRank) {
        highestRank = rank;
        highestMaturity = result.maturityLevel;
      }
    }

    if (!anyMatch) {
      setAutoFilledFields(new Set());
      return;
    }

    const newFields = new Set<string>();
    if (allActivities.size > userAddedActivities.current.size) newFields.add("processingActivities");
    if (allDataTypes.size > userAddedDataTypes.current.size) newFields.add("personalDataTypes");
    if (highestMaturity) newFields.add("maturityLevel");

    setAutoFilledFields(newFields);
    setFlashFields(new Set(["processingActivities", "personalDataTypes"]));

    onChange({
      ...ctx,
      processingActivities: Array.from(allActivities),
      personalDataTypes: Array.from(allDataTypes),
      maturityLevel: highestMaturity || ctx.maturityLevel,
    });

    const timer = setTimeout(() => {
      setAutoFilledFields(new Set());
      setFlashFields(new Set());
    }, 8000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industries.join(","), ctx.geographies, ctx.sdfClassification, documentType]);

  const setIndustries = (next: string[]) => {
    onChange({
      ...ctx,
      industries: next,
      industry: next[0] || "",
      sector: "", // reset sub-sector when industries change
    });
  };

  const addIndustry = (ind: string) => {
    const trimmed = ind.trim();
    if (!trimmed || industries.includes(trimmed)) return;
    setIndustries([...industries, trimmed]);
    setCustomIndustryInput("");
    setShowIndustryDropdown(false);
  };

  const removeIndustry = (ind: string) => {
    setIndustries(industries.filter((i) => i !== ind));
  };

  const handleIndustryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIndustry(customIndustryInput);
    }
  };

  const filteredIndustryOptions = MULTI_INDUSTRY_OPTIONS.filter(
    (opt) => !industries.includes(opt) && opt.toLowerCase().includes(customIndustryInput.toLowerCase())
  );

  const toggleActivity = (act: string) => {
    const isRemoving = ctx.processingActivities.includes(act);
    const next = isRemoving
      ? ctx.processingActivities.filter((a) => a !== act)
      : [...ctx.processingActivities, act];

    if (isRemoving) {
      userAddedActivities.current.delete(act);
    } else {
      userAddedActivities.current.add(act);
    }

    setAutoFilledFields((prev) => { const n = new Set(prev); n.delete("processingActivities"); return n; });
    onChange({ ...ctx, processingActivities: next });
  };

  const removeDataType = (dt: string) => {
    userAddedDataTypes.current.delete(dt);
    onChange({ ...ctx, personalDataTypes: (ctx.personalDataTypes || []).filter((d) => d !== dt) });
  };

  const addCustomDataType = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const existing = ctx.personalDataTypes || [];
    if (existing.includes(trimmed)) return;
    userAddedDataTypes.current.add(trimmed);
    onChange({ ...ctx, personalDataTypes: [...existing, trimmed] });
    setCustomDataTypeInput("");
  };

  const handleDataTypeKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCustomDataType(customDataTypeInput);
    }
  };

  const addCustomActivity = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (ctx.processingActivities.includes(trimmed)) return;
    userAddedActivities.current.add(trimmed);
    onChange({ ...ctx, processingActivities: [...ctx.processingActivities, trimmed] });
    setCustomActivityInput("");
  };

  const handleActivityKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCustomActivity(customActivityInput);
    }
  };

  const handleMaturityChange = (value: string) => {
    setAutoFilledFields((prev) => { const n = new Set(prev); n.delete("maturityLevel"); return n; });
    onChange({ ...ctx, maturityLevel: value });
  };

  const AutoDetectedHint = ({ field, extra }: { field: string; extra?: string }) => {
    if (!autoFilledFields.has(field)) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[9px] text-primary font-medium animate-in fade-in-0 slide-in-from-left-2 duration-300">
        <Sparkles className="h-3 w-3" />
        {extra || "Auto-detected based on your profile"}
      </span>
    );
  };

  const personalDataTypes = ctx.personalDataTypes || [];

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 pt-4 px-5 cursor-pointer hover:bg-accent/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Organisation Profile
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                  {filled}/{total} fields
                </Badge>
              </CardTitle>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
            <Progress value={pct} className="h-1.5 mt-2" />
            {filled < total && (
              <p className="text-[9px] text-muted-foreground mt-1">
                Add {total - filled} more field{total - filled > 1 ? "s" : ""} for higher quality output
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-5 pb-4 space-y-4">
            {/* Row 1: Name */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Organisation Name *</label>
              <Input className="h-8 text-xs" value={ctx.orgName} onChange={(e) => onChange({ ...ctx, orgName: e.target.value })} placeholder="Acme Corp" />
            </div>

            {/* Industry — Multi-select tag input */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Industry Verticals</label>
              <p className="text-[9px] text-muted-foreground mb-2">Select multiple industries — the engine merges regulatory overlays from all selected</p>
              <div
                ref={industryDropdownRef}
                className="relative"
              >
                <div className={cn(
                  "flex flex-wrap gap-1.5 min-h-[36px] rounded-lg border border-border p-2 transition-all duration-300",
                  flashFields.has("industry") && "ring-2 ring-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)] border-primary/50"
                )}>
                  {industries.map((ind) => (
                    <Badge
                      key={ind}
                      variant="secondary"
                      className="text-[10px] gap-1 pr-1"
                    >
                      {ind}
                      <button
                        onClick={() => removeIndustry(ind)}
                        className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                  <div className="flex items-center gap-1 flex-1 min-w-[120px]">
                    <Input
                      className="h-6 text-[10px] border-0 bg-transparent shadow-none focus-visible:ring-0 px-1"
                      value={customIndustryInput}
                      onChange={(e) => {
                        setCustomIndustryInput(e.target.value);
                        setShowIndustryDropdown(true);
                      }}
                      onFocus={() => setShowIndustryDropdown(true)}
                      onKeyDown={handleIndustryKeyDown}
                      placeholder={industries.length === 0 ? "Select or type industries…" : "Add more…"}
                    />
                    {customIndustryInput.trim() && (
                      <button
                        onClick={() => addIndustry(customIndustryInput)}
                        className="p-0.5 rounded hover:bg-primary/10"
                      >
                        <Plus className="h-3 w-3 text-primary" />
                      </button>
                    )}
                  </div>
                </div>
                {/* Dropdown */}
                {showIndustryDropdown && filteredIndustryOptions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                    {filteredIndustryOptions.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => addIndustry(opt)}
                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Row 2: DPO + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">DPO / Privacy Lead</label>
                <Input className="h-8 text-xs" value={ctx.dpoName} onChange={(e) => onChange({ ...ctx, dpoName: e.target.value })} placeholder="Jane Doe" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Effective Date</label>
                <Input type="date" className="h-8 text-xs" value={ctx.date} onChange={(e) => onChange({ ...ctx, date: e.target.value })} />
              </div>
            </div>

            {/* Row 3: Org Size + SDF */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Organisation Size</label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={ctx.orgSize}
                  onChange={(e) => onChange({ ...ctx, orgSize: e.target.value })}
                >
                  <option value="">Select size</option>
                  {ORG_SIZE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <p className="text-[9px] text-muted-foreground mt-0.5">Scales obligation language to your size</p>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">DPDP Classification</label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={ctx.sdfClassification}
                  onChange={(e) => onChange({ ...ctx, sdfClassification: e.target.value })}
                >
                  <option value="">Select classification</option>
                  {SDF_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <p className="text-[9px] text-muted-foreground mt-0.5">SDFs have enhanced obligations under Rules 5, 6, 9, 10, 12</p>
              </div>
            </div>

            {/* Row 4: Geographies + Sub-Sector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Applicable Jurisdictions</label>
                <select
                  className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={ctx.geographies}
                  onChange={(e) => onChange({ ...ctx, geographies: e.target.value })}
                >
                  <option value="">Select jurisdictions</option>
                  {GEOGRAPHY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  {industries.length > 1 ? "Primary Sub-Sector (Optional)" : "Sub-Sector"}
                </label>
                <Input
                  className="h-8 text-xs"
                  value={ctx.sector}
                  onChange={(e) => onChange({ ...ctx, sector: e.target.value })}
                  placeholder={industries.length > 1 ? "e.g., Retail Banking, SaaS…" : "e.g., SaaS, Retail Banking…"}
                />
              </div>
            </div>

            {/* Row 5: Maturity */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-[11px] font-medium text-muted-foreground block">Compliance Maturity</label>
                <AutoDetectedHint field="maturityLevel" extra={industries.length > 1 ? `Highest maturity from ${industries.length} industries` : undefined} />
              </div>
              <div className="flex gap-1.5">
                {MATURITY_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => handleMaturityChange(m.value)}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium border transition-all text-center",
                      ctx.maturityLevel === m.value
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "border-border text-foreground/60 hover:border-primary/30",
                      ctx.maturityLevel === m.value && autoFilledFields.has("maturityLevel") &&
                        "ring-1 ring-primary/30 shadow-[0_0_6px_hsl(var(--primary)/0.2)]"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Types of Personal Data — dynamically populated */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Types of Personal Data
                </label>
                <AutoDetectedHint field="personalDataTypes" extra={industries.length > 1 ? `Auto-detected from ${industries.length} industries` : undefined} />
              </div>
              <p className="text-[9px] text-muted-foreground mb-2">Auto-tailored to your document type & industry — type and press Enter to add custom tags</p>
              <div className={cn(
                "flex flex-wrap gap-1.5 min-h-[32px] rounded-lg border border-border p-2 transition-all duration-500",
                flashFields.has("personalDataTypes") && "ring-2 ring-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)] border-primary/50"
              )}>
                {personalDataTypes.length === 0 && !customDataTypeInput && (
                  <span className="text-[10px] text-muted-foreground italic">Select a document type & industry to auto-populate</span>
                )}
                {personalDataTypes.map((dt) => (
                  <Badge
                    key={dt}
                    variant="secondary"
                    className={cn(
                      "text-[10px] gap-1 pr-1 transition-all duration-300",
                      flashFields.has("personalDataTypes") && "animate-in fade-in-0 zoom-in-95 duration-300"
                    )}
                  >
                    {dt}
                    <button
                      onClick={() => removeDataType(dt)}
                      className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
                <div className="flex items-center gap-1">
                  <Input
                    className="h-6 w-40 text-[10px] border-0 bg-transparent shadow-none focus-visible:ring-0 px-1"
                    value={customDataTypeInput}
                    onChange={(e) => setCustomDataTypeInput(e.target.value)}
                    onKeyDown={handleDataTypeKeyDown}
                    placeholder="Type & press Enter…"
                  />
                  {customDataTypeInput.trim() && (
                    <button
                      onClick={() => addCustomDataType(customDataTypeInput)}
                      className="p-0.5 rounded hover:bg-primary/10"
                    >
                      <Plus className="h-3 w-3 text-primary" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Processing Activities */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Processing Activities
                </label>
                <AutoDetectedHint field="processingActivities" extra={industries.length > 1 ? `Auto-detected from ${industries.length} industries` : undefined} />
              </div>
              <p className="text-[9px] text-muted-foreground mb-2">Select all that apply or type custom activities below — each activates specific legal obligations</p>
              <div className={cn(
                "grid grid-cols-2 gap-1.5 transition-all duration-500 rounded-lg",
                flashFields.has("processingActivities") && "ring-2 ring-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
              )}>
                {PROCESSING_ACTIVITIES.map((act) => (
                  <button
                    key={act}
                    onClick={() => toggleActivity(act)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-md text-[10px] font-medium border transition-all text-left",
                      ctx.processingActivities.includes(act)
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "border-border text-foreground/60 hover:border-primary/30",
                      ctx.processingActivities.includes(act) && flashFields.has("processingActivities") &&
                        "animate-in fade-in-0 duration-300"
                    )}
                  >
                    {act}
                  </button>
                ))}
              </div>
              {/* Custom / inferred activities as removable badges */}
              {ctx.processingActivities.filter((a) => !PROCESSING_ACTIVITIES.includes(a as any)).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ctx.processingActivities
                    .filter((a) => !PROCESSING_ACTIVITIES.includes(a as any))
                    .map((act) => (
                      <Badge
                        key={act}
                        variant="secondary"
                        className={cn(
                          "text-[10px] gap-1 pr-1 transition-all duration-300",
                          flashFields.has("processingActivities") && "animate-in fade-in-0 zoom-in-95 duration-300"
                        )}
                      >
                        {act}
                        <button
                          onClick={() => toggleActivity(act)}
                          className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                </div>
              )}
              {/* Custom activity input */}
              <div className="mt-2 flex items-center gap-2">
                <Input
                  className="h-7 text-[10px] flex-1"
                  value={customActivityInput}
                  onChange={(e) => setCustomActivityInput(e.target.value)}
                  onKeyDown={handleActivityKeyDown}
                  placeholder="Add custom activity… (press Enter)"
                />
                {customActivityInput.trim() && (
                  <button
                    onClick={() => addCustomActivity(customActivityInput)}
                    className="p-1 rounded hover:bg-primary/10"
                  >
                    <Plus className="h-3.5 w-3.5 text-primary" />
                  </button>
                )}
              </div>
            </div>

            {/* Additional Business Context */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                Additional Business Context & Instructions (Optional)
              </label>
              <Textarea
                className="text-xs min-h-[80px] resize-y"
                value={ctx.additionalContext || ""}
                onChange={(e) => onChange({ ...ctx, additionalContext: e.target.value })}
                placeholder="e.g., We host data on AWS Mumbai, our internal SLA for DSAR is 48 hours, we do not process biometric data, our key vendor for cloud is Azure..."
              />
              <p className="text-[9px] text-muted-foreground mt-1">
                These details will be embedded directly into the generated document as business rules
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
