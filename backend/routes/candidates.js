/**
 * routes/candidates.js
 * ---------------------------------------------------------------------------
 * The candidate pipeline: upload a resume against a job, get it parsed and
 * scored automatically, then move it through statuses as a recruiter would
 * (Applied -> Screening -> Interview -> Offer -> Hired / Rejected).
 * ---------------------------------------------------------------------------
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const { extractTextFromFile, guessName } = require("../services/resumeParser");
const { scoreResume } = require("../services/scoringEngine");
const { buildRecommendation } = require("../services/recommendationEngine");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error("Only .pdf, .docx, and .txt resumes are accepted"));
    }
    cb(null, true);
  },
});

const VALID_STATUSES = [
  "Applied",
  "Screening",
  "Interview",
  "Offer",
  "Hired",
  "Rejected",
];

// POST /api/jobs/:jobId/candidates — upload + auto-score one or more resumes
router.post(
  "/jobs/:jobId/candidates",
  upload.array("resumes", 20),
  async (req, res) => {
    const job = db.getById("jobs", req.params.jobId);
    if (!job) return res.status(404).json({ error: "Job not found" });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No resume files were uploaded" });
    }

    const results = [];

    for (const file of req.files) {
      try {
        const resumeText = await extractTextFromFile(file.path);
        const scoring = scoreResume(job.description, resumeText);

        const candidate = db.insert("candidates", {
          jobId: job.id,
          name: guessName(resumeText),
          email: scoring.contact.email,
          phone: scoring.contact.phone,
          fileName: file.originalname,
          filePath: file.path,
          resumeText,
          overallScore: scoring.overallScore,
          breakdown: scoring.breakdown,
          matchedSkills: scoring.matchedSkills,
          missingSkills: scoring.missingSkills,
          candidateYears: scoring.candidateYears,
          requiredYears: scoring.requiredYears,
          status: "Applied",
          uploadedAt: new Date().toISOString(),
        });

        results.push(candidate);
      } catch (err) {
        results.push({
          fileName: file.originalname,
          error: err.message,
        });
      }
    }

    res.status(201).json(results);
  }
);

// GET /api/candidates — every candidate across every job, for the global
// Candidates page. Each row is tagged with its job title so the UI can show
// which role a candidate applied to without an extra lookup.
router.get("/candidates", (req, res) => {
  const jobs = db.getAll("jobs");
  const jobTitleById = Object.fromEntries(jobs.map((j) => [j.id, j.title]));

  const candidates = db
    .getAll("candidates")
    .map(({ resumeText, ...rest }) => ({ ...rest, jobTitle: jobTitleById[rest.jobId] || "Unknown role" }))
    .sort((a, b) => b.overallScore - a.overallScore);

  res.json(candidates);
});

// GET /api/jobs/:jobId/candidates — ranked candidate list for a job
router.get("/jobs/:jobId/candidates", (req, res) => {
  const job = db.getById("jobs", req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found" });

  const candidates = db
    .getAll("candidates")
    .filter((c) => c.jobId === job.id)
    // strip the full resume text out of the list view — the dashboard
    // only needs it in the single-candidate detail view
    .map(({ resumeText, ...rest }) => rest)
    .sort((a, b) => b.overallScore - a.overallScore);

  res.json(candidates);
});

// GET /api/candidates/:id/file — stream the original resume file for preview.
// PDFs render directly in the browser via <iframe>/<object>; other types are
// offered as a download since browsers can't natively render .docx/.txt inline.
router.get("/candidates/:id/file", (req, res) => {
  const candidate = db.getById("candidates", req.params.id);
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });
  if (!candidate.filePath || !fs.existsSync(candidate.filePath)) {
    return res.status(404).json({ error: "Resume file no longer available" });
  }

  const ext = path.extname(candidate.filePath).toLowerCase();
  const contentTypes = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
  };
  res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${candidate.fileName}"`
  );
  fs.createReadStream(candidate.filePath).pipe(res);
});

// GET /api/candidates/:id — full candidate detail, including resume text
router.get("/candidates/:id", (req, res) => {
  const candidate = db.getById("candidates", req.params.id);
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });

  const recommendation = buildRecommendation({
    overallScore: candidate.overallScore,
    breakdown: candidate.breakdown,
    matchedSkills: candidate.matchedSkills,
    missingSkills: candidate.missingSkills,
    candidateYears: candidate.candidateYears,
    requiredYears: candidate.requiredYears,
  });

  res.json({ ...candidate, recommendation });
});

// PATCH /api/candidates/:id/status — move a candidate through the pipeline
router.patch("/candidates/:id/status", (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }

  const updated = db.update("candidates", req.params.id, { status });
  if (!updated) return res.status(404).json({ error: "Candidate not found" });
  res.json(updated);
});

// DELETE /api/candidates/:id — remove a candidate (and their uploaded file)
router.delete("/candidates/:id", (req, res) => {
  const candidate = db.getById("candidates", req.params.id);
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });

  if (candidate.filePath && fs.existsSync(candidate.filePath)) {
    fs.unlinkSync(candidate.filePath);
  }
  db.remove("candidates", req.params.id);
  res.status(204).send();
});

module.exports = { router, VALID_STATUSES };
