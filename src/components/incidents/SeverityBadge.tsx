import { type IncidentSeverity } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: IncidentSeverity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const config: Record<
    IncidentSeverity,
    { label: string; color: string; bg: string; glow: string }
  > = {
    low: { label: "Low", color: "text-sky-600", bg: "bg-sky-50 border-sky-100", glow: "shadow-[0_0_12px_hsl(var(--severity-low)/0.3)]" },
    medium: {
      label: "Medium",
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      glow: "shadow-[0_0_12px_hsl(var(--severity-medium)/0.3)]",
    },
    high: { label: "High", color: "text-orange-600", bg: "bg-orange-50 border-orange-100", glow: "shadow-[0_0_12px_hsl(var(--severity-high)/0.3)]" },
    critical: {
      label: "Critical",
      color: "text-critical-600",
      bg: "bg-critical-50 border-critical-100",
      glow: "shadow-[0_0_16px_hsl(var(--severity-critical)/0.4)] animate-pulse-slow",
    },
  };

  const c = config[severity];
  if (!c) return null;
  return (
    <Badge
      className={cn(
        "border text-xs font-bold tracking-wider",
        c.bg,
        c.color,
        c.glow,
        className
      )}
    >
      {c.label}
    </Badge>
  );
}
