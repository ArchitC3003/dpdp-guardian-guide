import { useState, useEffect, useRef, useCallback, KeyboardEvent, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Building2, ChevronDown, Sparkles, X, Plus, AlertCircle, ClipboardList, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OrgContext,
  INDUSTRY_OPTIONS,
  SECTOR_MAP,
  ORG_SIZE_OPTIONS,
  SDF_OPTIONS,
  GEOGRAPHY_OPTIONS,
  PROCESSING_ACTIVITIES_CATALOGUE,
  MATURITY_OPTIONS,
  getOrgProfileQualityScore,
  type ProcessingActivity,
  type StructuredBusinessContext,
} from "./orgContextTypes";
import { inferSmartContext } from "@/utils/smartContextEngine";
import { normaliseIndustry } from "@/utils/industryNormaliser";
import { normaliseCustomEntry } from "@/utils/customEntryNormaliser";
import { KMSourcesPanel } from "@/components/km/KMSourcesPanel";
import { SectorInsightsPanel } from "@/components/km/SectorInsightsPanel";
import { getKMContext, type KMContext } from "@/services/kmRetrievalService";
import { getPersonalDataForIndustries } from "@/data/industryPersonalDataMap";
import { toast } from "sonner";

const CANONICAL_INDUSTRY_LIST = [...INDUSTRY_OPTIONS];

const MATURITY_RANK: Record<string, number> = {
  initial: 0,
  developing: 1,
  defined: 2,
  managed: 3,
  optimising: 4,
};

const SENSITIVE_KEYWORDS = ["biometric", "health", "genetic", "children", "aadhaar", "disability", "mental", "child"];

type DataSource = "static" | "ai" | "manual";

const DSAR_SLA_OPTIONS = ["24 hours", "48 hours", "72 hours", "7 days", "14 days", "30 days"];
const BREACH_SLA_OPTIONS = ["6 hours", "12 hours", "24 hours", "48 hours", "72 hours (DPDP Maximum)"];

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
  const [customSubSectorInput, setCustomSubSectorInput] = useState("");
  const [showSubSectorDropdown, setShowSubSectorDropdown] = useState(false);
  const [kmContext, setKmContext] = useState<KMContext | null>(null);
  const [kmLoading, setKmLoading] = useState(false);
  const [personalDataSources, setPersonalDataSources] = useState<Record<string, DataSource>>({});
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [highlightSection, setHighlightSection] = useState<string | null>(null);
  const prevTriggerRef = useRef<string>("");
  const kmTriggerRef = useRef<string>("");
  const docTypeTriggerRef = useRef<string>("");
  const userAddedActivities = useRef<Set<string>>(new Set());
  const userAddedDataTypes = useRef<Set<string>>(new Set());
  const industryDropdownRef = useRef<HTMLDivElement>(null);
  const subSectorDropdownRef = useRef<HTMLDivElement>(null);

  const industries = (ctx.industries || (ctx.industry ? [ctx.industry] : [])).map(normaliseIndustry);

  // Quality score
  const qualityScore = useMemo(() => getOrgProfileQualityScore(ctx, documentType), [ctx, documentType]);

  const progressColour = qualityScore.colour === "green"
    ? "bg-emerald-500"
    : qualityScore.colour === "amber"
      ? "bg-amber-500"
      : "bg-destructive";

  // Derive sub-sector options from selected industries
  const subSectorOptions = useMemo(() => {
    if (industries.length === 0) return [];
    if (industries.length === 1) {
      return (SECTOR_MAP[industries[0]] || []).map(s => ({ industry: industries[0], subSector: s }));
    }
    const result: { industry: string; subSector: string }[] = [];
    for (const ind of industries) {
      const subs = SECTOR_MAP[ind] || [];
      for (const s of subs) {
        if (!result.some(r => r.subSector === s)) {
          result.push({ industry: ind, subSector: s });
        }
      }
    }
    return result;
  }, [industries.join(",")]);

  const selectedSubSectors = useMemo(() => {
    if (!ctx.sector) return [];
    return ctx.sector.split(",").map(s => s.trim()).filter(Boolean);
  }, [ctx.sector]);

  // Recommended vs Other processing activities
  const { recommended, other } = useMemo(() => {
    const rec: ProcessingActivity[] = [];
    const oth: ProcessingActivity[] = [];
    for (const pa of PROCESSING_ACTIVITIES_CATALOGUE) {
      const isRecommended = pa.industries.includes("All") ||
        pa.industries.some(ind => industries.includes(ind));
      if (isRecommended) rec.push(pa);
      else oth.push(pa);
    }
    return { recommended: rec, other: oth };
  }, [industries.join(",")]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (industryDropdownRef.current && !industryDropdownRef.current.contains(e.target as Node)) {
        setShowIndustryDropdown(false);
      }
      if (subSectorDropdownRef.current && !subSectorDropdownRef.current.contains(e.target as Node)) {
        setShowSubSectorDropdown(false);
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

  // Phase 1: Auto-populate personal data from static map on industry/sector change
  useEffect(() => {
    if (industries.length === 0) return;
    const triggerKey = `static|${industries.join(",")}|${ctx.sector}`;
    if (triggerKey === prevTriggerRef.current + "_static") return;
    prevTriggerRef.current = prevTriggerRef.current.split("_static")[0] + "_static";

    const staticTypes = getPersonalDataForIndustries(industries);
    const existing = ctx.personalDataTypes || [];
    const manualItems = Array.from(userAddedDataTypes.current);

    // Merge: keep manual, add static, dedup
    const merged = new Set<string>([...manualItems, ...existing]);
    const newSources = { ...personalDataSources };
    let addedCount = 0;

    for (const dt of staticTypes) {
      if (!merged.has(dt)) {
        merged.add(dt);
        addedCount++;
      }
      if (!newSources[dt]) {
        newSources[dt] = "static";
      }
    }
    // Preserve manual sources
    for (const m of manualItems) {
      newSources[m] = "manual";
    }

    if (addedCount > 0 || staticTypes.length > 0) {
      setPersonalDataSources(newSources);
      onChange({ ...ctx, personalDataTypes: Array.from(merged) });
    }

    // Background KM AI enrichment
    const enrichAsync = async () => {
      try {
        const kmResult = await getKMContext(industries, ctx.sector, "policy-gen");
        if (kmResult?.personalDataTypes?.length) {
          const currentTypes = new Set(ctx.personalDataTypes || []);
          const currentSources = { ...personalDataSources };
          let aiAdded = 0;
          for (const dt of kmResult.personalDataTypes) {
            if (!currentTypes.has(dt)) {
              currentTypes.add(dt);
              aiAdded++;
            }
            if (!currentSources[dt]) {
              currentSources[dt] = "ai";
            }
          }
          if (aiAdded > 0) {
            setPersonalDataSources(currentSources);
            onChange({ ...ctx, personalDataTypes: Array.from(currentTypes) });
          }
        }
      } catch {
        // Graceful — AI enrichment is optional
      }
    };
    const timer = setTimeout(enrichAsync, 2000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industries.join(","), ctx.sector]);

  // Phase 2: Doc-type-specific enrichment
  useEffect(() => {
    if (!documentType || industries.length === 0) return;
    const triggerKey = `doctype|${documentType}|${industries.join(",")}`;
    if (triggerKey === docTypeTriggerRef.current) return;
    docTypeTriggerRef.current = triggerKey;

    const enrichAsync = async () => {
      try {
        const kmResult = await getKMContext(industries, ctx.sector, "policy-gen");
        if (kmResult?.personalDataTypes?.length) {
          const currentTypes = new Set(ctx.personalDataTypes || []);
          const currentSources = { ...personalDataSources };
          let added = 0;
          for (const dt of kmResult.personalDataTypes) {
            if (!currentTypes.has(dt)) {
              currentTypes.add(dt);
              currentSources[dt] = "ai";
              added++;
            }
          }
          if (added > 0) {
            setPersonalDataSources(currentSources);
            onChange({ ...ctx, personalDataTypes: Array.from(currentTypes) });
            toast.success(`Added ${added} additional data types for ${documentType}`);
          }
        }
      } catch {
        // Graceful
      }
    };
    const timer = setTimeout(enrichAsync, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentType, industries.join(",")]);

  // KM Context fetch — debounced on industry/subSector change
  const fetchKMContext = useCallback(async () => {
    if (industries.length === 0) {
      setKmContext(null);
      return;
    }
    setKmLoading(true);
    try {
      const result = await getKMContext(industries, ctx.sector, "policy-gen");
      setKmContext(result);
    } catch {
      // Graceful degradation
    } finally {
      setKmLoading(false);
    }
  }, [industries, ctx.sector]);

  useEffect(() => {
    const triggerKey = `${industries.join(",")}|${ctx.sector}`;
    if (triggerKey === kmTriggerRef.current) return;
    kmTriggerRef.current = triggerKey;
    if (industries.length === 0) return;
    const timer = setTimeout(() => fetchKMContext(), 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industries.join(","), ctx.sector]);

  // Highlight pulse animation
  useEffect(() => {
    if (!highlightSection) return;
    const timer = setTimeout(() => setHighlightSection(null), 1500);
    return () => clearTimeout(timer);
  }, [highlightSection]);

  const scrollToSection = (sectionRef: string) => {
    const el = document.getElementById(sectionRef);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightSection(sectionRef);
    }
  };

  const setIndustries = (next: string[]) => {
    const normalised = next.map(normaliseIndustry);
    onChange({
      ...ctx,
      industries: normalised,
      industry: normalised[0] || "",
      sector: "",
    });
  };

  const addIndustry = (ind: string) => {
    const trimmed = normaliseIndustry(ind.trim());
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

  const filteredIndustryOptions = CANONICAL_INDUSTRY_LIST.filter(
    (opt) => !industries.includes(opt) && opt.toLowerCase().includes(customIndustryInput.toLowerCase())
  );

  const addSubSector = (sub: string) => {
    const trimmed = sub.trim();
    if (!trimmed || selectedSubSectors.includes(trimmed)) return;
    const next = [...selectedSubSectors, trimmed].join(", ");
    onChange({ ...ctx, sector: next });
    setCustomSubSectorInput("");
    setShowSubSectorDropdown(false);
  };

  const removeSubSector = (sub: string) => {
    const next = selectedSubSectors.filter(s => s !== sub).join(", ");
    onChange({ ...ctx, sector: next });
  };

  const handleSubSectorKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSubSector(customSubSectorInput);
    }
  };

  const filteredSubSectorOptions = subSectorOptions.filter(
    (opt) => !selectedSubSectors.includes(opt.subSector) &&
      opt.subSector.toLowerCase().includes(customSubSectorInput.toLowerCase())
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
    const newSources = { ...personalDataSources };
    delete newSources[dt];
    setPersonalDataSources(newSources);
    onChange({ ...ctx, personalDataTypes: (ctx.personalDataTypes || []).filter((d) => d !== dt) });
  };

  const addCustomDataType = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const result = normaliseCustomEntry(trimmed, "personal-data");
    const finalValue = result.normalised;
    const existing = ctx.personalDataTypes || [];
    if (existing.includes(finalValue)) return;
    if (result.original !== result.normalised) {
      toast.success(`Normalised: '${result.original}' → '${result.normalised}' (${result.dpdpReference})`);
    }
    userAddedDataTypes.current.add(finalValue);
    setPersonalDataSources(prev => ({ ...prev, [finalValue]: "manual" }));
    onChange({ ...ctx, personalDataTypes: [...existing, finalValue] });
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
    const result = normaliseCustomEntry(trimmed, "processing-activity");
    const finalValue = result.normalised;
    if (ctx.processingActivities.includes(finalValue)) return;
    if (result.original !== result.normalised) {
      toast.success(`Normalised: '${result.original}' → '${result.normalised}' (${result.dpdpReference})`);
    }
    userAddedActivities.current.add(finalValue);
    onChange({ ...ctx, processingActivities: [...ctx.processingActivities, finalValue] });
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

  const updateStructuredContext = (field: keyof StructuredBusinessContext, value: string) => {
    onChange({
      ...ctx,
      structuredContext: { ...(ctx.structuredContext || {}), [field]: value },
    });
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

  const isSensitiveDataType = (dt: string): boolean => {
    const lower = dt.toLowerCase();
    if (SENSITIVE_KEYWORDS.some(kw => lower.includes(kw))) return true;
    const result = normaliseCustomEntry(dt, "personal-data");
    return result.isSensitive;
  };

  const getSourceBadge = (dt: string) => {
    const source = personalDataSources[dt];
    if (source === "ai") return <span className="text-[7px] px-1 py-0 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold">✨ AI</span>;
    if (source === "manual") return <span className="text-[7px] px-1 py-0 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold">✏️</span>;
    return <span className="text-[7px] px-1 py-0 rounded bg-muted text-muted-foreground font-semibold">KB</span>;
  };

  const catalogueLabels = useMemo(() => new Set(PROCESSING_ACTIVITIES_CATALOGUE.map(pa => pa.label)), []);

  const ClauseImpactTooltip = ({ text }: { text: string }) => (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ClipboardList className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="font-medium">📋 Clause Impact</p>
          <p className="text-muted-foreground">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const renderActivityChip = (pa: ProcessingActivity, isActive: boolean) => (
    <TooltipProvider key={pa.id} delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => toggleActivity(pa.label)}
            className={cn(
              "px-2.5 py-1.5 rounded-md text-[10px] font-medium border transition-all text-left flex items-center gap-1",
              isActive
                ? "bg-primary/15 border-primary/40 text-primary"
                : "border-border text-foreground/60 hover:border-primary/30",
              isActive && flashFields.has("processingActivities") &&
                "animate-in fade-in-0 duration-300"
            )}
          >
            {pa.isSensitive && <span className="inline-block w-2 h-2 rounded-full bg-destructive flex-shrink-0" />}
            {pa.label}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs">
          <p className="font-semibold">{pa.legalBasis}</p>
          <p className="text-muted-foreground">DPDP: {pa.dpdpSection}</p>
          {pa.isSensitive && <p className="text-destructive font-medium mt-1">⚠ Sensitive — enhanced obligations apply</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const sectionClass = (id: string) => cn(
    "transition-all duration-500",
    highlightSection === id && "ring-2 ring-primary/50 rounded-lg shadow-[0_0_16px_hsl(var(--primary)/0.2)] p-2 -m-2"
  );

  const sc = ctx.structuredContext || {};

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 pt-4 px-5 cursor-pointer hover:bg-accent/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Organisation Profile
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  qualityScore.colour === "green" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" :
                  qualityScore.colour === "amber" ? "bg-amber-500/15 text-amber-700 dark:text-amber-400" :
                  "bg-destructive/15 text-destructive"
                )}>
                  {qualityScore.percentage}%
                </span>
              </CardTitle>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
            <div className="relative h-1.5 mt-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700 ease-out", progressColour)}
                style={{ width: `${qualityScore.percentage}%` }}
              />
            </div>
            {qualityScore.percentage < 100 && (
              <p className="text-[9px] text-muted-foreground mt-1">
                Quality Score: {qualityScore.percentage}% — {qualityScore.fields.filter(f => !f.filled).length} field{qualityScore.fields.filter(f => !f.filled).length > 1 ? "s" : ""} can improve output
              </p>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-5 pb-4 space-y-4">
            {/* Quality nudge panel */}
            {qualityScore.fields.some(f => !f.filled) && (
              <Collapsible open={nudgeOpen} onOpenChange={setNudgeOpen}>
                <CollapsibleTrigger className="w-full text-left">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1">
                    <Info className="h-3 w-3" />
                    <span>Improve your document quality</span>
                    <ChevronDown className={cn("h-3 w-3 transition-transform", nudgeOpen && "rotate-180")} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="space-y-1 mt-1 mb-3 pl-1">
                    {qualityScore.fields.filter(f => !f.filled).map(f => (
                      <button
                        key={f.fieldName}
                        onClick={() => f.sectionRef && scrollToSection(f.sectionRef)}
                        className="w-full text-left flex items-start gap-2 py-1.5 px-2 rounded hover:bg-accent/50 transition-colors group"
                      >
                        <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-medium text-foreground group-hover:text-primary transition-colors">{f.label}</p>
                          <p className="text-[9px] text-muted-foreground">{f.impact}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Row 1: Name */}
            <div id="org-basics" className={sectionClass("org-basics")}>
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Organisation Name *</label>
              <Input className="h-8 text-xs" value={ctx.orgName} onChange={(e) => onChange({ ...ctx, orgName: e.target.value })} placeholder="Acme Corp" />
            </div>

            {/* Industry — Multi-select tag input */}
            <div id="org-industry" className={sectionClass("org-industry")}>
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

            {/* KM Sources Panel */}
            <KMSourcesPanel kmContext={kmContext} loading={kmLoading} />

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
              <div id="org-classification" className={sectionClass("org-classification")}>
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
              <div id="org-geography" className={sectionClass("org-geography")}>
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
              <div id="org-subsector" className={sectionClass("org-subsector")}>
                <label className="text-[11px] font-medium text-muted-foreground mb-1 block">
                  Sub-Sector(s)
                </label>
                <div ref={subSectorDropdownRef} className="relative">
                  <div className="flex flex-wrap gap-1 min-h-[32px] rounded-md border border-input p-1.5">
                    {selectedSubSectors.map((sub) => (
                      <Badge key={sub} variant="secondary" className="text-[9px] gap-1 pr-0.5">
                        {sub}
                        <button onClick={() => removeSubSector(sub)} className="ml-0.5 rounded-full hover:bg-destructive/20 p-0.5">
                          <X className="h-2 w-2" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      className="h-5 text-[10px] border-0 bg-transparent shadow-none focus-visible:ring-0 px-1 flex-1 min-w-[80px]"
                      value={customSubSectorInput}
                      onChange={(e) => {
                        setCustomSubSectorInput(e.target.value);
                        setShowSubSectorDropdown(true);
                      }}
                      onFocus={() => setShowSubSectorDropdown(true)}
                      onKeyDown={handleSubSectorKeyDown}
                      placeholder={industries.length === 0 ? "Select industry first" : "Search sub-sectors…"}
                      disabled={industries.length === 0}
                    />
                  </div>
                  {showSubSectorDropdown && filteredSubSectorOptions.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                      {industries.length > 1 ? (
                        industries.map((ind) => {
                          const items = filteredSubSectorOptions.filter(o => o.industry === ind);
                          if (items.length === 0) return null;
                          return (
                            <div key={ind}>
                              <div className="px-3 py-1 text-[9px] font-semibold text-muted-foreground bg-muted/50 sticky top-0">{ind}</div>
                              {items.map((opt) => (
                                <button
                                  key={`${ind}-${opt.subSector}`}
                                  onClick={() => addSubSector(opt.subSector)}
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors"
                                >
                                  {opt.subSector}
                                </button>
                              ))}
                            </div>
                          );
                        })
                      ) : (
                        filteredSubSectorOptions.map((opt) => (
                          <button
                            key={opt.subSector}
                            onClick={() => addSubSector(opt.subSector)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent/50 transition-colors"
                          >
                            {opt.subSector}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sector Insights Panel */}
            <SectorInsightsPanel kmContext={kmContext} loading={kmLoading} onRegenerate={fetchKMContext} />

            {/* Row 5: Maturity */}
            <div id="org-maturity" className={sectionClass("org-maturity")}>
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

            {/* Types of Personal Data */}
            <div id="org-datatypes" className={sectionClass("org-datatypes")}>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Types of Personal Data
                </label>
                <AutoDetectedHint field="personalDataTypes" extra={industries.length > 1 ? `Auto-detected from ${industries.length} industries` : undefined} />
              </div>
              <p className="text-[9px] text-muted-foreground mb-2">Auto-populated from industry knowledge base & AI — type and press Enter to add custom tags</p>
              <div className={cn(
                "flex flex-wrap gap-1.5 min-h-[32px] rounded-lg border border-border p-2 transition-all duration-500",
                flashFields.has("personalDataTypes") && "ring-2 ring-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)] border-primary/50"
              )}>
                {personalDataTypes.length === 0 && !customDataTypeInput && (
                  <span className="text-[10px] text-muted-foreground italic">Select an industry to auto-populate</span>
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
                    {isSensitiveDataType(dt) && <span className="inline-block w-2 h-2 rounded-full bg-destructive flex-shrink-0" />}
                    {getSourceBadge(dt)}
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
            <div id="org-activities" className={sectionClass("org-activities")}>
              <div className="flex items-center gap-2 mb-1.5">
                <label className="text-[11px] font-medium text-muted-foreground block">
                  Processing Activities
                </label>
                <AutoDetectedHint field="processingActivities" extra={industries.length > 1 ? `Auto-detected from ${industries.length} industries` : undefined} />
              </div>

              {recommended.length > 0 && (
                <div className="mb-3">
                  <p className="text-[9px] text-primary font-medium mb-1.5 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Recommended for your industry
                  </p>
                  <div className={cn(
                    "grid grid-cols-2 gap-1.5 transition-all duration-500 rounded-lg",
                    flashFields.has("processingActivities") && "ring-2 ring-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                  )}>
                    {recommended.map((pa) => renderActivityChip(pa, ctx.processingActivities.includes(pa.label)))}
                  </div>
                </div>
              )}

              {other.length > 0 && (
                <Collapsible>
                  <CollapsibleTrigger className="text-[9px] text-muted-foreground hover:text-foreground flex items-center gap-1 mb-1.5">
                    <ChevronDown className="h-3 w-3" /> Other Activities ({other.length})
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-1.5">
                      {other.map((pa) => renderActivityChip(pa, ctx.processingActivities.includes(pa.label)))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              {ctx.processingActivities.filter((a) => !catalogueLabels.has(a)).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {ctx.processingActivities
                    .filter((a) => !catalogueLabels.has(a))
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

            {/* Quick Business Facts */}
            <div id="org-structured-context" className={sectionClass("org-structured-context")}>
              <label className="text-[11px] font-semibold text-foreground mb-2 block">Quick Business Facts</label>
              <p className="text-[9px] text-muted-foreground mb-3">These facts are injected as absolute business rules into the generated document</p>

              <div className="space-y-3">
                {/* Cloud Provider */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Cloud/Hosting Provider</label>
                    <ClauseImpactTooltip text="Generates specific data residency clauses, processor agreement requirements, and cloud security obligations" />
                  </div>
                  <Input
                    className="h-7 text-xs"
                    value={sc.cloudProvider || ""}
                    onChange={(e) => updateStructuredContext("cloudProvider", e.target.value)}
                    placeholder="e.g., AWS, Azure, GCP, On-Premise"
                  />
                </div>

                {/* DSAR + Breach SLA */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <label className="text-[10px] font-medium text-muted-foreground">DSAR Response SLA</label>
                      <ClauseImpactTooltip text="Sets the committed response timeline in DSAR procedures and generates SLA monitoring clauses" />
                    </div>
                    <select
                      className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={sc.dsarSla || ""}
                      onChange={(e) => updateStructuredContext("dsarSla", e.target.value)}
                    >
                      <option value="">Select SLA</option>
                      {DSAR_SLA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <label className="text-[10px] font-medium text-muted-foreground">Breach Notification SLA</label>
                      <ClauseImpactTooltip text="Defines breach notification timeline to DPB and affected data principals under S.8(6)" />
                    </div>
                    <select
                      className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={sc.breachNotificationSla || ""}
                      onChange={(e) => updateStructuredContext("breachNotificationSla", e.target.value)}
                    >
                      <option value="">Select SLA</option>
                      {BREACH_SLA_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>

                {/* Payment Processors */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Payment Processors</label>
                    <ClauseImpactTooltip text="Generates PCI DSS references, payment data handling clauses, and processor-specific DPA requirements" />
                  </div>
                  <Input
                    className="h-7 text-xs"
                    value={sc.paymentProcessors || ""}
                    onChange={(e) => updateStructuredContext("paymentProcessors", e.target.value)}
                    placeholder="e.g., Razorpay, Stripe, PayU, CCAvenue"
                  />
                </div>

                {/* Children's Data */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Children's Data Processing</label>
                    <ClauseImpactTooltip text="Triggers Section 9 obligations: verifiable parental consent, age verification, and children's data protection clauses" />
                  </div>
                  <RadioGroup
                    value={sc.childrenDataProcessing || ""}
                    onValueChange={(v) => updateStructuredContext("childrenDataProcessing", v)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="yes" id="children-yes" className="h-3 w-3" />
                      <Label htmlFor="children-yes" className="text-[10px]">Yes</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="no" id="children-no" className="h-3 w-3" />
                      <Label htmlFor="children-no" className="text-[10px]">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Key Vendors */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="text-[10px] font-medium text-muted-foreground">Key Third-Party Vendors</label>
                    <ClauseImpactTooltip text="Generates vendor-specific DPA requirements, sub-processor lists, and third-party risk clauses" />
                  </div>
                  <Textarea
                    className="text-xs min-h-[48px] resize-y"
                    rows={2}
                    value={sc.keyThirdPartyVendors || ""}
                    onChange={(e) => updateStructuredContext("keyThirdPartyVendors", e.target.value)}
                    placeholder="e.g., Salesforce (CRM), Freshworks (Support), AWS (Hosting)"
                  />
                </div>
              </div>
            </div>

            {/* Additional Business Context */}
            <div id="org-context" className={sectionClass("org-context")}>
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
