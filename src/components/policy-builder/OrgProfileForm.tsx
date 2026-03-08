import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Building2, ChevronDown } from "lucide-react";
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

interface Props {
  ctx: OrgContext;
  onChange: (ctx: OrgContext) => void;
  compact?: boolean;
}

export default function OrgProfileForm({ ctx, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(true);
  const { filled, total } = getOrgProfileCompleteness(ctx);
  const pct = Math.round((filled / total) * 100);

  const sectors = ctx.industry ? (SECTOR_MAP[ctx.industry] || ["General"]) : [];

  const toggleActivity = (act: string) => {
    const next = ctx.processingActivities.includes(act)
      ? ctx.processingActivities.filter((a) => a !== act)
      : [...ctx.processingActivities, act];
    onChange({ ...ctx, processingActivities: next });
  };

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
              <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Compliance Maturity</label>
              <div className="flex gap-1.5">
                {MATURITY_OPTIONS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => onChange({ ...ctx, maturityLevel: m.value })}
                    className={cn(
                      "flex-1 px-2 py-1.5 rounded-md text-[10px] font-medium border transition-all text-center",
                      ctx.maturityLevel === m.value
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "border-border text-foreground/60 hover:border-primary/30"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Processing Activities */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground mb-1.5 block">
                Processing Activities
              </label>
              <p className="text-[9px] text-muted-foreground mb-2">Select all that apply — each activates specific legal obligations</p>
              <div className="grid grid-cols-2 gap-1.5">
                {PROCESSING_ACTIVITIES.map((act) => (
                  <button
                    key={act}
                    onClick={() => toggleActivity(act)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-md text-[10px] font-medium border transition-all text-left",
                      ctx.processingActivities.includes(act)
                        ? "bg-primary/15 border-primary/40 text-primary"
                        : "border-border text-foreground/60 hover:border-primary/30"
                    )}
                  >
                    {act}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
