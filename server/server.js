/*
 * Emergency Response & Operations — Express backend (JSON file store)
 *
 * REST API for incidents, units, personnel, hospitals, dashboard stats, and
 * admin session authentication. Data persists in server/data/db.json.
 * No MongoDB required — runs with `npm install && npm start`.
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const {
  load, save, db, find, findOne, insertOne, updateOne, deleteOne, count, aggregate,
} = require("./store");

const app = express();
const PORT = process.env.PORT || 4000;

/* ------------------------------------------------------------------ */
/*  Load data on startup                                              */
/* ------------------------------------------------------------------ */
load();
console.log("[store] data loaded from", require("./store").DB_FILE);

/* ------------------------------------------------------------------ */
/*  Middleware                                                        */
/* ------------------------------------------------------------------ */

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const isOriginAllowed = (origin) => allowedOrigins.includes(origin);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl) or from allowed origins
      if (!origin || isOriginAllowed(origin)) {
        callback(null, origin);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

/* ------------------------------------------------------------------ */
/*  CORS origin header (explicit fallback)                            */
/* ------------------------------------------------------------------ */
/*  Ensures Access-Control-Allow-Origin is always sent for allowed    */
/*  origins, even when the cors package skips it.                     */
/* ------------------------------------------------------------------ */

app.use((_req, res, next) => {
  const origin = _req.headers.origin;
  console.log("[cors-debug] origin:", JSON.stringify(origin), "allowedOrigins:", JSON.stringify(allowedOrigins), "includes:", origin ? allowedOrigins.includes(origin) : "n/a");
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.vary("Origin");
    console.log("[cors-debug] set ACAO header to:", origin);
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: "er_session",
    secret: process.env.SESSION_SECRET || "change-me-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 8,
    },
  }
));

/* ------------------------------------------------------------------ */
/*  Auth helpers                                                      */
/* ------------------------------------------------------------------ */

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

const isAdmin = (req, res, next) => {
  if (req.session && req.session.isAdmin) return next();
  return res.status(401).json({ error: "Admin authentication required" });
};

/* ------------------------------------------------------------------ */
/*  Health                                                            */
/* ------------------------------------------------------------------ */

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "emergency-response-api",
    store: "json-file",
    time: new Date().toISOString(),
  });
});

/* ------------------------------------------------------------------ */
/*  Meta                                                              */
/* ------------------------------------------------------------------ */

app.get("/api/meta", (_req, res) => {
  res.json({
    statusOrder: ["active", "dispatched", "enroute", "on-scene", "resolved"],
    statusLabels: {
      active: "Active",
      dispatched: "Dispatched",
      enroute: "En Route",
      "on-scene": "On Scene",
      resolved: "Resolved",
    },
    severities: ["severe", "high", "medium", "low"],
    severityLabels: {
      severe: "Severe",
      high: "High",
      medium: "Medium",
      low: "Low",
    },
    categories: ["fire", "medical", "traffic", "hazard", "utility"],
    categoryLabels: {
      fire: "Fire",
      medical: "Medical",
      traffic: "Traffic",
      hazard: "Hazard",
      utility: "Utility",
    },
  });
});

/* ------------------------------------------------------------------ */
/*  Auth                                                              */
/* ------------------------------------------------------------------ */

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    req.session.isAdmin = true;
    req.session.username = username;
    return res.json({ ok: true, username });
  }
  return res.status(401).json({ error: "Invalid credentials" });
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("er_session");
    res.json({ ok: true });
  });
});

app.get("/api/auth/me", (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.json({ isAdmin: true, username: req.session.username });
  }
  res.json({ isAdmin: false });
});

/* ------------------------------------------------------------------ */
/*  Incidents                                                         */
/* ------------------------------------------------------------------ */

app.get("/api/incidents", async (req, res) => {
  try {
    const { status, severity, category, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (q) {
      const re = new RegExp(q, "i");
      filter.$or = [
        { id: re },
        { title: re },
        { address: re },
        { description: re },
      ];
    }

    let incidents = find("incidents", filter);
    incidents = [...incidents].sort(
      (a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)
    );
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/incidents/:id", async (req, res) => {
  try {
    const inc = findOne("incidents", { id: req.params.id });
    if (!inc) return res.status(404).json({ error: "Incident not found" });
    res.json(inc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/incidents", async (req, res) => {
  try {
    const { title, address, severity, category, status, description, caller, callerPhone } = req.body;

    if (!title || !title.trim())
      return res.status(400).json({ error: "Title is required" });
    if (!address || !address.trim())
      return res.status(400).json({ error: "Address is required" });
    if (!["severe", "high", "medium", "low"].includes(severity))
      return res.status(400).json({ error: "Invalid severity" });
    if (!["fire", "medical", "traffic", "hazard", "utility"].includes(category))
      return res.status(400).json({ error: "Invalid category" });

    const existing = find("incidents", { title: title.trim(), address: address.trim() });
    if (existing.length > 0) {
      return res.status(409).json({ error: "A similar incident already exists" });
    }

    const all = find("incidents", {});
    const year = new Date().getFullYear();
    const seq = String(all.length + 1).padStart(3, "0");
    const id = `IRN-${year}-${seq}`;
    const now = new Date().toISOString();

    const incident = {
      id,
      title: title.trim(),
      address: address.trim(),
      severity,
      category,
      status: status || "active",
      reportedAt: now,
      updatedAt: now,
      units: [],
      description: (description || "").trim(),
      timeline: [
        { t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), e: "Call received", d: "Incident reported.", s: status || "active" },
      ],
      caller: caller || null,
      callerPhone: callerPhone || null,
    };

    insertOne("incidents", incident);
    res.status(201).json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/incidents/:id", isAdmin, async (req, res) => {
  try {
    const incident = findOne("incidents", { id: req.params.id });
    if (!incident) return res.status(404).json({ error: "Incident not found" });

    const { status, severity, category, title, address, description, units, notes } = req.body;
    const updates = {};
    if (status) updates.status = status;
    if (severity) updates.severity = severity;
    if (category) updates.category = category;
    if (title !== undefined) updates.title = title.trim();
    if (address !== undefined) updates.address = address.trim();
    if (description !== undefined) updates.description = description.trim();
    if (units) updates.units = units;
    updates.updatedAt = new Date().toISOString();

    updateOne("incidents", { id: req.params.id }, updates);

    if (status) {
      const updated = findOne("incidents", { id: req.params.id });
      updated.timeline.push({
        t: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        e: `Status changed to ${status}`,
        d: notes || `Incident status updated to ${status}.`,
        s: status,
      });
      updateOne("incidents", { id: req.params.id }, { timeline: updated.timeline });
    }

    res.json(findOne("incidents", { id: req.params.id }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/incidents/:id", isAdmin, async (req, res) => {
  try {
    const deleted = deleteOne("incidents", { id: req.params.id });
    if (!deleted) return res.status(404).json({ error: "Incident not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Dashboard statistics                                              */
/* ------------------------------------------------------------------ */

app.get("/api/stats", async (_req, res) => {
  try {
    const allIncidents = find("incidents", {});
    const total = allIncidents.length;
    const active = allIncidents.filter((i) => i.status !== "resolved").length;
    const critical = allIncidents.filter(
      (i) => i.severity === "severe" && i.status !== "resolved"
    ).length;
    const resolved = allIncidents.filter((i) => i.status === "resolved").length;

    const byStatus = aggregate("incidents", [
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const bySeverity = aggregate("incidents", [
      { $group: { _id: "$severity", count: { $sum: 1 } } },
    ]);
    const byCategory = aggregate("incidents", [
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    res.json({
      total,
      active,
      critical,
      pending: active,
      resolved,
      byStatus,
      bySeverity,
      byCategory,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Units                                                             */
/* ------------------------------------------------------------------ */

app.get("/api/units", async (_req, res) => {
  try {
    const units = find("units", {}).sort((a, b) => a.id.localeCompare(b.id));
    res.json(units);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/units/:id", isAdmin, async (req, res) => {
  try {
    const updated = updateOne("units", { id: req.params.id }, req.body);
    if (!updated) return res.status(404).json({ error: "Unit not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Personnel                                                         */
/* ------------------------------------------------------------------ */

app.get("/api/personnel", async (_req, res) => {
  try {
    const personnel = find("personnel", {}).sort((a, b) => a.id.localeCompare(b.id));
    res.json(personnel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/personnel/:id", isAdmin, async (req, res) => {
  try {
    const updated = updateOne("personnel", { id: req.params.id }, req.body);
    if (!updated) return res.status(404).json({ error: "Person not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Hospitals                                                         */
/* ------------------------------------------------------------------ */

const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

app.get("/api/hospitals", async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    const hospitals = find("hospitals", {});

    if (lat && lng) {
      const radiusKm = parseFloat(radius) || 25;
      return res.json(
        hospitals
          .map((h) => ({
            ...h,
            distance: haversineKm(parseFloat(lat), parseFloat(lng), h.location.lat, h.location.lng),
          }))
          .filter((h) => h.distance <= radiusKm)
          .sort((a, b) => b.bedAvailable - a.bedAvailable)
      );
    }

    res.json(hospitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/hospitals/:id", async (req, res) => {
  try {
    const h = findOne("hospitals", { id: req.params.id });
    if (!h) return res.status(404).json({ error: "Hospital not found" });
    res.json(h);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/incidents/:id/hospitals", async (req, res) => {
  try {
    const inc = findOne("incidents", { id: req.params.id });
    if (!inc) return res.status(404).json({ error: "Incident not found" });
    if (!inc.location) return res.json([]);

    const radiusKm = parseFloat(req.query.radius) || 25;
    const hospitals = find("hospitals", {});
    const near = hospitals
      .map((h) => ({
        ...h,
        distance: haversineKm(inc.location.lat, inc.location.lng, h.location.lat, h.location.lng),
      }))
      .filter((h) => h.distance <= radiusKm)
      .sort((a, b) => b.bedAvailable - a.bedAvailable);
    res.json(near);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  AI Fall Detection                                                 */
/* ------------------------------------------------------------------ */

/*
 * Heuristic "AI" fall detection.
 * Flags incidents in the medical category whose title/description contains
 * fall-related keywords, then assigns a confidence score and risk level.
 * This is illustrative sample logic — not a clinical diagnostic tool.
 */

const FALL_KEYWORDS = ["fall", "fell", "fallen", "slip", "tripped", "collapse", "collapsed"];

function fallConfidence(incident) {
  const text = `${incident.title || ""} ${incident.description || ""}`.toLowerCase();
  const keywordHits = FALL_KEYWORDS.filter((k) => text.includes(k)).length;
  if (keywordHits === 0) return 0;
  let confidence = 60 + Math.min(keywordHits * 10, 30);
  if (incident.severity === "severe") confidence += 10;
  else if (incident.severity === "high") confidence += 5;
  return Math.min(confidence, 98);
}

function fallRiskLevel(confidence) {
  if (confidence >= 80) return "high";
  if (confidence >= 50) return "medium";
  return "low";
}

app.get("/api/ai/fall-detection", async (_req, res) => {
  try {
    const incidents = find("incidents", {});
    const detections = incidents
      .map((inc) => {
        const confidence = fallConfidence(inc);
        if (confidence === 0) return null;
        return {
          incidentId: inc.id,
          title: inc.title,
          address: inc.address,
          category: inc.category,
          severity: inc.severity,
          status: inc.status,
          location: inc.location || null,
          reportedAt: inc.reportedAt,
          confidence,
          riskLevel: fallRiskLevel(confidence),
          detectedAt: new Date().toISOString(),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.confidence - a.confidence);

    res.json({
      ok: true,
      total: detections.length,
      byRiskLevel: {
        high: detections.filter((d) => d.riskLevel === "high").length,
        medium: detections.filter((d) => d.riskLevel === "medium").length,
        low: detections.filter((d) => d.riskLevel === "low").length,
      },
      detections,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/ai/fall-risk-map", async (_req, res) => {
  try {
    const incidents = find("incidents", {});
    const markers = incidents
      .map((inc) => {
        if (!inc.location || !inc.location.lat || !inc.location.lng) return null;
        const confidence = fallConfidence(inc);
        if (confidence === 0) return null;
        return {
          id: `fall-${inc.id}`,
          lat: inc.location.lat,
          lng: inc.location.lng,
          title: inc.title,
          address: inc.address,
          severity: inc.severity,
          status: inc.status,
          confidence,
          riskLevel: fallRiskLevel(confidence),
          reportedAt: inc.reportedAt,
        };
      })
      .filter(Boolean);

    res.json({ ok: true, total: markers.length, markers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Export incidents (CSV)                                            */
/* ------------------------------------------------------------------ */

app.get("/api/incidents/export", isAdmin, async (_req, res) => {
  try {
    const incidents = find("incidents", {}).sort(
      (a, b) => new Date(b.reportedAt) - new Date(a.reportedAt)
    );
    const header = [
      "id", "title", "address", "category", "severity", "status",
      "reportedAt", "updatedAt", "units", "description", "caller", "callerPhone",
    ];
    const esc = (v) => {
      const s = String(v == null ? "" : v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [header.join(","), ...incidents.map((i) => [
      esc(i.id), esc(i.title), esc(i.address), esc(i.category), esc(i.severity),
      esc(i.status), esc(i.reportedAt), esc(i.updatedAt),
      esc((i.units || []).join(";")), esc(i.description), esc(i.caller), esc(i.callerPhone),
    ].join(","))];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="incidents-${new Date().toISOString().slice(0,10)}.csv"`);
    res.send(lines.join("\n"));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Reset (admin)                                                     */
/* ------------------------------------------------------------------ */

app.post("/api/reset", isAdmin, async (_req, res) => {
  try {
    const { INCIDENTS, UNITS, PERSONNEL, HOSPITALS } = require("./seed-data");
    COLLECTIONS.forEach((c) => {
      db[c] = [];
    });
    db.incidents = INCIDENTS;
    db.units = UNITS;
    db.personnel = PERSONNEL;
    db.hospitals = HOSPITALS;
    save();
    res.json({ ok: true, message: "Database reset to seed data" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------ */
/*  Static frontend (served on same origin)                           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Start                                                             */
/* ------------------------------------------------------------------ */

app.listen(PORT, () => {
  console.log(`Emergency Response API listening on http://localhost:${PORT}`);
});

module.exports = app;
