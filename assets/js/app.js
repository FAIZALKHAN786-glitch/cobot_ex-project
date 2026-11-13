/*
 * Emergency Response & Operations — application logic
 * SPA router + view renderer backed by the MongoDB Express API.
 */

import {
  fetchHealth, fetchMeta, fetchIncidents, fetchIncident,
  fetchIncidentHospitals, createIncident, updateIncident, deleteIncident,
  fetchStats, fetchUnits, updateUnit, fetchPersonnel, updatePersonnel,
  fetchHospitals, fetchFallDetection, fetchFallRiskMap, exportIncidentsCsv,
  authLogin, authLogout, authMe,
  STATUS_LABELS, SEVERITY_LABELS, CATEGORY_LABELS, formatDateTime, formatTime,
  ApiError,
} from "./api.js";

/* ------------------------------------------------------------------ */
/*  State                                                             */
/* ------------------------------------------------------------------ */

let state = {
  incidents: [],
  units: [],
  personnel: [],
  hospitals: [],
  stats: null,
  meta: null,
  fallDetections: [],
  fallDetectionEnabled: false,
  isAdmin: false,
  username: null,
  dbOnline: false,
};

let currentIncidentId = null;
let dashboardMap = null;
let incidentMap = null;
let fallMap = null;
let mapMarkers = [];

/* ------------------------------------------------------------------ */
/*  Map helpers (Leaflet)                                             */
/* ------------------------------------------------------------------ */

const SEVERITY_MAP_COLOR = {
  severe: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const FALL_RISK_COLOR = {
  high: "#7f1d1d",
  medium: "#b45309",
  low: "#15803d",
};

function fallMarkerIcon(riskLevel) {
  const colors = { high: "#7f1d1d", medium: "#b45309", low: "#15803d" };
  const color = colors[riskLevel] || "#15803d";
  return L.divIcon({
    className: "fall-marker",
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;">&#x1F6B7;</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function initMap(containerId, center = [40.7580, -73.9855], zoom = 13) {
  const el = $(`#${containerId}`);
  if (!el) return null;
  if (containerId === "dashboard-map" && dashboardMap) {
    dashboardMap.remove();
    dashboardMap = null;
  }
  if (containerId === "incident-map" && incidentMap) {
    incidentMap.remove();
    incidentMap = null;
  }
  if (containerId === "fall-map" && fallMap) {
    fallMap.remove();
    fallMap = null;
  }
  mapMarkers.forEach((m) => m.remove());
  mapMarkers = [];

  const map = L.map(containerId, {
    center,
    zoom,
    zoomControl: true,
    attributionControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  if (containerId === "dashboard-map") dashboardMap = map;
  if (containerId === "incident-map") incidentMap = map;
  if (containerId === "fall-map") fallMap = map;
  return map;
}

function addMarker(map, lat, lng, { title, color = "#0ea5e9", icon, popup }) {
  let marker;
  if (icon instanceof L.Icon) {
    marker = L.marker([lat, lng], { icon }).addTo(map);
  } else {
    marker = L.marker([lat, lng]).addTo(map);
  }
  marker.bindPopup(popup || title);
  mapMarkers.push(marker);
  return marker;
}

function fitMapToMarkers(map, padding = 60) {
  if (mapMarkers.length === 0) return;
  const group = L.featureGroup(mapMarkers);
  map.fitBounds(group.getBounds().pad(padding / 100));
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Announcer (screen readers)                                        */
/* ------------------------------------------------------------------ */
const announcer = (() => {
  const el = document.createElement("div");
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-atomic", "true");
  el.className = "sr-only";
  document.body.appendChild(el);
  return (msg) => {
    el.textContent = "";
    void el.offsetHeight;
    el.textContent = msg;
  };
})();

/* ------------------------------------------------------------------ */
/*  Toast notifications                                               */
/* ------------------------------------------------------------------ */
let toastContainer;
function ensureToastContainer() {
  if (toastContainer) return toastContainer;
  toastContainer = document.createElement("div");
  toastContainer.className = "toast-container";
  document.body.appendChild(toastContainer);
  return toastContainer;
}
function showToast({ type = "info", message, duration = 4000 }) {
  const container = ensureToastContainer();
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = html`
    <span class="icon">${type === "success" ? "&#10003;" : type === "danger" ? "&#10007;" : "&#128204;"}</span>
    <span>${esc(message)}</span>
  `;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, duration);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const html = (strings, ...vals) =>
  strings.reduce((acc, s, i) => acc + s + (vals[i] || ""), "");
const esc = (t) => {
  const d = document.createElement("div");
  d.textContent = t;
  return d.innerHTML;
};
const badgeCls = (sev) => `badge-${sev}`;
const chipCls = (st) => `status-${st}`;

/* ------------------------------------------------------------------ */
/*  Data loading                                                      */
/* ------------------------------------------------------------------ */
async function loadAll() {
  try {
    const [health, meta, incidents, units, personnel, stats, me, fallDetection] =
      await Promise.allSettled([
        fetchHealth(),
        fetchMeta(),
        fetchIncidents(),
        fetchUnits(),
        fetchPersonnel(),
        fetchStats(),
        authMe(),
        fetchFallDetection(),
      ]);

    state.dbOnline = health.status === "fulfilled" && health.value.ok;
    state.meta = meta.status === "fulfilled" ? meta.value : null;
    state.incidents = incidents.status === "fulfilled" ? incidents.value : [];
    state.units = units.status === "fulfilled" ? units.value : [];
    state.personnel = personnel.status === "fulfilled" ? personnel.value : [];
    state.stats = stats.status === "fulfilled" ? stats.value : null;
    state.isAdmin = me.status === "fulfilled" && me.value.isAdmin;
    state.username = me.status === "fulfilled" ? me.value.username : null;
    if (fallDetection.status === "fulfilled" && fallDetection.value.ok) {
      state.fallDetections = fallDetection.value.detections || [];
    } else {
      state.fallDetections = [];
    }

    document.body.setAttribute("data-admin", state.isAdmin ? "true" : "false");
    updateAuthUI();
    updateDbStatus();
    return true;
  } catch (e) {
    console.warn("loadAll error:", e);
    state.dbOnline = false;
    document.body.setAttribute("data-admin", "false");
    updateDbStatus();
    return false;
  }
}

function updateAuthUI() {
  const container = $("#top-actions");
  if (!container) return;
  if (state.isAdmin) {
    container.innerHTML = html`
      <span class="auth-user">Signed in as <strong>${esc(state.username)}</strong></span>
      <button class="btn btn-sm btn-danger" id="btn-logout">Sign out</button>
    `;
    $("#btn-logout")?.addEventListener("click", async () => {
      try { await authLogout(); } catch {}
      state.isAdmin = false;
      state.username = null;
      updateAuthUI();
      renderCurrent();
    });
  } else {
    container.innerHTML = html`
      <button class="btn btn-sm btn-outline" id="btn-login">Administrator sign-in</button>
    `;
    $("#btn-login")?.addEventListener("click", () => openLogin());
  }
}

function updateDbStatus() {
  const el = $("#db-status");
  const dot = $("#system-status .dot");
  if (!el) return;
  if (state.dbOnline) {
    el.textContent = "Database connected";
    dot.className = "dot online";
  } else {
    el.textContent = "Database offline";
    dot.className = "dot";
  }
}

/* ------------------------------------------------------------------ */
/*  Router                                                            */
/* ------------------------------------------------------------------ */
const routes = {
  "#dashboard": renderDashboard,
  "#incidents": renderIncidents,
  "#report": renderReport,
  "#resources": renderResources,
  "#fall-detection": renderFallDetection,
  "#admin": renderAdmin,
};

function navigate(hash) {
  if (!hash) hash = "#dashboard";
  window.location.hash = hash;
}

async function router() {
  const hash = window.location.hash || "#dashboard";
  const handler = routes[hash];
  const match = hash.match(/^#incidents\/(.+)$/);
  if (match) {
    await renderIncidentDetail(match[1]);
    return;
  }
  if (handler) await handler();
  else await renderDashboard();

  updateNavActive(hash);
  closeNav();
  announcePage(hash);
}

function updateNavActive(hash) {
  $$(".nav-link").forEach((a) => {
    const href = a.getAttribute("href");
    const active = hash === href || (href === "#incidents" && hash.startsWith("#incidents/"));
    a.classList.toggle("active", active);
  });
}

function announcePage(hash) {
  const titles = {
    "#dashboard": "Dashboard", "#incidents": "Incidents",
    "#report": "Report Emergency", "#resources": "Resources",
    "#fall-detection": "AI Fall Detection",
    "#admin": "Administration",
  };
  announcer(`${titles[hash] || "Dashboard"} loaded`);
}

function openLogin() {
  const modal = $("#login-modal");
  modal.classList.add("open");
  $("#login-username")?.focus();
}
function closeLogin() {
  $("#login-modal")?.classList.remove("open");
}
function closeNav() {
  $("#site-nav")?.classList.remove("open");
  $("#overlay")?.classList.remove("visible");
  $("#nav-toggle")?.setAttribute("aria-expanded", "false");
}

/* ------------------------------------------------------------------ */
/*  Views                                                             */
/* ------------------------------------------------------------------ */

async function renderDashboard() {
  await ensureData();
  const { stats, incidents } = state;
  const active = incidents.filter((i) => i.status !== "resolved");
  const critical = incidents.filter((i) => i.severity === "severe" && i.status !== "resolved");
  const resolved = incidents.filter((i) => i.status === "resolved");

  $("#main-content").innerHTML = html`
    ${dbBanner()}
    <section class="section">
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="mb-1">Dashboard</h1>
          <p class="page-sub">Emergency operations overview</p>
        </div>
        <div class="page-actions">
          ${state.isAdmin ? html`<a href="/admin.html#admin" class="btn btn-ghost">Administration</a>` : ""}
          <a href="#report" class="btn btn-primary">New Report</a>
        </div>
      </div>

      ${critical.length ? html`
        <div class="critical-banner" role="alert">
          <div class="icon">&#9888;</div>
          <div class="content">
            <strong>${critical.length} critical incident${critical.length !== 1 ? "s" : ""} require attention</strong>
            <p>${critical.map((i) => `${esc(i.id)} — ${esc(i.title)}`).join(", ")}</p>
          </div>
        </div>
      ` : ""}

      <div class="card map-card mb-6">
        <div class="section-header mb-4">
          <div><h2 class="section-title mb-1">&#128696; Incident Map</h2></div>
        </div>
        <div id="dashboard-map-container" class="relative">
          <div id="dashboard-map" class="map-loading">Loading map&hellip;</div>
        </div>
      </div>

      <div class="grid grid-cols-4">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">&#128202;</div>
          <div class="stat">
            <div class="label">Total Incidents</div>
            <div class="value">${stats ? stats.total : incidents.length}</div>
            <div class="delta">All logged incidents</div>
          </div>
        </div>
        <div class="stat-card stat-card-active">
          <div class="stat-icon">&#128681;</div>
          <div class="stat">
            <div class="label">Active Incidents</div>
            <div class="value">${active.length}</div>
            <div class="delta neg">Not yet resolved</div>
          </div>
        </div>
        <div class="stat-card stat-card-critical">
          <div class="stat-icon">&#128682;</div>
          <div class="stat">
            <div class="label">Critical (Severe)</div>
            <div class="value">${critical.length}</div>
            <div class="delta ${critical.length ? "neg" : "pos"}>${critical.length ? "Requires attention" : "None"}</div>
          </div>
        </div>
        <div class="stat-card stat-card-resolved">
          <div class="stat-icon">&#10003;</div>
          <div class="stat">
            <div class="label">Resolved</div>
            <div class="value">${resolved.length}</div>
            <div class="delta pos">Scene cleared</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2" style="margin-top:var(--space-6);">
        <div class="card">
          <div class="section-header mb-4">
            <div><h2 class="section-title mb-1">&#128201; Incidents by Severity</h2></div>
          </div>
          <div class="stat-chart">
            ${["severe", "high", "medium", "low"].map((sev) => {
              const count = (stats?.bySeverity || []).find((b) => b._id === sev)?.count || 0;
              const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return html`
                <div class="stat-bar">
                  <div class="label"><span class="badge badge-${sev}">${SEVERITY_LABELS[sev]}</span></div>
                  <div class="track"><div class="fill ${sev}" style="width:${pct}%"></div></div>
                  <div class="value">${count}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
        <div class="card">
          <div class="section-header mb-4">
            <div><h2 class="section-title mb-1">&#128204; Incidents by Category</h2></div>
          </div>
          <div class="stat-chart">
            ${["fire", "medical", "traffic", "hazard", "utility"].map((cat) => {
              const count = (stats?.byCategory || []).find((b) => b._id === cat)?.count || 0;
              const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return html`
                <div class="stat-bar">
                  <div class="label">${CATEGORY_LABELS[cat]}</div>
                  <div class="track"><div class="fill" style="width:${pct}%; background:var(--navy-light);"></div></div>
                  <div class="value">${count}</div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </div>

      <div class="card mt-6">
        <div class="section-header mb-4">
          <div><h2 class="section-title mb-1">&#128203; Recent Incidents</h2></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th style="text-align:center;">Severity</th>
                <th style="text-align:center;">Status</th><th>Reported</th>
                <th style="width:110px;"></th>
              </tr>
            </thead>
            <tbody>
              ${incidents.slice(0, 8).map((i) => incidentRow(i)).join("")}
            </tbody>
          </table>
        </div>
        ${incidents.length === 0 ? html`
          <div class="empty mt-6"><div class="icon">&#128736;</div><h2>No incidents logged</h2></div>
        ` : ""}
      </div>
    </section>
  `;

  $$(".nav-link[href='#dashboard']").forEach((a) => a.classList.add("active"));

  // Initialize dashboard map with incident locations
  const mappedIncidents = incidents.filter((i) => i.location && i.location.lat && i.location.lng);
  if (mappedIncidents.length > 0) {
    const center = [mappedIncidents[0].location.lat, mappedIncidents[0].location.lng];
    initMap("dashboard-map", center, 13);
    mappedIncidents.forEach((i) => {
      addMarker(dashboardMap, i.location.lat, i.location.lng, {
        title: `${i.id} — ${i.title}`,
        color: SEVERITY_MAP_COLOR[i.severity] || "#0ea5e9",
        popup: `<strong>${esc(i.id)}</strong><br>${esc(i.title)}<br>${esc(i.address)}<br>${SEVERITY_LABELS[i.severity]} — ${STATUS_LABELS[i.status]}`,
      });
    });
    fitMapToMarkers(dashboardMap);
    $("#dashboard-map").className = "";
  } else {
    $("#dashboard-map").className = "";
    $("#dashboard-map").innerHTML = '<div class="map-loading">No incidents with location data</div>';
  }
}

function incidentRow(i) {
  return html`
    <tr class="severity-${i.severity}">
      <td class="id-cell">${esc(i.id)}</td>
      <td>${esc(i.title)}</td>
      <td style="text-align:center;"><span class="badge ${badgeCls(i.severity)}">${SEVERITY_LABELS[i.severity]}</span></td>
      <td style="text-align:center;"><span class="status-chip ${chipCls(i.status)}"><span class="dot"></span>${STATUS_LABELS[i.status]}</span></td>
      <td class="text-sm text-muted">${formatDateTime(i.reportedAt)}</td>
      <td style="text-align:center;"><a href="#incidents/${i.id}" class="btn btn-ghost btn-sm">View</a></td>
    </tr>
  `;
}

async function renderIncidents() {
  await ensureData();

  const app = $("#main-content");
  const statusFilter = $("#f-status") ? $("#f-status").value : "";
  const sevFilter = $("#f-severity") ? $("#f-severity").value : "";
  const catFilter = $("#f-category") ? $("#f-category").value : "";
  const q = ($("#f-q") ? $("#f-q").value : "").toLowerCase();

  let filtered = state.incidents.filter((i) => {
    const byStatus = statusFilter ? i.status === statusFilter : true;
    const bySev = sevFilter ? i.severity === sevFilter : true;
    const byCat = catFilter ? i.category === catFilter : true;
    const byQ = q ? (i.id + " " + i.title + " " + i.address + " " + (i.description || "")).toLowerCase().includes(q) : true;
    return byStatus && bySev && byCat && byQ;
  });

  app.innerHTML = html`
    ${dbBanner()}
    <section class="section">
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="mb-1">Incident Management</h1>
          <p class="page-sub">Track, classify, and update incident status.</p>
        </div>
        <div class="page-actions">
          <a href="#dashboard" class="btn btn-ghost">Back to Dashboard</a>
          <a href="#report" class="btn btn-primary">New Report</a>
          ${state.isAdmin ? html`<a href="/admin.html#admin" class="btn btn-ghost btn-outline">Administration</a>` : ""}
        </div>
      </div>

      <form id="incident-filters" class="grid grid-cols-4 gap-4 mb-6" novalidate>
        <div class="field">
          <label for="f-q">Search</label>
          <input id="f-q" type="search" placeholder="ID, title, address" value="${esc(q)}" />
        </div>
        <div class="field">
          <label for="f-status">Status</label>
          <select id="f-status">
            <option value="">All statuses</option>
            ${["active", "dispatched", "enroute", "on-scene", "resolved"].map((s) =>
              html`<option value="${s}" ${s === statusFilter ? "selected" : ""}>${STATUS_LABELS[s]}</option>`
            ).join("")}
          </select>
        </div>
        <div class="field">
          <label for="f-severity">Severity</label>
          <select id="f-severity">
            <option value="">All severities</option>
            ${["severe", "high", "medium", "low"].map((s) =>
              html`<option value="${s}" ${s === sevFilter ? "selected" : ""}>${SEVERITY_LABELS[s]}</option>`
            ).join("")}
          </select>
        </div>
        <div class="field">
          <label for="f-category">Category</label>
          <select id="f-category">
            <option value="">All categories</option>
            ${["fire", "medical", "traffic", "hazard", "utility"].map((c) =>
              html`<option value="${c}" ${c === catFilter ? "selected" : ""}>${CATEGORY_LABELS[c]}</option>`
            ).join("")}
          </select>
        </div>
        <div class="field flex items-end gap-3">
          <button type="submit" class="btn btn-primary">Filter</button>
          <button type="button" class="btn btn-ghost" id="btn-clear-filters">Clear</button>
        </div>
      </form>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Title</th><th>Address</th>
              <th style="text-align:center;">Severity</th>
              <th style="text-align:center;">Category</th>
              <th style="text-align:center;">Status</th>
              <th>Reported</th>
              <th style="width:120px;"></th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((i) => html`
              <tr class="severity-${i.severity}">
                <td class="id-cell">${esc(i.id)}</td>
                <td>${esc(i.title)}</td>
                <td class="text-sm">${esc(i.address)}</td>
                <td style="text-align:center;"><span class="badge ${badgeCls(i.severity)}">${SEVERITY_LABELS[i.severity]}</span></td>
                <td class="text-sm">${CATEGORY_LABELS[i.category]}</td>
                <td style="text-align:center;"><span class="status-chip ${chipCls(i.status)}"><span class="dot"></span>${STATUS_LABELS[i.status]}</span></td>
                <td class="text-sm text-muted">${formatDateTime(i.reportedAt)}</td>
                <td style="text-align:center;"><a href="#incidents/${i.id}" class="btn btn-ghost btn-sm">View</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <p class="mt-4 text-sm text-muted">
        Showing <strong>${filtered.length}</strong> of <strong>${state.incidents.length}</strong> incidents.
        ${filtered.length === 0 && state.incidents.length > 0 ? "No incidents match your filters." : ""}
      </p>
    </section>
  `;

  $("#incident-filters")?.addEventListener("submit", (e) => {
    e.preventDefault(); navigate("#incidents"); renderIncidents();
  });
  $("#btn-clear-filters")?.addEventListener("click", () => {
    $("#f-q").value = ""; $("#f-status").value = ""; $("#f-severity").value = ""; $("#f-category").value = "";
    navigate("#incidents"); renderIncidents(); announcer("Filters cleared");
  });
}

async function renderIncidentDetail(id) {
  $("#main-content").innerHTML = html`
    <section class="section">
      <div class="loading-inline"><span class="loader"></span>Loading incident&hellip;</div>
    </section>
  `;
  let inc;
  try {
    inc = await fetchIncident(id);
  } catch (e) {
    $("#main-content").innerHTML = html`
      <section class="section"><div class="empty">
        <div class="icon">&#9888;</div><h2>Incident not found</h2>
        <p>The requested incident could not be located.</p>
        <a href="#incidents" class="btn btn-primary">Return to incidents</a>
      </div></section>
    `;
    return;
  }

  let hospitals = [];
  try {
    hospitals = await fetchIncidentHospitals(id);
  } catch (e) {
    console.warn("hospitals:", e.message);
  }

  $("#main-content").innerHTML = html`
    ${dbBanner()}
    <section class="section">
      <div class="section-header">
        <div>
          <h1 class="mb-1">Incident ${esc(inc.id)}</h1>
          <p class="text-sm text-muted">${esc(inc.title)}</p>
        </div>
        <div class="flex gap-3">
          <a href="#incidents" class="btn btn-ghost">Back</a>
          ${state.isAdmin ? html`
            <button class="btn btn-outline btn-sm" id="btn-edit-incident">Edit</button>
            <button class="btn btn-danger btn-sm" id="btn-delete-incident">Delete</button>
          ` : ""}
          <button class="btn btn-danger" id="btn-resolve">Mark Resolved</button>
        </div>
      </div>

      ${inc.location ? html`
      <div class="card map-card mb-6">
        <div class="section-header mb-4">
          <div><h2 class="section-title mb-1">&#128696; Incident Location</h2></div>
        </div>
        <div id="incident-map-container" class="relative">
          <div id="incident-map" class="map-loading">Loading map&hellip;</div>
        </div>
      </div>
      ` : ""}

      <div class="grid grid-cols-2">
        <div class="card">
          <div class="mb-5">
            <span class="badge ${badgeCls(inc.severity)}">${SEVERITY_LABELS[inc.severity]}</span>
            <span class="badge" style="background:var(--navy-light);color:#fff;border:none;">${CATEGORY_LABELS[inc.category]}</span>
            <span class="status-chip ${chipCls(inc.status)} ml-2"><span class="dot"></span>${STATUS_LABELS[inc.status]}</span>
          </div>
          <h2 class="mb-2">Location</h2>
          <p class="font-mono text-muted mb-4">${esc(inc.address)}</h2>
          <h2 class="mb-2">Details</h2>
          <p class="mb-4">${esc(inc.description) || "No description provided."}</p>
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div><strong>Reported:</strong> ${formatDateTime(inc.reportedAt)}</div>
            <div><strong>Last updated:</strong> ${formatDateTime(inc.updatedAt)}</div>
            <div><strong>Units:</strong> ${(inc.units || []).length || "None assigned"}</div>
            <div><strong>Caller:</strong> ${esc(inc.caller) || "—"}</div>
          </div>
          <h2 class="mb-2">Timeline</h2>
          <div class="timeline mb-6">
            ${(inc.timeline || []).map((ev) => html`
              <div class="timeline-item">
                <div class="timeline-time">${esc(ev.t)}</div>
                <div class="timeline-body">
                  <h4>${esc(ev.e)}</h4><p>${esc(ev.d)}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="card">
          <h2 class="section-title mb-4"><span class="icon">&#128393;</span>Nearby Hospitals</h2>
          <p class="text-sm text-muted mb-4">Prioritized by bed availability (most beds first).</p>
          ${hospitals.length ? html`
            <div class="hospital-list">
              ${hospitals.map((h, idx) => {
                const pct = h.bedCapacity ? Math.round((h.bedAvailable / h.bedCapacity) * 100) : 0;
                const isTop = idx === 0;
                return html`
                  <div class="hospital-card ${isTop ? "hospital-top-pick" : ""}">
                    ${isTop ? html`<span class="badge badge-severe">&#9733; Top pick</span>` : html`<span class="badge ${pct < 25 ? "badge-severe" : pct < 50 ? "badge-high" : "badge-low"}">${pct}% beds</span>`}
                    <div class="hospital-info">
                      <div class="hospital-name">${esc(h.name)}</div>
                      <div class="hospital-address">${esc(h.address)}</div>
                      <div class="hospital-distance">${h.distance ? h.distance.toFixed(1) + " km" : "—"}</div>
                    </div>
                    <div class="hospital-meta">
                      <span>&#128449; ${h.bedAvailable} / ${h.bedCapacity} beds</span>
                      ${h.traumaCenter ? html`<span>&#128196; Trauma center</span>` : ""}
                      ${h.emergencyDept ? html`<span>&#128393; Emergency dept</span>` : ""}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>
          ` : html`<div class="empty"><p class="text-sm text-muted">No nearby hospitals found within 25 km.</p></div>`}
        </div>
      </div>
    </section>
  `;

  $("#btn-resolve")?.addEventListener("click", async () => {
    if (!confirm(`Mark incident ${inc.id} as resolved?`)) return;
    try {
      await updateIncident(id, { status: "resolved", notes: "Incident resolved from detail view." });
      showToast({ type: "success", message: `Incident ${inc.id} marked resolved` });
      announcer(`Incident ${inc.id} marked resolved`);
      await loadAll();
      router();
    } catch (err) {
      showToast({ type: "danger", message: "Failed to resolve: " + (err.message || err) });
    }
  });

  $("#btn-edit-incident")?.addEventListener("click", () => {
    openIncidentEditor(inc);
  });

  $("#btn-delete-incident")?.addEventListener("click", async () => {
    if (!confirm(`Delete incident ${inc.id}? This cannot be undone.`)) return;
    try {
      await deleteIncident(id);
      showToast({ type: "success", message: `Incident ${inc.id} deleted` });
      announcer(`Incident ${inc.id} deleted`);
      await loadAll();
      navigate("#incidents");
      router();
    } catch (err) {
      showToast({ type: "danger", message: "Failed to delete: " + (err.message || err) });
    }
  });

  // Initialize incident map with incident + nearby hospitals
  if (inc.location) {
    const center = [inc.location.lat, inc.location.lng];
    initMap("incident-map", center, 14);
    addMarker(incidentMap, inc.location.lat, inc.location.lng, {
      title: `${inc.id} — ${inc.title}`,
      color: SEVERITY_MAP_COLOR[inc.severity] || "#ef4444",
      popup: `<strong>${esc(inc.id)}</strong><br>${esc(inc.title)}<br>${esc(inc.address)}`,
    });
    hospitals.forEach((h) => {
      addMarker(incidentMap, h.location.lat, h.location.lng, {
        title: h.name,
        color: "#22c55e",
        popup: `<strong>${esc(h.name)}</strong><br>${esc(h.address)}<br>${h.bedAvailable} / ${h.bedCapacity} beds<br>${h.distance ? h.distance.toFixed(1) + " km" : ""}`,
      });
    });
    fitMapToMarkers(incidentMap);
    $("#incident-map").className = "";
  }
}

function openIncidentEditor(inc) {
  const modal = document.createElement("div");
  modal.className = "modal open";
  modal.innerHTML = html`
    <div class="modal-panel" style="max-width:560px;">
      <div class="modal-header">
        <h2 class="modal-title">Edit Incident ${esc(inc.id)}</h2>
        <button class="modal-close" aria-label="Close">&#215;</button>
      </div>
      <div class="modal-body">
        <form id="edit-form" novalidate>
          <div class="field">
            <label>Status</label>
            <select id="e-status" required>
              ${["active", "dispatched", "enroute", "on-scene", "resolved"].map((s) =>
                html`<option value="${s}" ${s === inc.status ? "selected" : ""}>${STATUS_LABELS[s]}</option>`
              ).join("")}
            </select>
          </div>
          <div class="field">
            <label>Severity</label>
            <select id="e-severity" required>
              ${["severe", "high", "medium", "low"].map((s) =>
                html`<option value="${s}" ${s === inc.severity ? "selected" : ""}>${SEVERITY_LABELS[s]}</option>`
              ).join("")}
            </select>
          </div>
          <div class="field">
            <label>Category</label>
            <select id="e-category" required>
              ${["fire", "medical", "traffic", "hazard", "utility"].map((c) =>
                html`<option value="${c}" ${c === inc.category ? "selected" : ""}>${CATEGORY_LABELS[c]}</option>`
              ).join("")}
            </select>
          </div>
          <div class="field">
            <label>Title</label>
            <input id="e-title" type="text" required value="${esc(inc.title)}" />
          </div>
          <div class="field">
            <label>Address</label>
            <input id="e-address" type="text" required value="${esc(inc.address)}" />
          </div>
          <div class="field">
            <label>Description</label>
            <textarea id="e-description" rows="3">${esc(inc.description || "")}</textarea>
          </div>
          <div class="field-error" id="e-error"></div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="e-cancel">Cancel</button>
        <button class="btn btn-primary" id="e-save">Save changes</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector(".modal-close")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });

  $("#e-cancel")?.addEventListener("click", close);
  $("#e-save")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const status = $("#e-status").value;
    const severity = $("#e-severity").value;
    const category = $("#e-category").value;
    const title = $("#e-title").value.trim();
    const address = $("#e-address").value.trim();
    const description = $("#e-description").value.trim();
    if (!title || !address) {
      $("#e-error").textContent = "Title and address are required.";
      return;
    }
    try {
      await updateIncident(inc.id, { status, severity, category, title, address, description });
      close();
      showToast({ type: "success", message: `Incident ${inc.id} updated` });
      announcer(`Incident ${inc.id} updated`);
      await loadAll();
      router();
    } catch (err) {
      $("#e-error").textContent = err.message || "Failed to save.";
      showToast({ type: "danger", message: "Failed to save: " + (err.message || err) });
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Report form                                                       */
/* ------------------------------------------------------------------ */
async function renderReport() {
  await ensureData();
  const app = $("#main-content");
  app.innerHTML = html`
    ${dbBanner()}
    <section class="section" style="max-width:720px;">
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="mb-1">Report Emergency</h1>
          <p class="page-sub">Submit a new incident to the operations center.</p>
        </div>
        <a href="#dashboard" class="btn btn-ghost">Back to Dashboard</a>
      </div>

      <div class="card">
        <form id="report-form" novalidate>
        <div class="field">
          <label for="r-title">Incident title <span style="color:var(--red)">required</span></label>
          <input id="r-title" type="text" required placeholder="e.g. Structure fire — Oakridge Ave" />
          <div class="field-error" id="r-title-error">Title is required.</div>
        </div>
        <div class="field">
          <label for="r-address">Address / location <span style="color:var(--red)">required</span></label>
          <input id="r-address" type="text" required placeholder="e.g. 1420 Oakridge Ave, Unit C" />
          <div class="field-error" id="r-address-error">Address is required.</div>
        </div>
        <div class="field" style="display:flex; gap:var(--space-3); align-items:flex-end;">
          <label for="r-lat" style="margin:0; width:90px;">Latitude</label>
          <input id="r-lat" type="number" step="any" placeholder="lat" />
          <label for="r-lng" style="margin:0; width:90px;">Longitude</label>
          <input id="r-lng" type="number" step="any" placeholder="lng" />
          <button type="button" id="btn-use-geolocation" class="btn btn-sm btn-ghost" style="padding:var(--space-2) var(--space-4);">Use my location</button>
          <p class="form-hint" style="margin:0; margin-left:var(--space-3);">Optional map coordinates</p>
        </div>
        <div class="form-grid form-grid-2">
          <div class="field">
            <label for="r-severity">Severity <span style="color:var(--red)">required</span></label>
            <select id="r-severity" required>
              <option value="">Select severity</option>
              ${["severe", "high", "medium", "low"].map((s) =>
                html`<option value="${s}">${SEVERITY_LABELS[s]}</option>`
              ).join("")}
            </select>
            <div class="field-error" id="r-severity-error">Select a severity.</div>
          </div>
          <div class="field">
            <label for="r-category">Category <span style="color:var(--red)">required</span></label>
            <select id="r-category" required>
              <option value="">Select category</option>
              ${["fire", "medical", "traffic", "hazard", "utility"].map((c) =>
                html`<option value="${c}">${CATEGORY_LABELS[c]}</option>`
              ).join("")}
            </select>
            <div class="field-error" id="r-category-error">Select a category.</div>
          </div>
        </div>
        <div class="field">
          <label for="r-description">Description</label>
          <textarea id="r-description" rows="4" placeholder="What is happening? Hazards, injuries, people involved?"></textarea>
        </div>
        <div class="field">
          <label for="r-caller">Caller name (optional)</label>
          <input id="r-caller" type="text" placeholder="Name of person reporting" />
        </div>
        <div class="field">
          <label for="r-caller-phone">Caller phone (optional)</label>
          <input id="r-caller-phone" type="tel" placeholder="Callback number" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-ghost" id="btn-report-cancel">Cancel</button>
          <button type="submit" class="btn btn-primary">Submit Report</button>
        </div>
        <div id="report-success" class="alert alert-success hidden" style="margin-top:var(--space-4);">
          <strong>Report submitted.</strong> <span id="report-success-id"></span>
        </div>
      </form>
      </div>
    </section>
  `;

  const form = $("#report-form");
  const success = $("#report-success");
  const successId = $("#report-success-id");

  $("#btn-report-cancel")?.addEventListener("click", () => navigate("#dashboard"));

  $("#btn-use-geolocation")?.addEventListener("click", () => {
    if (!navigator.geolocation) {
      showToast({ type: "danger", message: "Geolocation not supported by this browser." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        $("#r-lat").value = pos.coords.latitude.toFixed(6);
        $("#r-lng").value = pos.coords.longitude.toFixed(6);
        showToast({ type: "success", message: "Location captured from device" });
      },
      () => {
        showToast({ type: "danger", message: "Unable to access device location." });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $$("#report-form [required]").forEach((el) => {
      const field = el.closest(".field");
      if (!el.value.trim()) { field.classList.add("error"); } else { field.classList.remove("error"); }
    });
    if (!$("#r-title").value.trim() || !$("#r-address").value.trim() || !$("#r-severity").value || !$("#r-category").value) {
      announcer("Please complete the required fields");
      return;
    }

    const lat = $("#r-lat") ? parseFloat($("#r-lat").value) : null;
    const lng = $("#r-lng") ? parseFloat($("#r-lng").value) : null;
    const location = (!Number.isNaN(lat) && !Number.isNaN(lng)) ? { lat, lng } : null;

    const body = {
      title: $("#r-title").value.trim(),
      address: $("#r-address").value.trim(),
      severity: $("#r-severity").value,
      category: $("#r-category").value,
      status: "active",
      description: $("#r-description").value.trim(),
      caller: $("#r-caller").value.trim() || null,
      callerPhone: $("#r-caller-phone").value.trim() || null,
      location,
    };

    try {
      const inc = await createIncident(body);
      form.style.display = "none";
      success.classList.remove("hidden");
      successId.textContent = `Incident ${inc.id} (${inc.severity} — ${CATEGORY_LABELS[inc.category]}) has been logged.`;
      showToast({ type: "success", message: `Incident ${inc.id} reported` });
      announcer(`Incident ${inc.id} reported`);
      await loadAll();
    } catch (err) {
      showToast({ type: "danger", message: "Failed to submit report: " + (err.message || err) });
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Resources                                                         */
/* ------------------------------------------------------------------ */
async function renderResources() {
  await ensureData();
  const app = $("#main-content");
  app.innerHTML = html`
    ${dbBanner()}
    <section class="section">
      <div class="section-header">
        <div>
          <h1 class="mb-1">Resources</h1>
          <p class="text-sm text-muted">Units and personnel status.</p>
        </div>
        <a href="#dashboard" class="btn btn-ghost">Back to Dashboard</a>
      </div>

      <div class="grid grid-cols-2">
        <div class="card">
          <h2 class="section-title mb-4"><span class="icon">&#128680;</span>Units (${state.units.length})</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Type</th><th style="text-align:center;">Status</th><th>Location</th><th style="width:110px;"></th></tr></thead>
              <tbody>
                ${state.units.map((u) => html`
                  <tr>
                    <td class="id-cell font-mono">${esc(u.id)}</td>
                    <td>${esc(u.name)}</td>
                    <td class="text-sm">${esc(u.type)}</td>
                    <td style="text-align:center;"><span class="status-chip ${chipCls(u.status === "available" ? "low" : u.status === "on-scene" ? "medium" : "high")}"><span class="dot"></span>${esc(u.status)}</span></td>
                    <td class="text-sm">${esc(u.location)}</td>
                    <td style="text-align:center;">
                      ${state.isAdmin ? html`<button class="btn btn-ghost btn-sm" onclick="window.editUnit('${esc(u.id)}')">Edit</button>` : ""}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <h2 class="section-title mb-4"><span class="icon">&#128104;</span>Personnel (${state.personnel.length})</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Role</th><th style="text-align:center;">Status</th><th>Unit</th><th style="width:110px;"></th></tr></thead>
              <tbody>
                ${state.personnel.map((p) => html`
                  <tr>
                    <td>${esc(p.name)}</td>
                    <td class="text-sm">${esc(p.role)}</td>
                    <td style="text-align:center;"><span class="status-chip ${chipCls(p.status === "available" ? "low" : p.status === "on-scene" ? "medium" : "high")}"><span class="dot"></span>${esc(p.status)}</span></td>
                    <td class="text-sm font-mono text-muted">${esc(p.unit) || "—"}</td>
                    <td style="text-align:center;">
                      ${state.isAdmin ? html`<button class="btn btn-ghost btn-sm" onclick="window.editPerson('${esc(p.id)}')">Edit</button>` : ""}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `;

  window.editUnit = (id) => openUnitEditor(id);
  window.editPerson = (id) => openPersonEditor(id);
}

function openUnitEditor(id) {
  const u = state.units.find((x) => x.id === id);
  if (!u) return;
  const modal = document.createElement("div");
  modal.className = "modal open";
  modal.innerHTML = html`
    <div class="modal-panel" style="max-width:420px;">
      <div class="modal-header">
        <h2 class="modal-title">Edit Unit ${esc(u.id)}</h2>
        <button class="modal-close" aria-label="Close">&#215;</button>
      </div>
      <div class="modal-body">
        <form id="unit-form" novalidate>
          <div class="field">
            <label>Status</label>
            <select id="u-status" required>
              ${["available", "enroute", "on-scene"].map((s) =>
                html`<option value="${s}" ${s === u.status ? "selected" : ""}>${esc(s)}</option>`
              ).join("")}
            </select>
          </div>
          <div class="field">
            <label>Location</label>
            <input id="u-location" type="text" required value="${esc(u.location || "")}" />
          </div>
          <div class="field-error" id="u-error"></div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="u-cancel">Cancel</button>
        <button class="btn btn-primary" id="u-save">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector(".modal-close")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  $("#u-cancel")?.addEventListener("click", close);
  $("#u-save")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await updateUnit(id, { status: $("#u-status").value, location: $("#u-location").value.trim() });
      close(); showToast({ type: "success", message: `Unit ${id} updated` });
      announcer(`Unit ${id} updated`);
      await loadAll(); router();
    } catch (err) {
      $("#u-error").textContent = err.message || "Failed to save.";
      showToast({ type: "danger", message: "Failed to save unit: " + (err.message || err) });
    }
  });
}

function openPersonEditor(id) {
  const p = state.personnel.find((x) => x.id === id);
  if (!p) return;
  const modal = document.createElement("div");
  modal.className = "modal open";
  modal.innerHTML = html`
    <div class="modal-panel" style="max-width:420px;">
      <div class="modal-header">
        <h2 class="modal-title">Edit Personnel ${esc(p.id)}</h2>
        <button class="modal-close" aria-label="Close">&#215;</button>
      </div>
      <div class="modal-body">
        <form id="person-form" novalidate>
          <div class="field">
            <label>Status</label>
            <select id="p-status" required>
              ${["available", "enroute", "on-scene"].map((s) =>
                html`<option value="${s}" ${s === p.status ? "selected" : ""}>${esc(s)}</option>`
              ).join("")}
            </select>
          </div>
          <div class="field">
            <label>Unit</label>
            <input id="p-unit" type="text" value="${esc(p.unit || "")}" />
          </div>
          <div class="field-error" id="p-error"></div>
        </form>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" id="p-cancel">Cancel</button>
        <button class="btn btn-primary" id="p-save">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector(".modal-close")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  $("#p-cancel")?.addEventListener("click", close);
  $("#p-save")?.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await updatePersonnel(id, { status: $("#p-status").value, unit: $("#p-unit").value.trim() || null });
      close(); showToast({ type: "success", message: `Personnel ${id} updated` });
      announcer(`Personnel ${id} updated`);
      await loadAll(); router();
    } catch (err) {
      $("#p-error").textContent = err.message || "Failed to save.";
      showToast({ type: "danger", message: "Failed to save personnel: " + (err.message || err) });
    }
  });
}

/* ------------------------------------------------------------------ */
/*  AI Fall Detection                                                 */
/* ------------------------------------------------------------------ */

async function renderFallDetection() {
  await ensureData();
  const app = $("#main-content");

  // Fetch fall risk map data (markers with locations)
  let fallRisk = { ok: true, total: 0, markers: [] };
  try {
    fallRisk = await fetchFallRiskMap();
  } catch (e) {
    console.warn("fall risk map:", e.message);
  }

  const detections = state.fallDetections || [];
  const high = detections.filter((d) => d.riskLevel === "high").length;
  const medium = detections.filter((d) => d.riskLevel === "medium").length;
  const low = detections.filter((d) => d.riskLevel === "low").length;

  app.innerHTML = html`
    ${dbBanner()}
    <section class="section">
      <div class="page-header">
        <div class="page-title-group">
          <h1 class="mb-1">&#128695; AI Fall Detection</h1>
          <p class="page-sub">AI-assisted fall incident detection and risk mapping.</p>
        </div>
        <div class="page-actions">
          <a href="#dashboard" class="btn btn-ghost">Back to Dashboard</a>
          <a href="#report" class="btn btn-primary">Report Emergency</a>
        </div>
      </div>

      <div class="alert alert-info" role="alert" style="margin-bottom:var(--space-6);">
        <strong>Illustrative AI — not a clinical diagnostic tool.</strong>
        Fall detection uses keyword heuristics on incident titles and descriptions
        (e.g. "fall", "slip", "tripped") combined with severity to assign a confidence score.
        Always verify with on-scene assessment.
      </div>

      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="stat-card stat-card-total">
          <div class="stat-icon">&#128695;</div>
          <div class="stat">
            <div class="label">Fall Detections</div>
            <div class="value">${detections.length}</div>
            <div class="delta">${fallRisk.total} with location data</div>
          </div>
        </div>
        <div class="stat-card stat-card-critical">
          <div class="stat-icon">&#9888;</div>
          <div class="stat">
            <div class="label">High Risk</div>
            <div class="value" style="color:var(--severe-dark);">${high}</div>
            <div class="delta neg">Immediate review</div>
          </div>
        </div>
        <div class="stat-card stat-card-active">
          <div class="stat-icon">&#128308;</div>
          <div class="stat">
            <div class="label">Medium Risk</div>
            <div class="value" style="color:#9a3412;">${medium}</div>
            <div class="delta">Assess promptly</div>
          </div>
        </div>
        <div class="stat-card stat-card-resolved">
          <div class="stat-icon">&#128994;</div>
          <div class="stat">
            <div class="label">Low Risk</div>
            <div class="value" style="color:#166534;">${low}</div>
            <div class="delta pos">Monitor</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2">
        <div class="card">
          <div class="section-header mb-4">
            <div><h2 class="section-title mb-1">&#128201; Detections by Confidence</h2></div>
          </div>
          <div style="max-height:420px; overflow-y:auto; border:var(--border); border-radius:var(--radius); background:var(--surface); padding:var(--space-4);">
            ${detections.length ? detections.map((d) => html`
              <div style="display:flex; justify-content:space-between; align-items:center; padding:var(--space-3); border-bottom:var(--line-soft); ${d.riskLevel === 'high' ? 'background:var(--severe-bg)' : ''}">
                <div style="min-width:0;">
                  <div style="font-weight:700; color:var(--ink);">${esc(d.incidentId)} — ${esc(d.title)}</div>
                  <div class="text-sm text-muted">${esc(d.address)}</div>
                  <div class="text-xs text-muted mt-1">${formatDateTime(d.reportedAt)} &middot; ${d.category} &middot; ${d.status}</div>
                </div>
                <div style="display:flex; align-items:center; gap:var(--space-3); flex-shrink:0;">
                  <span class="badge ${d.riskLevel === 'high' ? 'badge-severe' : d.riskLevel === 'medium' ? 'badge-high' : 'badge-low'}">
                    ${d.riskLevel.charAt(0).toUpperCase() + d.riskLevel.slice(1)}
                  </span>
                  <span class="font-mono text-muted">${d.confidence}% confidence</span>
                </div>
              </div>
            `).join("") : html`
              <div class="empty" style="padding:var(--space-8);">
                <div class="icon" style="font-size:2.5rem;">&#128736;</div>
                <h2>No fall detections</h2>
                <p class="text-sm text-muted">No incidents matched fall-related keywords.</p>
              </div>
            `}
          </div>
        </div>

        <div class="card map-card mb-6">
          <div class="section-header mb-4">
            <div><h2 class="section-title mb-1">&#128696; Fall Risk Map</h2></div>
          </div>
          <div id="fall-map-container" class="relative">
            <div id="fall-map" class="map-loading">Loading map&hellip;</div>
          </div>
        </div>
      </div>
    </section>
  `;

  $$(".nav-link[href='#fall-detection']").forEach((a) => a.classList.add("active"));

  // Initialize fall risk map
  const markers = fallRisk.markers || [];
  if (markers.length > 0) {
    const center = [markers[0].lat, markers[0].lng];
    initMap("fall-map", center, 13);
    markers.forEach((m) => {
      addMarker(fallMap, m.lat, m.lng, {
        title: `${m.incidentId || m.id} — ${m.title}`,
        color: FALL_RISK_COLOR[m.riskLevel] || "#15803d",
        icon: "&#1F6B7;",
        popup: `<strong>${esc(m.incidentId || m.id)}</strong><br>${esc(m.title)}<br>${esc(m.address)}<br>Risk: ${m.riskLevel} (${m.confidence}%)`,
      });
    });
    fitMapToMarkers(fallMap);
    $("#fall-map").className = "";
  } else {
    $("#fall-map").className = "";
    $("#fall-map").innerHTML = '<div class="map-loading">No fall incidents with location data</div>';
  }
}

/* ------------------------------------------------------------------ */
/*  Admin                                                             */
/* ------------------------------------------------------------------ */
async function renderAdmin() {
  if (!state.isAdmin) {
    openLogin();
    return;
  }
  await ensureData();
  const app = $("#main-content");
  app.innerHTML = html`
    ${dbBanner()}
    <section class="section">
      <div class="section-header">
        <div>
          <h1 class="mb-1">Administration</h1>
          <p class="text-sm text-muted">Manage incidents, units, and personnel.</p>
        </div>
        <div class="flex gap-3">
          <a href="#dashboard" class="btn btn-ghost">Back to Dashboard</a>
          <button class="btn btn-sm btn-danger" id="btn-admin-logout">Sign out</button>
        </div>
      </div>

      <div class="grid grid-cols-2">
        <div class="card">
          <h2 class="section-title mb-4"><span class="icon">&#128204;</span>All Incidents</h2>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Title</th><th style="text-align:center;">Severity</th><th style="text-align:center;">Status</th><th style="width:120px;"></th></tr></thead>
              <tbody>
                ${state.incidents.map((i) => html`
                  <tr>
                    <td class="id-cell font-mono">${esc(i.id)}</td>
                    <td>${esc(i.title)}</td>
                    <td style="text-align:center;"><span class="badge ${badgeCls(i.severity)}">${SEVERITY_LABELS[i.severity]}</span></td>
                    <td style="text-align:center;"><span class="status-chip ${chipCls(i.status)}"><span class="dot"></span>${STATUS_LABELS[i.status]}</span></td>
                    <td style="text-align:center;">
                      <a href="#incidents/${i.id}" class="btn btn-ghost btn-sm">Manage</a>
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
        <div class="card">
          <h2 class="section-title mb-4"><span class="icon">&#128274;</span>System</h2>
          <p class="text-sm text-muted mb-4">Administrative actions.</p>
          <div class="form-actions" style="flex-direction:column; gap:var(--space-2);">
            <button class="btn btn-outline w-full" id="btn-reset-db">Reset database to seed data</button>
            <button class="btn btn-outline w-full" id="btn-export-csv">Export incidents (CSV)</button>
          </div>
        </div>
      </div>
    </section>
  `;

  $("#btn-admin-logout")?.addEventListener("click", async () => {
    try { await authLogout(); } catch {}
    state.isAdmin = false; state.username = null;
    updateAuthUI(); navigate("#dashboard"); router();
  });
  $("#btn-reset-db")?.addEventListener("click", async () => {
    if (!confirm("Reset the database to seed data? All changes will be lost.")) return;
    try {
      await fetch("/api/reset", { method: "POST", credentials: "include" });
      showToast({ type: "success", message: "Database reset to seed data" });
      await loadAll();
      router();
    } catch (e) {
      showToast({ type: "danger", message: "Reset failed: " + (e.message || e) });
    }
  });
  $("#btn-export-csv")?.addEventListener("click", async () => {
    try {
      const csv = await exportIncidentsCsv();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `incidents-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast({ type: "success", message: "Incidents exported to CSV" });
    } catch (e) {
      showToast({ type: "danger", message: "Export failed: " + (e.message || e) });
    }
  });
}

/* ------------------------------------------------------------------ */
/*  Data banner / ensure                                              */
/* ------------------------------------------------------------------ */
function dbBanner() {
  if (!state.dbOnline) {
    return html`
      <div class="alert alert-danger" role="alert" style="margin-bottom:var(--space-6);">
        <strong>Database offline.</strong> The backend is not reachable or the data store is not loaded.
        Start the backend: <code>cd server && npm start</code>
      </div>
    `;
  }
  return "";
}

async function ensureData() {
  if (state.incidents.length && state.units.length) return;
  await loadAll();
}

/* ------------------------------------------------------------------ */
/*  Render current route                                              */
/* ------------------------------------------------------------------ */
function renderCurrent() {
  const hash = window.location.hash || "#dashboard";
  const match = hash.match(/^#incidents\/(.+)$/);
  if (match) { renderIncidentDetail(match[1]); return; }
  const h = routes[hash];
  if (h) h(); else renderDashboard();
}

/* ------------------------------------------------------------------ */
/*  Init                                                              */
/* ------------------------------------------------------------------ */
function init() {
  $("#main-content").innerHTML = html`
    <section class="section">
      <div class="loading-inline"><span class="loader"></span>Loading system&hellip;</div>
    </section>
  `;
  loadAll().then(() => {
    router();
    window.addEventListener("hashchange", router);
  });

  const toggle = $("#nav-toggle");
  const sidebar = $("#site-nav");
  const overlay = $("#overlay");
  if (toggle && sidebar && overlay) {
    toggle.addEventListener("click", () => {
      const open = !sidebar.classList.contains("open");
      sidebar.classList.toggle("open", open);
      overlay.classList.toggle("visible", open);
      toggle.setAttribute("aria-expanded", open);
    });
    overlay.addEventListener("click", closeNav);
  }

  $("#login-close")?.addEventListener("click", closeLogin);
  $("#login-modal")?.addEventListener("click", (e) => { if (e.target === $("#login-modal")) closeLogin(); });
  $("#login-form")?.addEventListener("click", (e) => e.stopPropagation());
  $("#login-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = $("#login-username").value;
    const pass = $("#login-password").value;
    try {
      await authLogin(user, pass);
      const me = await authMe();
      state.isAdmin = me.isAdmin;
      state.username = me.username;
      document.body.setAttribute("data-admin", state.isAdmin ? "true" : "false");
      updateAuthUI();
      closeLogin();
      showToast({ type: "success", message: "Signed in as administrator" });
      announcer("Signed in as administrator");
      renderCurrent();
    } catch (err) {
      $("#login-error").textContent = err.message || "Invalid credentials.";
      showToast({ type: "danger", message: "Sign-in failed: " + (err.message || err) });
    }
  });
}

init();
