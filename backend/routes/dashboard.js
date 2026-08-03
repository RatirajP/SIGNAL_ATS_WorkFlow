/**
 * routes/dashboard.js
 * ---------------------------------------------------------------------------
 * Every number and chart on the Dashboard and Analytics pages is computed
 * here, server-side, from the same jobs/candidates data the rest of the API
 * uses — nothing here is mocked. Keeping the aggregation on the backend
 * means the frontend never has to re-implement this logic, and a future
 * real database swap only touches this one file.
 * ---------------------------------------------------------------------------
 */

const express = require("express");
const router = express.Router();
const db = require("../db");

function average(numbers) {
  if (numbers.length === 0) return 0;
  return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
}

// GET /api/dashboard/summary — the KPI cards on the homepage
router.get("/summary", (req, res) => {
  const jobs = db.getAll("jobs");
  const candidates = db.getAll("candidates");

  const scores = candidates.map((c) => c.overallScore);
  const interviewedOrLater = candidates.filter((c) =>
    ["Interview", "Offer", "Hired"].includes(c.status)
  ).length;
  const offeredOrHired = candidates.filter((c) =>
    ["Offer", "Hired"].includes(c.status)
  ).length;

  res.json({
    totalJobs: jobs.length,
    totalCandidates: candidates.length,
    averageScore: average(scores),
    interviewRate:
      candidates.length === 0
        ? 0
        : Math.round((interviewedOrLater / candidates.length) * 100),
    offerRate:
      candidates.length === 0
        ? 0
        : Math.round((offeredOrHired / candidates.length) * 100),
    activeRecruitments: jobs.length, // every open job counts as active in this model
  });
});

// GET /api/dashboard/analytics — data for every chart on the Analytics page
router.get("/analytics", (req, res) => {
  const jobs = db.getAll("jobs");
  const candidates = db.getAll("candidates");

  // 1. ATS score distribution, bucketed into 10-point bands
  const scoreDistribution = Array.from({ length: 10 }, (_, i) => {
    const bandStart = i * 10;
    const bandEnd = bandStart + 10;
    return {
      band: `${bandStart}-${bandEnd}`,
      count: candidates.filter(
        (c) => c.overallScore >= bandStart && c.overallScore < bandEnd + (i === 9 ? 1 : 0)
      ).length,
    };
  });

  // 2. Candidate experience distribution
  const experienceBuckets = [
    { label: "0-1 yrs", test: (y) => y <= 1 },
    { label: "2-3 yrs", test: (y) => y >= 2 && y <= 3 },
    { label: "4-6 yrs", test: (y) => y >= 4 && y <= 6 },
    { label: "7+ yrs", test: (y) => y >= 7 },
  ];
  const experienceDistribution = experienceBuckets.map((bucket) => ({
    label: bucket.label,
    count: candidates.filter((c) => bucket.test(c.candidateYears || 0)).length,
  }));

  // 3. Skills frequency — how often each skill shows up across all resumes
  const skillCounts = {};
  candidates.forEach((c) => {
    (c.matchedSkills || []).forEach((skill) => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
  });
  const skillsFrequency = Object.entries(skillCounts)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 4. Hiring funnel — how many candidates are at each stage or further
  const STAGE_ORDER = ["Applied", "Screening", "Interview", "Offer", "Hired"];
  const hiringFunnel = STAGE_ORDER.map((stage, index) => {
    const laterStages = STAGE_ORDER.slice(index);
    return {
      stage,
      count: candidates.filter((c) => laterStages.includes(c.status)).length,
    };
  });

  // 5. Application timeline — candidates uploaded per day
  const timelineMap = {};
  candidates.forEach((c) => {
    const day = (c.uploadedAt || "").slice(0, 10);
    if (!day) return;
    timelineMap[day] = (timelineMap[day] || 0) + 1;
  });
  const applicationTimeline = Object.entries(timelineMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  // 6. Job-wise candidate count
  const jobWiseCandidateCount = jobs.map((job) => ({
    job: job.title,
    count: candidates.filter((c) => c.jobId === job.id).length,
  }));

  res.json({
    scoreDistribution,
    experienceDistribution,
    skillsFrequency,
    hiringFunnel,
    applicationTimeline,
    jobWiseCandidateCount,
  });
});

module.exports = router;
