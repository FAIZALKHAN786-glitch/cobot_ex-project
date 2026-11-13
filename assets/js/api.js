/*
 * Emergency Response & Operations — API client
 * Fetch wrapper with session cookies and consistent error shape.
 */

const BASE = "http://localhost:4000";

const STATUS_LABELS = {
  active: "Active",
  dispatched: "Dispatched",
  enroute: "En Route",
  "on-scene": "On Scene",
  resolved: "Resolved",
};
const SEVERITY_LABELS = { severe: "Severe", high: "High", medium: "Medium", low: "Low" };
const CATEGORY_LABELS = {
  fire: "Fire", medical: "Medical", traffic: "Traffic",
  hazard: "Hazard", utility: "Utility",
};

class ApiError extends Error {
  constructor(message, status, errors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const opts = {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  let data;
  try { data = await res.json(); } catch { data = {}; }
  if (!res.ok) {
    throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.errors);
  }
  return data;
}

/* ------------------------------------------------------------------ */
/*  Auth                                                              */
/* ------------------------------------------------------------------ */

export async function authLogin(username, password) {
  return request("/api/auth/login", { method: "POST", body: { username, password } });
}
export async function authLogout() {
  return request("/api/auth/logout", { method: "POST" });
}
export async function authMe() {
  return request("/api/auth/me");
}

/* ------------------------------------------------------------------ */
/*  Meta / health                                                     */
/* ------------------------------------------------------------------ */

export async function fetchHealth() {
  return request("/api/health");
}
export async function fetchMeta() {
  return request("/api/meta");
}

/* ------------------------------------------------------------------ */
/*  Incidents                                                         */
/* ------------------------------------------------------------------ */

export async function fetchIncidents({ status, severity, category, q } = {}) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (severity) params.set("severity", severity);
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request(`/api/incidents${qs}`);
}
export async function fetchIncident(id) {
  return request(`/api/incidents/${encodeURIComponent(id)}`);
}
export async function createIncident(body) {
  return request("/api/incidents", { method: "POST", body });
}
export async function updateIncident(id, body) {
  return request(`/api/incidents/${encodeURIComponent(id)}`, { method: "PATCH", body });
}
export async function deleteIncident(id) {
  return request(`/api/incidents/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/*  Stats                                                             */
/* ------------------------------------------------------------------ */

export async function fetchStats() {
  return request("/api/stats");
}

/* ------------------------------------------------------------------ */
/*  Units / Personnel                                                 */
/* ------------------------------------------------------------------ */

export async function fetchUnits() {
  return request("/api/units");
}
export async function updateUnit(id, body) {
  return request(`/api/units/${encodeURIComponent(id)}`, { method: "PATCH", body });
}
export async function fetchPersonnel() {
  return request("/api/personnel");
}
export async function updatePersonnel(id, body) {
  return request(`/api/personnel/${encodeURIComponent(id)}`, { method: "PATCH", body });
}

/* ------------------------------------------------------------------ */
/*  AI Fall Detection                                                 */
/* ------------------------------------------------------------------ */

export async function fetchFallDetection() {
  return request("/api/ai/fall-detection");
}

export async function fetchFallRiskMap() {
  return request("/api/ai/fall-risk-map");
}

/* ------------------------------------------------------------------ */
/*  Hospitals                                                         */
/* ------------------------------------------------------------------ */

export async function fetchHospitals({ lat, lng, radius } = {}) {
  const params = new URLSearchParams();
  if (lat !== undefined) params.set("lat", lat);
  if (lng !== undefined) params.set("lng", lng);
  if (radius !== undefined) params.set("radius", radius);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request(`/api/hospitals${qs}`);
}
export async function fetchIncidentHospitals(incidentId, radius) {
  const params = new URLSearchParams();
  if (radius !== undefined) params.set("radius", radius);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return request(`/api/incidents/${encodeURIComponent(incidentId)}/hospitals${qs}`);
}

/* ------------------------------------------------------------------ */
/*  Export                                                            */
/* ------------------------------------------------------------------ */

export async function exportIncidentsCsv() {
  const res = await fetch(`${BASE}/api/incidents/export`, { credentials: "include" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || `Export failed (${res.status})`, res.status);
  }
  return res.text();
}

/* ------------------------------------------------------------------ */
/*  Label helpers                                                     */
/* ------------------------------------------------------------------ */

export { STATUS_LABELS, SEVERITY_LABELS, CATEGORY_LABELS, ApiError };

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
export function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
