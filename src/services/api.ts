/**
 * Mock API service layer for the Emergency Response Platform.
 *
 * This simulates a REST backend with network latency (400–800ms) and a small
 * random failure rate (~5%) so loading/error UI can be demonstrated.
 *
 * TODO: Replace these functions with real fetch/axios calls to your backend.
 * Keep the function signatures stable so the swap is drop-in.
 *
 * Base URL configuration:
 *   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";
 */

import type {
  Incident,
  IncidentListResponse,
  IncidentFilters,
  DashboardStats,
  User,
  IncidentSeverity,
  IncidentStatus,
  IncidentCategory,
} from "@/types";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL) ||
  "http://localhost:4000/api";

// Simulated network delay in ms (min, max)
const LATENCY_MS: [number, number] = [400, 800];
// Simulated failure rate (0 to 1)
const FAILURE_RATE = 0.05;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomDelay = () => {
  const [min, max] = LATENCY_MS;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shouldFail = () => Math.random() < FAILURE_RATE;

const apiError = (message: string) => {
  const err: Error & { status?: number } = new Error(message);
  err.status = 500;
  return err;
};

// ---------------------------------------------------------------------------
// Seed data (16 realistic incidents)
// ---------------------------------------------------------------------------

const NOW = new Date();
const addMinutes = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

const seedIncidents: Incident[] = [
  {
    id: "inc-1001",
    referenceNumber: "ER-2026-10012",
    title: "Kitchen fire – Maple St apartment",
    category: "fire",
    severity: "critical",
    status: "dispatched",
    description:
      "Smoke and flames visible from second-floor window. Residents evacuated. Fire unit en route.",
    location: { lat: 40.7128, lng: -74.006, address: "124 Maple St, Apt 4B" },
    reporterName: "J. Rivera",
    reporterPhone: "+1-555-0101",
    assignedTo: "Unit Engine-4",
    adminNotes: "Fire department responding, 2 units on scene.",
    createdAt: addMinutes(NOW, -90).toISOString(),
    updatedAt: addMinutes(NOW, -15).toISOString(),
  },
  {
    id: "inc-1002",
    referenceNumber: "ER-2026-10013",
    title: "Car collision – Main & 5th",
    category: "police",
    severity: "high",
    status: "on-scene",
    description:
      "Two-vehicle collision at intersection. Minor injuries reported, traffic blocked.",
    location: { lat: 40.718, lng: -74.012, address: "Main St & 5th Ave" },
    reporterName: "M. Chen",
    reporterPhone: "+1-555-0102",
    assignedTo: "Patrol Unit 7",
    adminNotes: "Ambulance dispatched for minor injuries.",
    createdAt: addMinutes(NOW, -75).toISOString(),
    updatedAt: addMinutes(NOW, -8).toISOString(),
  },
  {
    id: "inc-1003",
    referenceNumber: "ER-2026-10014",
    title: "Flooding – Riverwalk basement",
    category: "flood",
    severity: "medium",
    status: "acknowledged",
    description:
      "Water entering basement level of Riverwalk community center. Sandbags requested.",
    location: { lat: 40.705, lng: -73.998, address: "310 Riverwalk Dr" },
    reporterName: "S. Okafor",
    reporterPhone: "+1-555-0103",
    adminNotes: "Public works notified, sandbag crew en route.",
    createdAt: addMinutes(NOW, -60).toISOString(),
    updatedAt: addMinutes(NOW, -20).toISOString(),
  },
  {
    id: "inc-1004",
    referenceNumber: "ER-2026-10015",
    title: "Chest pain – elderly resident",
    category: "medical",
    severity: "high",
    status: "dispatched",
    description:
      "78-year-old male reporting chest pain and shortness of breath. EMS en route.",
    location: { lat: 40.722, lng: -74.002, address: "88 Oakwood Ave" },
    reporterName: "L. Dubois",
    reporterPhone: "+1-555-0104",
    assignedTo: "EMS Unit 3",
    createdAt: addMinutes(NOW, -45).toISOString(),
    updatedAt: addMinutes(NOW, -5).toISOString(),
  },
  {
    id: "inc-1005",
    referenceNumber: "ER-2026-10016",
    title: "Power outage – North district",
    category: "infrastructure",
    severity: "medium",
    status: "reported",
    description:
      "Multiple blocks reporting loss of power since early evening. Utility crew notified.",
    location: { lat: 40.73, lng: -73.99, address: "North District, Blocks 12–18" },
    reporterName: "North District Watch",
    adminNotes: "Utility company ETA: 2 hours.",
    createdAt: addMinutes(NOW, -30).toISOString(),
    updatedAt: addMinutes(NOW, -30).toISOString(),
  },
  {
    id: "inc-1006",
    referenceNumber: "ER-2026-10017",
    title: "Gas leak – Industrial park",
    category: "infrastructure",
    severity: "critical",
    status: "reported",
    description:
      "Strong gas odor detected near warehouse row 3. Area evacuated as precaution.",
    location: { lat: 40.74, lng: -73.985, address: "4500 Industrial Pkwy, Row 3" },
    reporterName: "T. Whitaker",
    reporterPhone: "+1-555-0105",
    adminNotes: "Gas company on site, evacuation in progress.",
    createdAt: addMinutes(NOW, -25).toISOString(),
    updatedAt: addMinutes(NOW, -10).toISOString(),
  },
  {
    id: "inc-1007",
    referenceNumber: "ER-2026-10018",
    title: "Minor slip and fall – Community park",
    category: "medical",
    severity: "low",
    status: "resolved",
    description:
      "Patron tripped on uneven pavement near playground. Minor abrasion, first aid applied.",
    location: { lat: 40.708, lng: -74.008, address: "Central Park, near playground" },
    reporterName: "P. Nguyen",
    reporterPhone: "+1-555-0106",
    resolvedAt: addMinutes(NOW, -5).toISOString(),
    createdAt: addMinutes(NOW, -40).toISOString(),
    updatedAt: addMinutes(NOW, -5).toISOString(),
  },
  {
    id: "inc-1008",
    referenceNumber: "ER-2026-10019",
    title: "Suspicious activity – Downtown plaza",
    category: "police",
    severity: "medium",
    status: "acknowledged",
    description:
      "Individual loitering near storefronts after hours, refusing to leave when asked.",
    location: { lat: 40.715, lng: -74.009, address: "Downtown Plaza, near cinema" },
    reporterName: "Store Security",
    adminNotes: "Patrol unit dispatched to investigate.",
    createdAt: addMinutes(NOW, -20).toISOString(),
    updatedAt: addMinutes(NOW, -15).toISOString(),
  },
  {
    id: "inc-1009",
    referenceNumber: "ER-2026-10020",
    title: "Water main break – Elm Street",
    category: "infrastructure",
    severity: "high",
    status: "dispatched",
    description:
      "Burst water main flooding Elm Street between 2nd and 3rd. Road closed.",
    location: { lat: 40.711, lng: -74.005, address: "Elm St between 2nd & 3rd" },
    reporterName: "City Streets Dept",
    assignedTo: "Water Crew 2",
    adminNotes: "Road closed, traffic detour posted.",
    createdAt: addMinutes(NOW, -15).toISOString(),
    updatedAt: addMinutes(NOW, -3).toISOString(),
  },
  {
    id: "inc-1010",
    referenceNumber: "ER-2026-10021",
    title: "Small brush fire – Hillside trail",
    category: "fire",
    severity: "medium",
    status: "reported",
    description:
      "Small brush fire along hillside trail, approx. 10x10 ft. No structures threatened.",
    location: { lat: 40.725, lng: -73.995, address: "Hillside Trail, marker 7" },
    reporterName: "Hiker Anonymous",
    adminNotes: "Fire unit responding, low risk to structures.",
    createdAt: addMinutes(NOW, -12).toISOString(),
    updatedAt: addMinutes(NOW, -12).toISOString(),
  },
  {
    id: "inc-1011",
    referenceNumber: "ER-2026-10022",
    title: "Severe allergic reaction – School cafeteria",
    category: "medical",
    severity: "critical",
    status: "dispatched",
    description:
      "Student experiencing anaphylaxis after lunch. EpiPen administered, EMS en route.",
    location: { lat: 40.702, lng: -74.01, address: "Lincoln Elementary, cafeteria" },
    reporterName: "School Nurse",
    reporterPhone: "+1-555-0107",
    assignedTo: "EMS Unit 1",
    adminNotes: "EpiPen given, patient improving, transport pending.",
    createdAt: addMinutes(NOW, -10).toISOString(),
    updatedAt: addMinutes(NOW, -2).toISOString(),
  },
  {
    id: "inc-1012",
    referenceNumber: "ER-2026-10023",
    title: "Earthquake tremors – East suburbs",
    category: "earthquake",
    severity: "medium",
    status: "reported",
    description:
      "Residents report shaking and items falling from shelves. No structural damage confirmed yet.",
    location: { lat: 40.735, lng: -73.988, address: "East Suburbs, multiple blocks" },
    reporterName: "East Suburbs Watch",
    adminNotes: "Building inspectors dispatched.",
    createdAt: addMinutes(NOW, -8).toISOString(),
    updatedAt: addMinutes(NOW, -8).toISOString(),
  },
  {
    id: "inc-1013",
    referenceNumber: "ER-2026-10024",
    title: "Traffic signal outage – Broadway",
    category: "infrastructure",
    severity: "medium",
    status: "acknowledged",
    description:
      "Traffic signals flashing red at Broadway & 8th. Drivers treating as four-way stop.",
    location: { lat: 40.719, lng: -74.003, address: "Broadway & 8th Ave" },
    reporterName: "Commuter",
    adminNotes: "Electrical crew notified, temporary stop signs placed.",
    createdAt: addMinutes(NOW, -6).toISOString(),
    updatedAt: addMinutes(NOW, -6).toISOString(),
  },
  {
    id: "inc-1014",
    referenceNumber: "ER-2026-10025",
    title: "Burglary in progress – Jewelry store",
    category: "police",
    severity: "high",
    status: "on-scene",
    description:
      "Silent alarm triggered at jewelry store. Possible break-in in progress.",
    location: { lat: 40.713, lng: -74.007, address: "210 Broadway, Jewelers Row" },
    reporterName: "Security Co.",
    assignedTo: "Patrol Unit 5",
    adminNotes: "Units on scene, perimeter established.",
    createdAt: addMinutes(NOW, -4).toISOString(),
    updatedAt: addMinutes(NOW, -1).toISOString(),
  },
  {
    id: "inc-1015",
    referenceNumber: "ER-2026-10026",
    title: "Minor fender bender – Mall parking lot",
    category: "police",
    severity: "low",
    status: "closed",
    description:
      "Two vehicles collided in parking lot. No injuries, information exchanged.",
    location: { lat: 40.706, lng: -74.001, address: "Westfield Mall, Lot C" },
    reporterName: "D. Park",
    reporterPhone: "+1-555-0108",
    resolvedAt: addMinutes(NOW, -2).toISOString(),
    createdAt: addMinutes(NOW, -50).toISOString(),
    updatedAt: addMinutes(NOW, -2).toISOString(),
  },
  {
    id: "inc-1016",
    referenceNumber: "ER-2026-10027",
    title: "Elevator entrapment – Office tower",
    category: "infrastructure",
    severity: "high",
    status: "dispatched",
    description:
      "Two people trapped in elevator between floors 12 and 13. Building maintenance en route.",
    location: { lat: 40.728, lng: -74.004, address: "Meridian Tower, 500 Central Ave" },
    reporterName: "Building Manager",
    reporterPhone: "+1-555-0109",
    assignedTo: "Maintenance Crew 1",
    adminNotes: "Elevator technician dispatched, occupants calm.",
    createdAt: addMinutes(NOW, -3).toISOString(),
    updatedAt: addMinutes(NOW, -1).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// In-memory store (backed by seed data)
// ---------------------------------------------------------------------------

const incidents: Incident[] = [...seedIncidents];

const findIndex = (id: string) => incidents.findIndex((i) => i.id === id);

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getIncidents(
  filters?: IncidentFilters
): Promise<IncidentListResponse> {
  await delay(randomDelay());
  if (shouldFail()) throw apiError("Failed to fetch incidents");

  if (!filters) filters = {};

  let result = [...incidents];

  if (filters.category) {
    result = result.filter((i) => i.category === filters.category);
  }
  if (filters.severity) {
    result = result.filter((i) => i.severity === filters.severity);
  }
  if (filters.status) {
    result = result.filter((i) => i.status === filters.status);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (i) =>
        i.referenceNumber.toLowerCase().includes(q) ||
        i.title.toLowerCase().includes(q) ||
        i.location.address?.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
    );
  }
  if (filters.dateFrom) {
    result = result.filter((i) => i.createdAt >= filters.dateFrom!);
  }
  if (filters.dateTo) {
    result = result.filter((i) => i.createdAt <= filters.dateTo!);
  }

  const total = result.length;
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 50;
  const start = (page - 1) * pageSize;
  result = result.slice(start, start + pageSize);

  return { data: result, total };
}

export async function getIncident(id: string): Promise<Incident> {
  await delay(randomDelay());
  if (shouldFail()) throw apiError("Failed to fetch incident");

  const incident = incidents.find((i) => i.id === id);
  if (!incident) {
    const err: Error & { status?: number } = new Error("Incident not found");
    err.status = 404;
    throw err;
  }
  return incident;
}

export async function createIncident(
  payload: Omit<
    Incident,
    "id" | "referenceNumber" | "createdAt" | "updatedAt" | "status"
  >
): Promise<Incident> {
  await delay(randomDelay());
  if (shouldFail()) throw apiError("Failed to create incident");

  const now = new Date().toISOString();
  const incident: Incident = {
    ...payload,
    id: `inc-${Math.floor(Math.random() * 90000) + 10000}`,
    referenceNumber: `ER-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000) + 10000}`,
    status: "reported",
    createdAt: now,
    updatedAt: now,
  };
  incidents.push(incident);
  return incident;
}

export async function updateIncident(
  id: string,
  payload: Partial<Incident>
): Promise<Incident> {
  await delay(randomDelay());
  if (shouldFail()) throw apiError("Failed to update incident");

  const idx = findIndex(id);
  if (idx === -1) {
    const err: Error & { status?: number } = new Error("Incident not found");
    err.status = 404;
    throw err;
  }

  const existing = incidents[idx];
  if (!existing) {
    const err: Error & { status?: number } = new Error("Incident not found");
    err.status = 404;
    throw err;
  }
  const updated: Incident = {
    ...existing,
    ...payload,
    id: existing.id,
    referenceNumber: existing.referenceNumber,
    updatedAt: new Date().toISOString(),
  };
  incidents[idx] = updated;
  return updated;
}

export async function getStats(): Promise<DashboardStats> {
  await delay(randomDelay());
  if (shouldFail()) throw apiError("Failed to fetch stats");

  const bySeverity: Record<IncidentSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const byStatus: Record<IncidentStatus, number> = {
    reported: 0,
    acknowledged: 0,
    dispatched: 0,
    "on-scene": 0,
    resolved: 0,
    closed: 0,
    cancelled: 0,
  };
  const byCategory: Record<IncidentCategory, number> = {
    fire: 0,
    medical: 0,
    flood: 0,
    earthquake: 0,
    police: 0,
    infrastructure: 0,
    other: 0,
  };

  let criticalActive = 0;
  let resolvedToday = 0;
  const today = NOW.toISOString().split("T")[0] ?? "";

  for (const inc of incidents) {
    bySeverity[inc.severity] = (bySeverity[inc.severity] ?? 0) + 1;
    byStatus[inc.status] = (byStatus[inc.status] ?? 0) + 1;
    byCategory[inc.category] = (byCategory[inc.category] ?? 0) + 1;
    if (
      (inc.severity === "critical" || inc.severity === "high") &&
      (inc.status === "reported" ||
        inc.status === "acknowledged" ||
        inc.status === "dispatched" ||
        inc.status === "on-scene")
    ) {
      criticalActive++;
    }
    const resolvedAt = inc.resolvedAt;
    if (resolvedAt?.startsWith(today)) resolvedToday++;
  }

  return {
    total: incidents.length,
    bySeverity,
    byStatus,
    byCategory,
    criticalActive,
    resolvedToday,
    averageResponseTimeMinutes: 14,
  };
}

// ---------------------------------------------------------------------------
// Auth (mock)
// ---------------------------------------------------------------------------

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin123",
    user: {
      id: "user-1",
      email: "admin@emergency.gov",
      role: "admin",
      name: "Operations Admin",
    },
  },
  reporter: {
    password: "reporter123",
    user: {
      id: "user-2",
      email: "reporter@citizen.gov",
      role: "reporter",
      name: "Citizen Reporter",
    },
  },
};

export async function login(
  email: string,
  password: string
): Promise<{ token: string; user: User }> {
  await delay(randomDelay());
  if (shouldFail()) throw apiError("Login failed");

  const entry = Object.values(MOCK_USERS).find(
    (u) => u.user.email === email
  );
  if (!entry || entry.password !== password) {
    const err: Error & { status?: number } = new Error(
      "Invalid email or password"
    );
    err.status = 401;
    throw err;
  }

  const token = `mock-token-${Date.now()}`;
  return { token, user: entry.user };
}

export { API_BASE_URL };
