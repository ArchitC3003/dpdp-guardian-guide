import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  risk: "critical" | "high" | "standard";
  className?: string;
}

const config = {
  critical: { label: "●●● Critical", className: "text-risk-critical bg-risk-critical/10" },
  high: { label: "●● High", className: "text-risk-high bg-risk-high/10" },
  standard: { label: "● Standard", className: "text-risk-standard bg-risk-standard/10" },
};

export function RiskBadge({ risk, className }: RiskBadgeProps) {
  const c = config[risk];
  return (
    <span className={cn("inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full", c.className, className)}>
      {c.label}
    </span>
  );
}
