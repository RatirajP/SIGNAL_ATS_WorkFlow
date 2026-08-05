/**
 * server.js
 * ---------------------------------------------------------------------------
 * Entry point. Wires up Express, CORS, JSON body parsing, the API routes,
 * and — in production — serves the built React frontend too, so the whole
 * app deploys as a single service with a single public URL.
 * ---------------------------------------------------------------------------
 */

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const jobsRouter = require("./routes/jobs");
const { router: candidatesRouter } = require("./routes/candidates");
const dashboardRouter = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Simple health check — handy when deploying, and a nice first thing to
// hit when demoing the project.
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "ats-backend", time: new Date().toISOString() });
});

app.use("/api/jobs", jobsRouter);
app.use("/api/dashboard", dashboardRouter);
// candidatesRouter defines its own full paths (/jobs/:jobId/candidates,
// /candidates/:id) so it's mounted at the API root rather than /api/candidates.
app.use("/api", candidatesRouter);

// --- Serve the built frontend (production) ---------------------------------
// After `npm run build` in /frontend, the compiled site lands in
// frontend/dist. If that folder exists, serve it as static files and send
// index.html for any non-API route so React Router's client-side routes
// (e.g. /jobs/3, /candidates/7) work on a hard refresh or direct link.
const frontendDist = path.join(__dirname, "..", "frontend", "dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Centralized error handler — catches Multer file-type/size errors and
// anything else thrown in a route, so the client always gets clean JSON
// instead of an HTML stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => {
  console.log(`ATS backend running at http://localhost:${PORT}`);
});
