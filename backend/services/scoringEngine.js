/**
 * scoringEngine.js
 * ---------------------------------------------------------------------------
 * This is the heart of the "ATS" — the part that turns two blobs of text
 * (a job description and a resume) into a single ranked score plus an
 * explanation of *why* the candidate got that score.
 *
 * The score is a weighted blend of four signals, each one explainable on
 * its own — this mirrors how real ATS platforms describe their scoring,
 * and it means a candidate (or a reviewer of this project) can see exactly
 * why a resume landed where it did instead of trusting a black box.
 *
 *   1. Skill match      (65%) — of the skills the job asks for, how many
 *                                appear in the resume?
 *   2. Experience match (20%) — does the candidate meet the job's stated
 *                                minimum years of experience?
 *   3. Keyword density   (10%) — beyond a yes/no skill match, how often do
 *                                the required keywords actually appear?
 *                                (Guards against resumes that mention a
 *                                skill exactly once just to game the system.)
 *   4. Resume completeness (5%) — does the resume even parse out contact
 *                                info? A resume the ATS can't read properly
 *                                is a resume a recruiter never sees.
 * ---------------------------------------------------------------------------
 */

const {
  extractSkills,
  extractEmail,
  extractPhone,
  extractYearsOfExperience,
} = require("./skillDictionary");

const WEIGHTS = {
  skillMatch: 0.65,
  experienceMatch: 0.2,
  keywordDensity: 0.1,
  completeness: 0.05,
};

/**
 * Counts how many times each required skill's pattern occurs in the resume
 * text (not just whether it occurs). Used for the keyword-density signal.
 */
function countKeywordOccurrences(resumeText, requiredSkills) {
  const lowerText = resumeText.toLowerCase();
  let totalOccurrences = 0;
  for (const skill of requiredSkills) {
    // crude but effective: count occurrences of the skill name itself
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lowerText.match(new RegExp(escaped, "g"));
    totalOccurrences += matches ? matches.length : 0;
  }
  return totalOccurrences;
}

/**
 * Extracts the minimum years of experience the JOB is asking for
 * (as opposed to extractYearsOfExperience, which reads years OFF a resume).
 */
/**
 * Extracts the minimum years of experience the JOB is asking for (as
 * opposed to extractYearsOfExperience, which reads years OFF a resume).
 * Same specific-phrase-first, sanity-bounded approach — see the comment on
 * extractYearsOfExperience in skillDictionary.js for why.
 */
function extractRequiredYears(jobDescription) {
  if (!jobDescription) return 0;

  const specific = jobDescription.match(
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:professional\s+|relevant\s+|work\s+)?experience/i
  );
  if (specific) {
    const years = parseInt(specific[1], 10);
    if (years >= 0 && years <= 40) return years;
  }

  const generic = jobDescription.match(/\b(\d{1,2})\+?\s*(years|yrs)\b/i);
  if (generic) {
    const years = parseInt(generic[1], 10);
    if (years >= 0 && years <= 40) return years;
  }

  return 0;
}

/**
 * Main entry point: score one resume against one job.
 *
 * @param {string} jobDescription - raw job description text
 * @param {string} resumeText - raw text extracted from the uploaded resume
 * @returns {object} a full scoring breakdown, ready to store + display
 */
function scoreResume(jobDescription, resumeText) {
  const requiredSkills = extractSkills(jobDescription);
  const resumeSkills = extractSkills(resumeText);

  const matchedSkills = requiredSkills.filter((skill) =>
    resumeSkills.includes(skill)
  );
  const missingSkills = requiredSkills.filter(
    (skill) => !resumeSkills.includes(skill)
  );

  // --- 1. Skill match -------------------------------------------------
  const skillMatchScore =
    requiredSkills.length === 0
      ? 100 // job listed no detectable skills — don't punish the candidate
      : (matchedSkills.length / requiredSkills.length) * 100;

  // --- 2. Experience match --------------------------------------------
  const requiredYears = extractRequiredYears(jobDescription);
  const candidateYears = extractYearsOfExperience(resumeText);
  let experienceScore = 100;
  if (requiredYears > 0) {
    experienceScore = Math.min(100, (candidateYears / requiredYears) * 100);
  }

  // --- 3. Keyword density -----------------------------------------------
  // More mentions of the required vocabulary (up to a cap) signals a
  // resume that's genuinely built around that domain, not just name-dropping.
  const occurrences = countKeywordOccurrences(resumeText, requiredSkills);
  const densityScore =
    requiredSkills.length === 0
      ? 100
      : Math.min(100, (occurrences / (requiredSkills.length * 2)) * 100);

  // --- 4. Resume completeness -------------------------------------------
  const email = extractEmail(resumeText);
  const phone = extractPhone(resumeText);
  const completenessScore =
    (email ? 50 : 0) + (phone ? 50 : 0);

  // --- Weighted total -----------------------------------------------------
  const overallScore = Math.round(
    skillMatchScore * WEIGHTS.skillMatch +
      experienceScore * WEIGHTS.experienceMatch +
      densityScore * WEIGHTS.keywordDensity +
      completenessScore * WEIGHTS.completeness
  );

  return {
    overallScore,
    breakdown: {
      skillMatch: Math.round(skillMatchScore),
      experienceMatch: Math.round(experienceScore),
      keywordDensity: Math.round(densityScore),
      completeness: Math.round(completenessScore),
    },
    requiredSkills,
    matchedSkills,
    missingSkills,
    candidateYears,
    requiredYears,
    contact: { email, phone },
  };
}

module.exports = { scoreResume, extractRequiredYears };
