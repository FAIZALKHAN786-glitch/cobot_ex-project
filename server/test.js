/*
 * Self-contained integration test for JSON-file backend.
 * Starts server in-process, makes HTTP requests via Node's http module,
 * then shuts down.
 */

const http = require("http");
const { load, save, db, COLLECTIONS } = require("./store");
const { INCIDENTS, UNITS, PERSONNEL, HOSPITALS } = require("./seed-data");
const app = require("./server");

const PORT = 4099;
const base = `http://localhost:${PORT}`;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, base);
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(JSON.stringify(body)) } : {},
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data || "{}") }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

let passed = 0, failed = 0;
function check(name, cond, extra = "") {
  if (cond) { passed++; console.log("  PASS " + name); }
  else { failed++; console.log("  FAIL " + name + " " + extra); }
}

(async () => {
  const server = app.listen(PORT, async () => {
    try {
      // Re-seed for clean test state
      COLLECTIONS.forEach((c) => { db[c] = []; });
      db.incidents = INCIDENTS;
      db.units = UNITS;
      db.personnel = PERSONNEL;
      db.hospitals = HOSPITALS;
      save();

      // health
      let r = await request("GET", "/api/health");
      check("health ok", r.status === 200 && r.body.ok === true, JSON.stringify(r.body));
      check("health store json", r.body.store === "json-file");

      // meta
      r = await request("GET", "/api/meta");
      check("meta ok", r.status === 200 && Array.isArray(r.body.categories));

      // incidents list
      r = await request("GET", "/api/incidents");
      check("list incidents", r.status === 200 && Array.isArray(r.body) && r.body.length === 5, `got ${r.body.length}`);

      // get single incident
      r = await request("GET", "/api/incidents/IRN-2026-012");
      check("get incident", r.status === 200 && r.body.id === "IRN-2026-012", JSON.stringify(r.body.error));

      // 404
      r = await request("GET", "/api/incidents/NOPE");
      check("404 missing", r.status === 404, `status ${r.status}`);

      // create incident
      r = await request("POST", "/api/incidents", {
        title: "Test incident", address: "123 Test St", severity: "medium",
        category: "medical", status: "active", description: "Test description",
        caller: "Test Caller", callerPhone: "555-0100"
      });
      const newId = r.body.id;
      check("create incident", r.status === 201 && r.body.id && r.body.status === "active", `status ${r.status}`);

      // validation
      r = await request("POST", "/api/incidents", { title: "" });
      check("create validation", r.status === 400, `status ${r.status}`);

      // patch to resolved (requires admin session -> 401 without auth)
      r = await request("PATCH", `/api/incidents/${newId}`, { status: "resolved", notes: "Test resolved" });
      check("patch requires auth", r.status === 401, `status ${r.status}`);

      // units
      r = await request("GET", "/api/units");
      check("list units", r.status === 200 && Array.isArray(r.body) && r.body.length === 6, `got ${r.body.length}`);

      // personnel
      r = await request("GET", "/api/personnel");
      check("list personnel", r.status === 200 && Array.isArray(r.body) && r.body.length === 6, `got ${r.body.length}`);

      // hospitals nearby (sorted by beds desc)
      r = await request("GET", "/api/hospitals?lat=40.7580&lng=-73.9855&radius=25");
      check("nearby hospitals", r.status === 200 && r.body.length > 0, `got ${r.body.length}`);
      const sorted = r.body.every((h, i, arr) => i === 0 || arr[i-1].bedAvailable >= h.bedAvailable);
      check("hospitals sorted by beds desc", sorted);
      check("first hospital most beds", r.body[0].name === "University General Hospital" && r.body[0].bedAvailable === 120);

      // incident hospitals
      r = await request("GET", "/api/incidents/IRN-2026-012/hospitals");
      check("incident hospitals", r.status === 200 && r.body.length > 0, `got ${r.body.length}`);

      // stats
      r = await request("GET", "/api/stats");
      check("stats ok", r.status === 200 && typeof r.body.total === "number", `total=${r.body.total}`);

      // reset
      r = await request("POST", "/api/reset", {}, { headers: { cookie: "er_session=fake" } });
      // reset requires admin session; without it returns 401
      check("reset requires auth", r.status === 401, `status ${r.status}`);

      console.log(`\n${passed} passed, ${failed} failed`);
    } catch (e) {
      console.error("Test error:", e.message);
      failed++;
    } finally {
      server.close();
      process.exit(failed > 0 ? 1 : 0);
    }
  });
})();
