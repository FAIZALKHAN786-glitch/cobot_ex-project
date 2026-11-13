/*
 * Emergency Response & Management System — sample data
 *
 * This data is illustrative only. It is not sourced from any real emergency
 * service, contains no real persons, locations, or performance metrics, and
 * must not be presented as customer proof or operational evidence.
 */

export const STATUS_ORDER = [
  "active",
  "dispatched",
  "enroute",
  "on-scene",
  "resolved"
];

export const STATUS_LABELS = {
  active: "Active",
  dispatched: "Dispatched",
  enroute: "En Route",
  "on-scene": "On Scene",
  resolved: "Resolved"
};

export const SEVERITIES = ["severe", "high", "medium", "low"];
export const SEVERITY_LABELS = {
  severe: "Severe",
  high: "High",
  medium: "Medium",
  low: "Low"
};

export const CATEGORIES = ["fire", "medical", "traffic", "hazard", "utility"];
export const CATEGORY_LABELS = {
  fire: "Fire",
  medical: "Medical",
  traffic: "Traffic",
  hazard: "Hazard",
  utility: "Utility"
};
export const CATEGORY_COLORS = {
  fire: "var(--severe)",
  medical: "var(--brand)",
  traffic: "var(--high)",
  hazard: "var(--medium)",
  utility: "var(--accent)"
};

export const UNITS = [
  { id: "ENG-1", name: "Engine 1", type: "Fire Engine", status: "available", location: "Central Station" },
  { id: "ENG-3", name: "Engine 3", type: "Fire Engine", status: "available", location: "North Station" },
  { id: "RESC-2", name: "Rescue 2", type: "Rescue", status: "enroute", location: "Incident IRN-2026-014" },
  { id: "MED-5", name: "Medic 5", type: "Ambulance", status: "on-scene", location: "Incident IRN-2026-012" },
  { id: "MED-8", name: "Medic 8", type: "Ambulance", status: "available", location: "East Station" },
  { id: "BC-1", name: "Battalion 1", type: "Chief", status: "on-scene", location: "Incident IRN-2026-012" }
];

export const PERSONNEL = [
  { id: "P-101", name: "A. Reyes", role: "Captain", status: "on-scene", unit: "BC-1" },
  { id: "P-104", name: "J. Okafor", role: "Paramedic", status: "on-scene", unit: "MED-5" },
  { id: "P-109", name: "S. Chen", role: "Firefighter", status: "enroute", unit: "RESC-2" },
  { id: "P-112", name: "M. Delgado", role: "EMT", status: "available", unit: "MED-8" },
  { id: "P-118", name: "T. Briggs", role: "Firefighter", status: "available", unit: "ENG-3" },
  { id: "P-121", name: "N. Al-Farsi", role: "Dispatcher", status: "available", unit: null }
];

export const INCIDENTS = [
  {
    id: "IRN-2026-012",
    title: "Structure fire — multi-unit residential",
    address: "1420 Oakridge Ave, Unit C",
    severity: "severe",
    category: "fire",
    status: "on-scene",
    reportedAt: "2026-11-09T22:14:00",
    updatedAt: "2026-11-10T01:38:00",
    units: ["BC-1", "ENG-1", "MED-5"],
    description: "Smoke visible from second floor. All units accounted for. Search in progress.",
    timeline: [
      { t: "22:14", e: "Call received", d: "Resident reported smoke and activated alarm.", s: "active" },
      { t: "22:18", e: "Units dispatched", d: "Engine 1, Medic 5, Battalion 1 assigned.", s: "dispatched" },
      { t: "22:31", e: "First unit on scene", d: "Engine 1 arrived; smoke confirmed on floor 2.", s: "enroute" },
      { t: "01:12", e: "All units on scene", d: "Rescue and medical units staged.", s: "on-scene" },
      { t: "01:38", e: "Search underway", d: "Interior search in progress; all occupants accounted for.", s: "on-scene" }
    ]
  },
  {
    id: "IRN-2026-014",
    title: "Motor vehicle collision — I-80 West",
    address: "I-80 West near mile marker 47",
    severity: "high",
    category: "traffic",
    status: "enroute",
    reportedAt: "2026-11-10T03:02:00",
    updatedAt: "2026-11-10T03:41:00",
    units: ["RESC-2"],
    description: "Two-vehicle collision, lane blocked. Rescue unit en route.",
    timeline: [
      { t: "03:02", e: "Call received", d: "911 call from passing motorist.", s: "active" },
      { t: "03:06", e: "Units dispatched", d: "Rescue 2 assigned to scene.", s: "dispatched" },
      { t: "03:41", e: "Unit en route", d: "Rescue 2 responding with lights and siren.", s: "enroute" }
    ]
  },
  {
    id: "IRN-2026-013",
    title: "Gas leak — commercial",
    address: "318 Commerce Pl, Suite 4",
    severity: "high",
    category: "hazard",
    status: "active",
    reportedAt: "2026-11-10T05:55:00",
    updatedAt: "2026-11-10T05:55:00",
    units: [],
    description: "Odor of natural gas reported inside suite. Building evacuated.",
    timeline: [
      { t: "05:55", e: "Call received", d: "Business owner reported strong gas odor.", s: "active" }
    ]
  },
  {
    id: "IRN-2026-011",
    title: "Medical emergency — assist",
    address: "890 Riverview Dr",
    severity: "medium",
    category: "medical",
    status: "resolved",
    reportedAt: "2026-11-09T18:02:00",
    updatedAt: "2026-11-09T18:57:00",
    units: ["MED-5"],
    description: "Fall victim assessed and transported. Scene cleared.",
    timeline: [
      { t: "18:02", e: "Call received", d: "Medical assist requested.", s: "active" },
      { t: "18:15", e: "Unit on scene", d: "Medic 5 assessed patient.", s: "on-scene" },
      { t: "18:57", e: "Resolved", d: "Patient transported; scene cleared.", s: "resolved" }
    ]
  },
  {
    id: "IRN-2026-010",
    title: "Vegetation fire — roadside",
    address: "Old Mill Rd & County Line",
    severity: "low",
    category: "fire",
    status: "resolved",
    reportedAt: "2026-11-09T14:20:00",
    updatedAt: "2026-11-09T15:03:00",
    units: ["ENG-3"],
    description: "Small brush fire extinguished. No structures threatened.",
    timeline: [
      { t: "14:20", e: "Call received", d: "Roadside smoke reported.", s: "active" },
      { t: "15:03", e: "Resolved", d: "Fire extinguished; scene cleared.", s: "resolved" }
    ]
  }
];

export function findIncident(id) {
  return INCIDENTS.find(i => i.id === id);
}

export function severityColor(severity) {
  const map = {
    severe: "var(--severe)",
    high: "var(--high)",
    medium: "var(--medium)",
    low: "var(--low)"
  };
  return map[severity] || "var(--text-muted)";
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
