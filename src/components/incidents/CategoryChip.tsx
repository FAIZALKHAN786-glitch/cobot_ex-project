import { type IncidentCategory } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CategoryChipProps {
  category: IncidentCategory;
  className?: string;
}

export function CategoryChip({ category, className }: CategoryChipProps) {
  const config: Record<
    IncidentCategory,
    { label: string; color: string; bg: string }
  > = {
    fire: { label: "Fire", color: "text-red-700", bg: "bg-red-50 border-red-100" },
    medical: { label: "Medical", color: "text-blue-700", bg: "bg-blue-50 border-blue-100" },
    flood: { label: "Flood", color: "text-cyan-700", bg: "bg-cyan-50 border-cyan-100" },
    earthquake: { label: "Earthquake", color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
    police: { label: "Police / Crime", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-100" },
    infrastructure: { label: "Infrastructure", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
    other: { label: "Other", color: "text-slate-700", bg: "bg-slate-50 border-slate-100" },
  };

  const c = config[category];
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
