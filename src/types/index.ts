/**
 * Emergency Response Platform — TypeScript data models.
 *
 * These types describe the incident domain shared across the frontend.
 * The mock API layer (src/services/api.ts) uses these same shapes so the
 * frontend can be swapped to a real REST/GraphQL backend later.
 */

export type IncidentStatus =
  | "reported"
  | "acknowledged"
  | "dispatched"
  | "on-scene"
  | "resolved"
  | "closed"
  | "cancelled";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentCategory =
  | "fire"
  | "medical"
  | "flood"
  | "earthquake"
  | "police"
  | "infrastructure"
  | "other";

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Incident {
  id: string;
  referenceNumber: string; // e.g., ER-2026-00123
  title: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  location: Location;
  reporterName?: string;
  reporterPhone?: string;
  reporterId?: string;
  mediaUrls?: string[];
  assignedTo?: string;
  adminNotes?: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  resolvedAt?: string;
}

export interface User {
  id: string;
  email: string;
  role: "reporter" | "admin";
  name: string;
}

export interface IncidentFilters {
  category?: IncidentCategory;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface IncidentListResponse {
  data: Incident[];
  total: number;
}

export interface DashboardStats {
  total: number;
  bySeverity: Record<IncidentSeverity, number>;
  byStatus: Record<IncidentStatus, number>;
  byCategory: Record<IncidentCategory, number>;
  criticalActive: number;
  resolvedToday: number;
  averageResponseTimeMinutes: number;
}

/**
 * Severity configuration: label, color, and icon for consistent badges/markers.
 */
export const severityConfig: Record<
  IncidentSeverity,
  { label: string; color: string; bg: string; icon: React.ComponentType }
> = {
  low: {
    label: "Low",
    color: "text-low-600",
    bg: "bg-low-100 border-low-200",
    icon: () => null, // overridden in components
  },
  medium: {
    label: "Medium",
    color: "text-medium-600",
    bg: "bg-medium-100 border-medium-200",
    icon: () => null,
  },
  high: {
    label: "High",
    color: "text-high-600",
    bg: "bg-high-100 border-high-200",
    icon: () => null,
  },
  critical: {
    label: "Critical",
    color: "text-critical-600",
    bg: "bg-critical-100 border-critical-200",
    icon: () => null,
  },
} as const;

/**
 * Status configuration: label and color for badges.
 */
export const statusConfig: Record<
  IncidentStatus,
  { label: string; color: string; bg: string }
> = {
  reported: { label: "Reported", color: "text-slate-600", bg: "bg-slate-100" },
  acknowledged: {
    label: "Acknowledged",
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  dispatched: {
    label: "Dispatched",
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
  "on-scene": { label: "On Scene", color: "text-orange-600", bg: "bg-orange-100" },
  resolved: { label: "Resolved", color: "text-resolved-600", bg: "bg-resolved-100" },
  closed: { label: "Closed", color: "text-green-700", bg: "bg-green-100" },
  cancelled: { label: "Cancelled", color: "text-slate-500", bg: "bg-slate-200" },
} as const;

/**
 * Category configuration: label and color for chips.
 */
export const categoryConfig: Record<
  IncidentCategory,
  { label: string; color: string; bg: string }
> = {
  fire: { label: "Fire", color: "text-red-700", bg: "bg-red-100" },
  medical: { label: "Medical", color: "text-blue-700", bg: "bg-blue-100" },
  flood: { label: "Flood", color: "text-cyan-700", bg: "bg-cyan-100" },
  earthquake: { label: "Earthquake", color: "text-amber-700", bg: "bg-amber-100" },
  police: { label: "Police / Crime", color: "text-indigo-700", bg: "bg-indigo-100" },
  infrastructure: {
    label: "Infrastructure",
    color: "text-emerald-700",
    bg: "bg-emerald-100",
  },
  other: { label: "Other", color: "text-slate-700", bg: "bg-slate-100" },
} as const;
