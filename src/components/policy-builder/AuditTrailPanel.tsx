import { AuditEntry } from "@/hooks/usePolicyVersioning";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface Props {
  entries: AuditEntry[];
  loading: boolean;
}

const ACTION_COLORS: Record<string, string> = {
  Created: "bg-primary/15 text-primary border-primary/20",
  Updated: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  "Status Changed": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  Exported: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  Approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  Regenerated: "bg-primary/15 text-primary border-primary/20",
  Shared: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

const DOT_COLORS: Record<string, string> = {
  Created: "bg-primary",
  Updated: "bg-blue-400",
  "Status Changed": "bg-amber-400",
  Exported: "bg-purple-400",
  Approved: "bg-emerald-400",
  Regenerated: "bg-primary",
  Shared: "bg-blue-400",
};

export default function AuditTrailPanel({ entries, loading }: Props) {
  if (loading) {
    return <p className="text-xs text-muted-foreground text-center py-8">Loading audit trail...</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
        <FileText className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No audit events yet</p>
        <p className="text-[10px] text-muted-foreground/60">
          Actions like creating, updating, and exporting documents will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-0">
      {/* Vertical timeline line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" />

      {entries.map((entry, i) => (
        <div key={entry.id} className="relative pb-5 last:pb-0">
          {/* Dot */}
          <div
            className={cn(
              "absolute left-[-15px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-card",
              DOT_COLORS[entry.action] || "bg-muted-foreground"
            )}
          />

          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] px-1.5 py-0",
                  ACTION_COLORS[entry.action] || ""
                )}
              >
                {entry.action}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                {new Date(entry.performed_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            {entry.action_detail && (
              <p className="text-[11px] text-foreground/70">{entry.action_detail}</p>
            )}
            {entry.performed_by_name && (
              <p className="text-[10px] text-muted-foreground">by {entry.performed_by_name}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
