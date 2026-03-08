import { useEffect } from "react";
import { X, History, RotateCcw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PolicyVersion } from "@/hooks/usePolicyVersioning";

interface Props {
  open: boolean;
  onClose: () => void;
  versions: PolicyVersion[];
  currentVersion: string;
  loading: boolean;
  onView: (content: string) => void;
  onRestore: (versionId: string) => void;
}

export default function VersionHistoryPanel({
  open,
  onClose,
  versions,
  currentVersion,
  loading,
  onView,
  onRestore,
}: Props) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Version History</h3>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Current version highlight */}
        <div className="px-5 py-3 bg-primary/5 border-b border-border">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Current Version</p>
          <Badge className="bg-primary/20 text-primary border-0 text-xs">v{currentVersion}</Badge>
        </div>

        {/* Version List */}
        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="p-5 space-y-3">
            {loading && (
              <p className="text-xs text-muted-foreground text-center py-8">Loading versions...</p>
            )}

            {!loading && versions.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">No version history yet.</p>
            )}

            {versions.map((v) => (
              <div
                key={v.id}
                className="rounded-lg border border-border p-4 space-y-2 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        v.is_current
                          ? "text-[10px] border-primary/40 text-primary bg-primary/10"
                          : "text-[10px]"
                      }
                    >
                      v{v.version}
                    </Badge>
                    {v.is_current && (
                      <span className="text-[9px] text-primary font-medium">Current</span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {v.change_summary && (
                  <p className="text-[11px] text-muted-foreground">{v.change_summary}</p>
                )}

                <div className="flex items-center gap-1.5">
                  <Badge variant="outline" className="text-[9px]">
                    {v.generated_by}
                  </Badge>
                  {v.ai_model && (
                    <Badge variant="outline" className="text-[9px] text-muted-foreground">
                      {v.ai_model}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-7 gap-1"
                    onClick={() => onView(v.content)}
                  >
                    <Eye className="h-3 w-3" /> View
                  </Button>
                  {!v.is_current && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[10px] h-7 gap-1 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => onRestore(v.id)}
                    >
                      <RotateCcw className="h-3 w-3" /> Restore
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
