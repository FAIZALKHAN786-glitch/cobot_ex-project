import { Link } from "react-router-dom";
import { type Incident } from "@/types";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { CategoryChip } from "./CategoryChip";
import { Card } from "@/components/ui/card";
import { formatRelativeTime } from "@/lib/utils";
import { MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface IncidentCardProps {
  incident: Incident;
}

export function IncidentCard({ incident }: IncidentCardProps) {
  return (
    <Card
      className={cn(
        "border border-slate-200 transition-all duration-300 var(--ease-out) hover-lift:translate-y--1 hover:shadow-xl hover:border-critical-100 hover-lift:translate-y--1 group",
        "hover-glow:hover"
      )}
    >
      <div className="p-5 animate-enter">
        <div className="flex justify-between items-start gap-2 mb-3">
          <Link
            to={`/admin/incidents/${incident.id}`}
            className="text-lg font-bold text-slate-900 hover:text-critical-600 transition-colors group-hover:text-critical-700"
          >
            {incident.title}
          </Link>
          <span className="text-xs font-mono text-slate-400">
            {incident.referenceNumber}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <CategoryChip category={incident.category} />
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-1.5 p-1.5 rounded bg-slate-50 text-slate-500">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{incident.location.address}</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeTime(incident.createdAt)}</span>
          </div>
          <span className="font-medium text-slate-700 group-hover:text-critical-600 transition-colors">
            {incident.assignedTo || "Unassigned"}
          </span>
        </div>
      </div>
    </Card>
  );
}
