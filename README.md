# Signal — an ATS (Applicant Tracking System) workflow

A full-stack portfolio project that recreates the core loop of a real ATS,
redesigned as a modern SaaS recruiting platform: post a job → candidates'
resumes get parsed and automatically scored against it → recruiters review,
filter, and move candidates through a hiring pipeline, backed by a live
analytics dashboard.

```
Job description  ──► skill/requirement extraction
                                │
Resume (PDF/DOCX/TXT) ──► text extraction ──► skill extraction ──► SCORE
                                                                      │
                                                     ranked, filterable candidates
                                                                      │
                                              pipeline: Applied → Screening →
                                              Interview → Offer → Hired/Rejected
                                                                      │
                                                    dashboard + analytics charts
```

---

## 1. Project structure

```
ats-project/
├── backend/                     Node.js + Express API
│   ├── server.js                 entry point
│   ├── db.js                     tiny JSON-file "database"
│   ├── data/db.json               where jobs + candidates are stored
│   ├── uploads/                   uploaded resume files land here
│   ├── routes/
│   │   ├── jobs.js                 create/list/delete/toggle-status job postings
│   │   ├── candidates.js           upload, score, rank, file preview, status
│   │   └── dashboard.js            KPI summary + all 6 analytics charts
│   └── services/
│       ├── skillDictionary.js      the controlled vocabulary + regex extractors
│       ├── resumeParser.js         PDF/DOCX/TXT → plain text
│       ├── scoringEngine.js        the matching algorithm itself
│       └── recommendationEngine.js rule-based "AI Suggestions" panel
│
├── frontend/                    React + Vite SaaS-style single-page app
│   └── src/
│       ├── App.jsx                 route definitions
│       ├── main.jsx                providers (theme, toast, router)
│       ├── api.js                  every fetch()/XHR call, in one place
│       ├── contexts/
│       │   ├── ThemeContext.jsx      light/dark mode, persisted
│       │   └── ToastContext.jsx      toast notification system
│       ├── layout/
│       │   ├── AppLayout.jsx         shell wiring sidebar + topbar + routes
│       │   ├── Sidebar.jsx           collapsible nav, mobile drawer
│       │   └── Topbar.jsx            search, notifications, theme, profile
│       ├── pages/
│       │   ├── DashboardPage.jsx     KPI cards + quick-glance charts
│       │   ├── JobsPage.jsx          job card grid + create modal
│       │   ├── JobDetailPage.jsx     job info, upload, filtered candidates
│       │   ├── CandidatesPage.jsx    all candidates across every role
│       │   ├── AnalyticsPage.jsx     all 6 interactive charts
│       │   ├── ResumeAnalysisPage.jsx split-screen preview + recommendation
│       │   └── SettingsPage.jsx      theme toggle, app info
│       ├── components/               ScoreRing, KPICard, JobCard,
│       │                             CandidateCard, PipelineStepper,
│       │                             UploadDropzone, FilterBar, SkillChip,
│       │                             StatusBadge, EmptyState, Skeletons
│       └── styles/
│           ├── tokens.css            color system, light + dark theme
│           ├── base.css              typography, resets, buttons, chips, toasts
│           ├── layout.css            sidebar/topbar/shell
│           └── components.css        cards, pipeline, upload, charts, drawer
│
└── sample-resumes/              3 sample resumes for demoing the scorer
```

---

## 2. How to run it

You need Node.js 18+ installed. Two servers run side by side: the API
(port 5000) and the React dev server (port 5173, which proxies `/api`
requests to port 5000 — see `frontend/vite.config.js`).

**Terminal 1 — backend**
```bash
cd backend
npm install
npm start
# → ATS backend running at http://localhost:5000
```

**Terminal 2 — frontend**
```bash
cd frontend
npm install
npm run dev
# → open http://localhost:5173
```

Then in the app:
1. Go to **Jobs → + New role**, paste a job description, and submit.
2. Open the role and drag the files from `sample-resumes/` onto the upload
   dropzone — watch the per-file progress bars and toast notifications.
3. Browse the ranked candidate cards, filter by stage/score/search, click a
   card's sparkle icon for the full **Resume Analysis** page (split-screen
   preview, score breakdown, matched/missing skills, recommendation panel).
4. Check the **Dashboard** and **Analytics** pages for live KPIs and charts.
5. Toggle dark mode from the topbar or **Settings**.

---

## 3. The ATS workflow, step by step

### Step 1 — Post a job
`JobFormModal.jsx` → `POST /api/jobs`

You submit a title, company, department, location, and a full job
description. On the backend, `extractSkills()` (in `skillDictionary.js`)
scans that description against a ~35-entry dictionary of data/analyst
skills, and `extractRequiredYears()` pulls out a minimum years-of-experience
figure if one is stated. This is exactly what a real ATS does — it doesn't
read a job description like a person, it pattern-matches it against a
controlled vocabulary.

### Step 2 — Upload resumes
`UploadDropzone.jsx` → `POST /api/jobs/:jobId/candidates` (multipart, via
XHR for real upload-progress events)

Each uploaded file goes through `resumeParser.js`:
- `.pdf` → `pdf-parse` reads the embedded text layer
- `.docx` → `mammoth` reads the document XML
- `.txt` → read directly

### Step 3 — Score the resume
`scoringEngine.js` → `scoreResume(jobDescription, resumeText)`

The resume text is run through the same `extractSkills()` function used on
the job description, so both sides are compared on identical vocabulary.
The final score is a weighted blend of four independently-explainable
signals:

| Signal | Weight | What it measures |
|---|---|---|
| Skill match | 65% | % of the job's required skills found in the resume |
| Experience match | 20% | candidate's stated years vs. the job's stated minimum |
| Keyword density | 10% | how often the required skills actually appear |
| Resume completeness | 5% | could the ATS even extract an email and phone number? |

### Step 4 — Get a recommendation
`recommendationEngine.js`, attached to `GET /api/candidates/:id`

Turns the score breakdown into recruiter-friendly language: an overall
recommendation, an interview-probability estimate, strengths, weaknesses,
and a suggested next action. **This is a deterministic, rule-based engine,
not a live AI/LLM call** — the Resume Analysis page says so explicitly.
A commented stub in the same file shows how to swap in a real Anthropic API
call if you want genuinely AI-generated text instead.

### Step 5 — Review, filter, and rank
`JobDetailPage.jsx` / `CandidatesPage.jsx` → `GET /api/jobs/:jobId/candidates`
or `GET /api/candidates`

Candidates render as cards (avatar, score ring, matched/missing skill
chips, status), filterable by search text, pipeline stage, and a minimum
score slider.

### Step 6 — Move candidates through the pipeline
`CandidateCard.jsx` / `ResumeAnalysisPage.jsx` → `PATCH /api/candidates/:id/status`

Six stages, visualized as a horizontal stepper: **Applied → Screening →
Interview → Offer → Hired**, or **Rejected** as a branch at any point.

### Step 7 — Track it all on the dashboard
`DashboardPage.jsx` / `AnalyticsPage.jsx` → `GET /api/dashboard/summary`
and `GET /api/dashboard/analytics`

Every KPI and chart (score distribution, experience distribution, skills
frequency, hiring funnel, application timeline, job-wise candidate count)
is computed server-side from the same jobs/candidates data — nothing here
is mocked.

---

## 4. Design system

- **Palette:** indigo/violet primary (`--primary`), cyan accent
  (`--accent`), and a strict success/warning/danger triad used *only* for
  score bands and pipeline stages — color always carries meaning.
- **Light & dark mode:** full token set in `tokens.css`, toggled via
  `ThemeContext` and persisted to `localStorage`, respecting
  `prefers-color-scheme` on first load.
- **Glassmorphism:** the topbar and sidebar use a `.glass` utility
  (backdrop-blur + translucent surface).
- **Motion:** a shared animation vocabulary (`fadeIn`, `popIn`, `shimmer`,
  `ripple`, `bounce`) in `base.css`, plus a `requestAnimationFrame`
  count-up on every score ring and KPI number. All animation respects
  `prefers-reduced-motion`.
- **Typography:** Space Grotesk for headings/display, Inter for body,
  JetBrains Mono for scores and data.

---

## 5. Design decisions worth mentioning in an interview

- **Why a JSON file instead of a real database?** `db.js` is ~50 lines and
  anyone can read it in two minutes. Every route only ever calls
  `getAll` / `getById` / `insert` / `update` / `remove` — swapping in
  Postgres or MongoDB later is a one-file change, not a rewrite.
- **Why keyword/dictionary matching instead of an LLM for scoring?** This is
  genuinely how most production ATS platforms score resumes today
  (Workday, Greenhouse, Taleo) — deterministic, fast, and fully explainable
  to a candidate who asks "why didn't I get an interview?"
- **Why is the "AI Suggestions" panel rule-based, not a real LLM call?**
  Honesty over spectacle: a fake AI call that silently breaks without an
  API key is worse than a labeled, deterministic recommendation engine that
  always works. The upgrade path is documented in
  `recommendationEngine.js`.
- **Why server-side aggregation for the dashboard?** So the frontend never
  re-implements analytics logic, and a future real database swap only
  touches `routes/dashboard.js`.

---

## 6. Known limitations (good "future work" talking points)

- **Scanned/image-only PDFs** aren't supported — `pdf-parse` needs an actual
  text layer. Adding OCR (e.g. Tesseract.js) would fix this.
- **The skill dictionary is hand-curated**, not learned. A production
  version might use embeddings/semantic similarity instead.
- **Single-user, no auth.** Every visitor sees the same data.
- **JSON-file storage isn't safe for concurrent writes at scale** — fine for
  a portfolio demo, not for production traffic.
- **The recommendation panel is rule-based**, as noted above — a genuine
  "v2" would call an LLM with the resume + job description.
- **Non-PDF resumes** (.docx/.txt) show an extracted-text preview instead of
  a native rendered preview, since browsers can't render those formats
  inline.

---

## 7. Try it — a job description to copy/paste

```
Data Analyst — Analytics Team

We're looking for a Data Analyst with 2+ years of experience to join our
analytics team. You'll work with large datasets, build dashboards, and
communicate insights to stakeholders.

Requirements:
- Strong skills in Python, SQL, and Excel
- Experience with Power BI or Tableau for dashboard design
- Solid understanding of statistical analysis and data cleaning
- Familiarity with machine learning concepts (regression, classification)
- Comfortable with exploratory data analysis and data storytelling
- Git experience is a plus
```

Upload the three files in `sample-resumes/` against this job and you should
see them land at roughly 90–100 (strong match, all skills detected), 35–45
(partial match), and around 20–25 (weak match, 0 skills detected — the
non-zero score comes entirely from the experience and completeness
signals, which is a good illustration of why the score is a weighted blend
rather than a single number).

---

## 8. Deploying it publicly

The app is set up to deploy as **one service, one URL**: in production,
the Express backend serves the built React frontend directly (see the
static-file block near the bottom of `backend/server.js`), so there's no
separate frontend host or CORS configuration to worry about.

### Step 1 — Push to GitHub
```bash
cd ats-project
git init
git add .
git commit -m "Initial commit"
```
Create a new repository on [github.com/new](https://github.com/new), then:
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy on Render (free tier)
[Render](https://render.com) is a good fit for this project — it runs a
persistent Node server (unlike static-only hosts) and has a free tier.

1. Sign up at render.com and connect your GitHub account.
2. Click **New → Web Service**, and pick your repo.
3. Render should auto-detect `render.yaml` in the repo root and pre-fill
   everything. If it doesn't, set these manually:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** leave blank (repo root)
4. Click **Create Web Service**. The first build takes a few minutes —
   it installs both `backend` and `frontend` dependencies and builds the
   frontend, per the root `package.json`.
5. Once it's live, Render gives you a public URL like
   `https://signal-ats.onrender.com` — that's your shareable link.

### Alternative: Railway
[Railway](https://railway.app) works almost identically — connect the repo,
it detects the root `package.json`, and the same build/start commands apply.

### ⚠️ Important limitation: data doesn't persist
This project stores jobs/candidates in `backend/data/db.json` and resumes in
`backend/uploads/` — plain files on disk. Most free hosting tiers
(including Render's free plan) use an **ephemeral filesystem**: anything
written to disk is wiped whenever the service restarts, redeploys, or spins
down from inactivity. That means:
- Fine for a portfolio demo where you upload a few resumes to show it off
  live.
- Not fine for real, permanent data — anything uploaded will eventually
  disappear.

If you want the demo data to survive, the two real fixes are:
1. **Add a persistent disk** (Render's paid tier supports this — mount a
   disk at `backend/data` and `backend/uploads`), or
2. **Swap the JSON-file `db.js` for a real hosted database** (e.g. a free
   Postgres instance on Render/Railway/Supabase) — this is exactly the
   "future work" upgrade already called out in the Design Decisions section
   above, and a good thing to mention if this comes up in an interview.

For a resume/portfolio link, option 1 (free tier, data resets occasionally)
is completely fine — just re-upload the sample resumes if you're about to
share the link with someone.

