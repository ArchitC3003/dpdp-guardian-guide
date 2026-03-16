import { ExternalLink, BookOpen, FileText, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { KMContext } from "@/services/kmRetrievalService";

interface Props {
  kmContext: KMContext | null;
  loading: boolean;
}

export function KMSourcesPanel({ kmContext, loading }: Props) {
  const [open, setOpen] = useState(false);

  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-3 w-64" />
        </CardContent>
      </Card>
    );
  }

  if (!kmContext || (kmContext.regulatorySources.length === 0 && kmContext.artefacts.length === 0)) {
    return null;
  }

  const sourceCount = kmContext.regulatorySources.length;
  const artefactCount = kmContext.artefacts.length;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-3 cursor-pointer hover:bg-primary/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Knowledge Sources Active</span>
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                  {sourceCount + artefactCount}
                </Badge>
              </div>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">
              AI context powered by {artefactCount} artefact{artefactCount !== 1 ? "s" : ""} + {sourceCount} regulatory source{sourceCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            {/* Regulatory Authorities */}
            {sourceCount > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5">📚 Regulatory Authorities</p>
                <div className="flex flex-wrap gap-1.5">
                  {kmContext.regulatorySources.map((src, i) => (
                    <a
                      key={`${src.authority}-${i}`}
                      href={src.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[9px] px-2 py-1 rounded-full border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title={`${src.framework} — ${src.description}`}
                    >
                      {src.authority}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Internal Artefacts */}
            {artefactCount > 0 && (
              <div>
                <p className="text-[10px] font-medium text-muted-foreground mb-1.5">📄 Internal Artefacts Used</p>
                <div className="space-y-1">
                  {kmContext.artefacts.slice(0, 5).map((art) => (
                    <div key={art.id} className="flex items-center gap-2 text-[10px]">
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="text-foreground truncate">{art.title}</span>
                      <Badge variant="outline" className="text-[8px] px-1 py-0 shrink-0">{art.docType}</Badge>
                      <Badge variant="secondary" className="text-[8px] px-1 py-0 shrink-0">{art.version}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <p className="text-[8px] text-muted-foreground border-t border-border pt-2">
              Knowledge snapshot: {kmContext.knowledgeSnapshotDate} | Powered by Gemini + PrivCybHub Artefact Repository
            </p>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
