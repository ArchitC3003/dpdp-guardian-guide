import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  SECTOR_MAP,
  ORG_SIZE_OPTIONS,
  SDF_OPTIONS,
  GEOGRAPHY_OPTIONS,
  PROCESSING_ACTIVITIES,
  MATURITY_OPTIONS,
  getOrgProfileCompleteness,
} from "./orgContextTypes";
import { inferSmartContext } from "@/utils/smartContextEngine";

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
  const prevTriggerRef = useRef<string>("");
  const userAddedActivities = useRef<Set<string>>(new Set());
  const userAddedDataTypes = useRef<Set<string>>(new Set());
  const { filled, total } = getOrgProfileCompleteness(ctx);
  const pct = Math.round((filled / total) * 100);

  const sectors = ctx.industry ? (SECTOR_MAP[ctx.industry] || ["General"]) : [];

  // Smart Context Inference — fires when trigger fields OR documentType change
  useEffect(() => {
    const triggerKey = `${ctx.industry}|${ctx.geographies}|${ctx.sdfClassification}|${documentType || ""}`;
    if (triggerKey === prevTriggerRef.current) return;
    prevTriggerRef.current = triggerKey;

    const result = inferSmartContext(ctx.industry, ctx.geographies, ctx.sdfClassification, documentType);
    if (!result) {
      setAutoFilledFields(new Set());
      return;
    }

    // Preserve user-added custom tags via set union
    const mergedActivities = Array.from(new Set([
      ...Array.from(userAddedActivities.current),
      ...result.processingActivities,
    ]));

    const mergedDataTypes = Array.from(new Set([
      ...Array.from(userAddedDataTypes.current),
      ...(result.personalDataTypes || []),
    ]));

    const newFields = new Set<string>();
    if (result.processingActivities.length > 0) newFields.add("processingActivities");
    if (result.personalDataTypes && result.personalDataTypes.length > 0) newFields.add("personalDataTypes");
    if (result.maturityLevel) newFields.add("maturityLevel");

    setAutoFilledFields(newFields);

    // Trigger flash animation
    setFlashFields(new Set(["processingActivities", "personalDataTypes"]));

    onChange({
      ...ctx,
      processingActivities: mergedActivities,
      personalDataTypes: mergedDataTypes,
      maturityLevel: result.maturityLevel,
    });

    // Clear sparkle indicators after 8s
    const timer = setTimeout(() => {
      setAutoFilledFields(new Set());
      setFlashFields(new Set());
    }, 8000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.industry, ctx.geographies, ctx.sdfClassification, documentType]);

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

  const AutoDetectedHint = ({ field }: { field: string }) => {
    if (!autoFilledFields.has(field)) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[9px] text-primary font-medium animate-in fade-in-0 slide-in-from-left-2 duration-300">
        <Sparkles className="h-3 w-3" />
        Auto-detected based on your profile
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
            {/* Row 1: Name + Industry */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Organisation Name *</label>
                <Input className="h-8 text-xs" value={ctx.orgName} onChange={(e) => onChange({ ...ctx, orgName: e.target.value })} placeholder="Acme Corp" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Industry</label>
                <Select value={ctx.industry} onValueChange={(v) => onChange({ ...ctx, industry: v, sector: "" })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select industry" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRY_OPTIONS.map((ind) => (
                      <SelectItem key={ind} value={ind} className="text-xs">{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Select value={ctx.orgSize} onValueChange={(v) => onChange({ ...ctx, orgSize: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select size" /></SelectTrigger>
                  <SelectContent>
                    {ORG_SIZE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[9px] text-muted-foreground mt-0.5">Scales obligation language to your size</p>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">DPDP Classification</label>
                <Select value={ctx.sdfClassification} onValueChange={(v) => onChange({ ...ctx, sdfClassification: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select classification" /></SelectTrigger>
                  <SelectContent>
                    {SDF_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[9px] text-muted-foreground mt-0.5">SDFs have enhanced obligations under Rules 5, 6, 9, 10, 12</p>
              </div>
            </div>

            {/* Row 4: Geographies + Sector */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Applicable Jurisdictions</label>
                <Select value={ctx.geographies} onValueChange={(v) => onChange({ ...ctx, geographies: v })}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select jurisdictions" /></SelectTrigger>
                  <SelectContent>
                    {GEOGRAPHY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Sub-Sector</label>
                <Select value={ctx.sector} onValueChange={(v) => onChange({ ...ctx, sector: v })} disabled={sectors.length === 0}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={sectors.length ? "Select sub-sector" : "Select industry first"} /></SelectTrigger>
                  <SelectContent>
                    {sectors.map((s) => (
                      <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 5: Maturity */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <label className="text-[11px] font-medium text-muted-foreground block">Compliance Maturity</label>
                <AutoDetectedHint field="maturityLevel" />
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
                <AutoDetectedHint field="personalDataTypes" />
              </div>
              <p className="text-[9px] text-muted-foreground mb-2">Auto-tailored to your document type & industry — click ✕ to remove</p>
              <div className={cn(
                "flex flex-wrap gap-1.5 min-h-[32px] rounded-lg border border-border p-2 transition-all duration-500",
                flashFields.has("personalDataTypes") && "ring-2 ring-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)] border-primary/50"
              )}>
                {personalDataTypes.length === 0 && (
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
              </div>
            </div>

            {/* Processing Activities */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Processing Activities
                </label>
                <AutoDetectedHint field="processingActivities" />
              </div>
              <p className="text-[9px] text-muted-foreground mb-2">Select all that apply — each activates specific legal obligations</p>
              <div className={cn(
                "grid grid-cols-2 gap-1.5 transition-all duration-500 rounded-lg",
                flashFields.has("processingActivities") && "ring-2 ring-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
              )}>
                {/* Standard activities from the constant list */}
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
              {/* Show additional inferred activities not in PROCESSING_ACTIVITIES */}
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
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
