import { Link } from "react-router-dom";
import { type Incident } from "@/types";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";
import { CategoryChip } from "./CategoryChip";
import { formatDateTime } from "@/lib/utils";
import { MoreHorizontal, Edit2 } from "lucide-react";

interface IncidentTableRowProps {
  incident: Incident;
  onEdit?: (incident: Incident) => void;
}

export function IncidentTableRow({
  incident,
  onEdit,
}: IncidentTableRowProps) {
  return (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition-bg">
      <td className="p-4 text-sm font-medium text-slate-900">
        {incident.referenceNumber}
      </td>
      <td className="p-4 text-sm text-slate-600">
        {formatDateTime(incident.createdAt)}
      </td>
      <td className="p-4 text-sm text-slate-600">
        {incident.reporterName || "—"}
      </td>
      <td className="p-4">
        <CategoryChip category={incident.category} />
      </td>
      <td className="p-4">
        <SeverityBadge severity={incident.severity} />
      </td>
      <td className="p-4">
        <StatusBadge status={incident.status} />
      </td>
      <td className="p-4 text-sm text-slate-600 truncate max-w-[200px]">
        {incident.location.address}
      </td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            to={`/admin/incidents/${incident.id}`}
            className="text-slate-400 hover:text-critical-600"
            aria-label={`View details for ${incident.referenceNumber}`}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Link>
          {onEdit && (
            <button
              onClick={() => onEdit(incident)}
              className="text-slate-400 hover:text-critical-600"
              aria-label={`Edit ${incident.referenceNumber}`}
            >
              <Edit2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
