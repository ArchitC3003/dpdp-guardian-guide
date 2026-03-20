import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { OrgContext, MATURITY_OPTIONS } from "./orgContextTypes";

interface Props {
  ctx: OrgContext;
}

export default function ComplianceProfileSummary({ ctx }: Props) {
  if (!ctx.orgName.trim()) return null;

  const alerts: { emoji: string; text: string; variant: "destructive" | "default" | "secondary" | "outline" }[] = [];

  if (ctx.sdfClassification === "sdf") {
    alerts.push({
      emoji: "⚠",
      text: "Significant Data Fiduciary — Enhanced obligations under Rules 5, 6, 9, 10, 12 apply",
      variant: "destructive",
    });
  }
  if (ctx.processingActivities.includes("Children's Data (under 18)")) {
    alerts.push({
      emoji: "👶",
      text: "Children's Data Processor — Section 9 + Rule 10 obligations activated",
      variant: "default",
    });
  }
  if (ctx.processingActivities.includes("Cross-border Data Transfers")) {
    alerts.push({
      emoji: "🌐",
      text: "Cross-Border Transfers — DPDP Schedule 1 + adequacy assessment required",
      variant: "default",
    });
  }
  if (ctx.industry?.includes("BFSI") || ctx.industry?.includes("Banking") || ctx.industry?.includes("Insurance")) {
    alerts.push({ emoji: "🏦", text: "BFSI Sector — RBI IT Governance overlay applicable", variant: "secondary" });
  }
  if (ctx.industry?.includes("Health")) {
    alerts.push({
      emoji: "🏥",
      text: "Healthcare Sector — DISHA + NHA Digital Health guidelines applicable",
      variant: "secondary",
    });
  }

  const maturityLabel = MATURITY_OPTIONS.find((m) => m.value === ctx.maturityLevel)?.label;

  if (alerts.length === 0 && !maturityLabel) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-2 pt-3 px-5">
        <CardTitle className="text-xs font-semibold flex items-center gap-2 text-primary">
          <Shield className="h-3.5 w-3.5" /> Your Compliance Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-3 space-y-1.5">
        {alerts.map((a, i) => (
          <p key={i} className="text-[11px] text-foreground/80 flex items-start gap-1.5">
            <span>{a.emoji}</span>
            <span>{a.text}</span>
          </p>
        ))}
        {maturityLabel && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-muted-foreground">Maturity:</span>
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
              {maturityLabel}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
