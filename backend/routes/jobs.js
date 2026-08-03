/**
 * routes/jobs.js
 * ---------------------------------------------------------------------------
 * Everything related to job postings: create, list, view one, delete.
 * A "job" is the yardstick every resume gets measured against, so creating
 * one is step #1 of the ATS workflow.
 * ---------------------------------------------------------------------------
 */

const express = require("express");
const router = express.Router();
const db = require("../db");
const { extractSkills } = require("../services/skillDictionary");
const { extractRequiredYears } = require("../services/scoringEngine");

// POST /api/jobs — create a new job posting
router.post("/", (req, res) => {
  const { title, company, department, location, description } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ error: "title and description are required" });
  }

  // Auto-detect the required skills straight from the job description text,
  // using the same dictionary the scoring engine uses on resumes. This is
  // what keeps job and resume matching apples-to-apples.
  const requiredSkills = extractSkills(description);
  const requiredYears = extractRequiredYears(description);

  const job = db.insert("jobs", {
    title,
    company: company || "Your Company",
    department: department || "General",
    location: location || "Remote",
    description,
    requiredSkills,
    requiredYears,
    status: "Open",
    createdAt: new Date().toISOString(),
  });

  res.status(201).json(job);
});

// GET /api/jobs — list all job postings, most recent first
router.get("/", (req, res) => {
  const candidates = db.getAll("candidates");
  const jobs = db
    .getAll("jobs")
    .map((job) => {
      const jobCandidates = candidates.filter((c) => c.jobId === job.id);
      const avgScore =
        jobCandidates.length === 0
          ? 0
          : Math.round(
              jobCandidates.reduce((sum, c) => sum + c.overallScore, 0) / jobCandidates.length
            );
      return { ...job, applicantCount: jobCandidates.length, averageScore: avgScore };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(jobs);
});

// GET /api/jobs/:id — fetch a single job
router.get("/:id", (req, res) => {
  const job = db.getById("jobs", req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

// PATCH /api/jobs/:id/status — toggle hiring status (Open/Closed)
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  if (!["Open", "Closed"].includes(status)) {
    return res.status(400).json({ error: "status must be 'Open' or 'Closed'" });
  }
  const updated = db.update("jobs", req.params.id, { status });
  if (!updated) return res.status(404).json({ error: "Job not found" });
  res.json(updated);
});

// DELETE /api/jobs/:id — remove a job (and its candidates, to keep data tidy)
router.delete("/:id", (req, res) => {
  const removed = db.remove("jobs", req.params.id);
  if (!removed) return res.status(404).json({ error: "Job not found" });

  // Cascade delete: a candidate record with no job it belongs to is dead
  // weight, so clean those up too.
  db.getAll("candidates")
    .filter((c) => c.jobId === Number(req.params.id))
    .forEach((c) => db.remove("candidates", c.id));

  res.status(204).send();
});

module.exports = router;
