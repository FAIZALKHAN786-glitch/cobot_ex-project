import { type IncidentStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: IncidentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config: Record<
    IncidentStatus,
    { label: string; color: string; bg: string }
  > = {
    reported: { label: "Reported", color: "text-slate-600", bg: "bg-slate-100 border-slate-200" },
    acknowledged: { label: "Acknowledged", color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
    dispatched: { label: "Dispatched", color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
    "on-scene": { label: "On Scene", color: "text-orange-600", bg: "bg-orange-50 border-orange-100" },
    resolved: { label: "Resolved", color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
    closed: { label: "Closed", color: "text-green-700", bg: "bg-green-50 border-green-100" },
    cancelled: { label: "Cancelled", color: "text-slate-500", bg: "bg-slate-200 border-slate-300" },
  };

  const c = config[status];
  if (!c) return null;
  return (
    <Badge
      className={cn(
        "border text-xs font-bold tracking-wider",
        c.bg,
        c.color,
        className
      )}
    >
      {c.label}
    </Badge>
  );
}
