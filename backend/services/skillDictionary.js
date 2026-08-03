/**
 * skillDictionary.js
 * ---------------------------------------------------------------------------
 * A real ATS (Workday, Greenhouse, Taleo, etc.) does not "understand" a
 * resume the way a human recruiter does. Under the hood it mostly does
 * keyword / phrase spotting against a controlled vocabulary, then scores
 * how much of a job's required vocabulary shows up in the resume.
 *
 * This file is that controlled vocabulary. Each entry maps a canonical
 * skill name to a list of surface forms (synonyms, abbreviations, casing
 * variants) that should all count as a match for that skill. Keeping this
 * as its own file means growing the ATS to a new domain (e.g. marketing,
 * finance) is just a matter of extending this list — no changes needed to
 * the matching logic itself.
 * ---------------------------------------------------------------------------
 */

const SKILL_DICTIONARY = {
  // Languages
  Python: ["python"],
  "R Programming": ["\\br\\b(?=.*(programming|studio|language))", "r-lang"],
  SQL: ["sql", "mysql", "postgresql", "postgres", "t-sql", "pl/sql"],
  Java: ["\\bjava\\b(?!script)"],
  JavaScript: ["javascript", "js\\b"],
  "C/C++": ["\\bc\\+\\+", "\\bc\\b(?=.*(programming|language))"],
  HTML: ["html"],
  CSS: ["css"],

  // Data analysis & ML
  "Machine Learning": ["machine learning", "\\bml\\b"],
  "Deep Learning": ["deep learning", "neural network"],
  "Data Analysis": ["data analysis", "data analytics"],
  "Exploratory Data Analysis": ["exploratory data analysis", "\\beda\\b"],
  "Statistical Analysis": ["statistical analysis", "statistics", "hypothesis testing"],
  "Data Cleaning": ["data cleaning", "data wrangling", "data preprocessing"],
  Regression: ["regression", "linear regression", "logistic regression"],
  Classification: ["classification", "decision tree", "random forest"],
  "Feature Engineering": ["feature engineering"],
  "Natural Language Processing": ["natural language processing", "\\bnlp\\b", "sentiment analysis"],
  "Time Series Analysis": ["time series", "time-series", "forecasting"],
  "A/B Testing": ["a/b testing", "ab testing"],

  // Libraries / frameworks
  Pandas: ["pandas"],
  NumPy: ["numpy"],
  "Scikit-learn": ["scikit-learn", "sklearn"],
  TensorFlow: ["tensorflow"],
  PyTorch: ["pytorch"],
  Matplotlib: ["matplotlib"],
  Seaborn: ["seaborn"],

  // BI / visualization tools
  "Power BI": ["power bi", "powerbi"],
  Tableau: ["tableau"],
  Excel: ["excel", "spreadsheets"],
  "Looker/Looker Studio": ["looker"],

  // Data engineering / platforms
  "Big Data": ["big data", "hadoop", "spark", "pyspark"],
  "Cloud Platforms": ["aws", "azure", "gcp", "google cloud"],
  Git: ["\\bgit\\b", "github", "version control"],
  ETL: ["\\betl\\b", "data pipeline"],
  APIs: ["\\bapi\\b", "rest api", "restful"],

  // Soft / analyst-specific
  "Dashboard Design": ["dashboard"],
  "Data Storytelling": ["data storytelling", "data-driven storytelling"],
  "Stakeholder Communication": ["stakeholder", "cross-functional"],
  "Project Management": ["project management", "agile", "scrum"],
};

// Compiled once at startup so every parse call re-uses the same regex.
const COMPILED_DICTIONARY = Object.entries(SKILL_DICTIONARY).map(
  ([canonicalName, patterns]) => ({
    canonicalName,
    regex: new RegExp(patterns.join("|"), "i"),
  })
);

/**
 * Scans free text and returns the set of canonical skills detected in it.
 * This is used on BOTH the job description and the resume text so the two
 * are compared on the same normalized vocabulary.
 */
function extractSkills(text) {
  if (!text) return [];
  const found = new Set();
  for (const { canonicalName, regex } of COMPILED_DICTIONARY) {
    if (regex.test(text)) found.add(canonicalName);
  }
  return Array.from(found);
}

/** Pulls a candidate's email address out of resume text. */
function extractEmail(text) {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

/** Pulls a phone number out of resume text (loose, international-friendly). */
function extractPhone(text) {
  const match = text.match(/(\+?\d{1,3}[\s-]?)?\d{10}\b/);
  return match ? match[0].trim() : null;
}

/**
 * Very rough "years of experience" detector. Prefers the specific phrase
 * "X years of experience" (much less likely to be a false positive than a
 * bare number-near-the-word-"years" match), and falls back to a generic
 * "X years"/"X yrs" mention only if that's not found.
 *
 * Either way, the result is sanity-bounded to a plausible career length
 * (0–40 years) so a stray number elsewhere in the resume — a date range, a
 * percentage, a phone-number fragment, garbled PDF text — can't produce an
 * implausible value like "50 years".
 */
function extractYearsOfExperience(text) {
  if (!text) return 0;

  const specific = text.match(
    /(\d{1,2})\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:professional\s+|relevant\s+|work\s+)?experience/i
  );
  if (specific) {
    const years = parseInt(specific[1], 10);
    if (years >= 0 && years <= 40) return years;
  }

  const generic = text.match(/\b(\d{1,2})\+?\s*(years|yrs)\b/i);
  if (generic) {
    const years = parseInt(generic[1], 10);
    if (years >= 0 && years <= 40) return years;
  }

  return 0;
}

module.exports = {
  SKILL_DICTIONARY,
  extractSkills,
  extractEmail,
  extractPhone,
  extractYearsOfExperience,
};
