import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    "In Progress": "bg-amber/10 text-amber",
    "Completed": "bg-emerald/10 text-emerald",
    "Yes": "bg-emerald/10 text-emerald",
    "Partial": "bg-amber/10 text-amber",
    "No": "bg-risk-critical/10 text-risk-critical",
    "N/A": "bg-muted text-muted-foreground",
    "Current": "bg-emerald/10 text-emerald",
    "Outdated": "bg-amber/10 text-amber",
    "Draft": "bg-risk-standard/10 text-risk-standard",
    "Missing": "bg-risk-critical/10 text-risk-critical",
  };

  return (
    <span className={cn("inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full", colors[status] || "bg-muted text-muted-foreground", className)}>
      {status}
    </span>
  );
}
