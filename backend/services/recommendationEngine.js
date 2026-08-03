/**
 * recommendationEngine.js
 * ---------------------------------------------------------------------------
 * Powers the "AI Suggestions" / "Recruiter Recommendation" panel on the
 * Resume Analysis page.
 *
 * IMPORTANT — honesty note: this is a deterministic, rule-based engine, not
 * a call to a language model. It's built entirely from the scoring
 * breakdown that already exists (skill match, experience match, keyword
 * density, completeness), so the "recommendation" is really just that data
 * translated into recruiter-friendly language. This keeps the demo fast,
 * free, and offline.
 *
 * If you want a genuinely AI-generated recommendation instead, the natural
 * upgrade is to send `candidate.resumeText` + the job description to the
 * Anthropic API (see the commented stub at the bottom of this file) and use
 * its response in place of `buildRecommendation()`'s output. That requires
 * an ANTHROPIC_API_KEY and is a good "v2" feature to mention in an
 * interview — deliberately left out here to avoid shipping a demo that
 * silently stops working the moment an API key is missing or rate-limited.
 * ---------------------------------------------------------------------------
 */

function buildRecommendation(scoring) {
  const { overallScore, breakdown, matchedSkills, missingSkills, candidateYears, requiredYears } = scoring;

  // Interview probability: a smoothed version of the overall score, nudged
  // by whether the candidate clears the experience bar.
  let interviewProbability = overallScore;
  if (requiredYears > 0 && candidateYears < requiredYears) {
    interviewProbability = Math.max(0, interviewProbability - 15);
  }
  interviewProbability = Math.min(97, Math.max(3, Math.round(interviewProbability)));

  const strengths = [];
  if (breakdown.skillMatch >= 70) strengths.push("Covers most of the role's required skills");
  if (breakdown.experienceMatch >= 100) strengths.push("Meets or exceeds the experience requirement");
  if (breakdown.keywordDensity >= 60) strengths.push("Resume is clearly built around this domain, not just keyword-dropping");
  if (breakdown.completeness === 100) strengths.push("Contact details are complete and easy to reach");
  if (matchedSkills.length >= 8) strengths.push(`Strong breadth across ${matchedSkills.length} required skills`);
  if (strengths.length === 0) strengths.push("Resume parsed cleanly with no extraction issues");

  const weaknesses = [];
  if (breakdown.skillMatch < 50) weaknesses.push("Fewer than half of the required skills were detected");
  if (requiredYears > 0 && candidateYears < requiredYears) {
    weaknesses.push(`States ${candidateYears} year(s) of experience against a ${requiredYears}+ year requirement`);
  }
  if (breakdown.keywordDensity < 30) weaknesses.push("Required skills are mentioned only in passing, if at all");
  if (breakdown.completeness < 100) weaknesses.push("Missing contact information (email or phone) could not be extracted");
  if (weaknesses.length === 0) weaknesses.push("No significant gaps detected against this job's requirements");

  let overallRecommendation;
  let recruiterAction;
  if (overallScore >= 75) {
    overallRecommendation = "Strong match — recommend advancing to interview";
    recruiterAction = "Fast-track for a screening call this week";
  } else if (overallScore >= 50) {
    overallRecommendation = "Partial match — worth a closer manual review";
    recruiterAction = "Have a recruiter review the resume before deciding";
  } else {
    overallRecommendation = "Weak match — unlikely to meet this role's core requirements";
    recruiterAction = "Consider for a different open role, or pass";
  }

  return {
    overallRecommendation,
    interviewProbability,
    strengths,
    weaknesses,
    missingSkills,
    recruiterAction,
  };
}

module.exports = { buildRecommendation };

/* ---------------------------------------------------------------------------
 * Optional "v2" stub — swap buildRecommendation() for a real LLM call:
 *
 * const Anthropic = require("@anthropic-ai/sdk");
 * const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
 *
 * async function buildRecommendationWithAI(jobDescription, resumeText, scoring) {
 *   const msg = await client.messages.create({
 *     model: "claude-sonnet-4-6",
 *     max_tokens: 500,
 *     messages: [{
 *       role: "user",
 *       content: `Job description:\n${jobDescription}\n\nResume:\n${resumeText}\n\n` +
 *         `Scoring data: ${JSON.stringify(scoring)}\n\n` +
 *         `Return JSON with: overallRecommendation, interviewProbability (0-100), ` +
 *         `strengths (array), weaknesses (array), recruiterAction.`
 *     }],
 *   });
 *   return JSON.parse(msg.content[0].text);
 * }
 * ------------------------------------------------------------------------- */
