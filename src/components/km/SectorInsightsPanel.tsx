import { Lightbulb, RefreshCw, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { KMContext } from "@/services/kmRetrievalService";

interface Props {
  kmContext: KMContext | null;
  loading: boolean;
  onRegenerate: () => void;
}

export function SectorInsightsPanel({ kmContext, loading, onRegenerate }: Props) {
  if (loading) {
    return (
      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-12 w-full" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kmContext || (!kmContext.subSectorInsights && kmContext.mandatoryCompliances.length === 0)) {
    return null;
  }

  return (
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardContent className="p-3 space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-semibold text-foreground">Privacy Risk Snapshot</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-muted-foreground hover:text-foreground px-2"
            onClick={onRegenerate}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Regenerate
          </Button>
        </div>

        {/* Insights narrative */}
        {kmContext.subSectorInsights && (
          <p className="text-[11px] text-foreground/80 leading-relaxed">
            {kmContext.subSectorInsights}
          </p>
        )}

        {/* Framework chips */}
        {kmContext.frameworksCovered.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {kmContext.frameworksCovered.slice(0, 8).map((fw) => (
              <Badge
                key={fw}
                variant="outline"
                className="text-[9px] px-1.5 py-0 border-primary/30 text-primary"
              >
                {fw}
              </Badge>
            ))}
          </div>
        )}

        {/* Mandatory compliances */}
        {kmContext.mandatoryCompliances.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground">Key Obligations</p>
            {kmContext.mandatoryCompliances.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-start gap-1.5 text-[10px] text-foreground/80">
                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
