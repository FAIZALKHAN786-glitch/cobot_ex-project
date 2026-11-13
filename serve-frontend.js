/*
 * Emergency Response & Operations — Frontend Server
 * Serves the static frontend on port 3000.
 * API calls go to http://localhost:4000 (separate backend server).
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname; // emergency-response/

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

const server = http.createServer((req, res) => {
  let filePath = path.join(ROOT, req.url === "/" ? "index.html" : req.url);

  // Security: prevent directory traversal
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(ROOT + path.sep) && resolvedPath !== ROOT) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(resolvedPath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        // SPA fallback — serve index.html for client-side routing
        fs.readFile(path.join(ROOT, "index.html"), (err2, content2) => {
          if (err2) {
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Server error");
          } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(content2);
          }
        });
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Server error: " + err.code);
      }
    } else {
      const ext = path.extname(resolvedPath).toLowerCase();
      const contentType = mimeTypes[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Frontend server running on http://localhost:${PORT}`);
  console.log(`API server should be running on http://localhost:4000`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
  } else {
    console.error(err);
  }
});
