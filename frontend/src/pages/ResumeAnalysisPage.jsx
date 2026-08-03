import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Phone, FileText, TrendingUp, Download } from "lucide-react";
import ScoreRing from "../components/ScoreRing.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import PipelineStepper from "../components/PipelineStepper.jsx";
import SkillChip from "../components/SkillChip.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";

const BREAKDOWN_LABELS = {
  skillMatch: "Skill match",
  experienceMatch: "Experience match",
  keywordDensity: "Keyword match",
  completeness: "Resume completeness",
};

export default function ResumeAnalysisPage() {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getCandidate(candidateId)
      .then((c) => {
        setCandidate(c);
        requestAnimationFrame(() => setTimeout(() => setBarsVisible(true), 80));
      })
      .catch(() => toast.error("Could not load this candidate."))
      .finally(() => setLoading(false));
  }, [candidateId]);

  async function handleStatusChange(status) {
    const previous = candidate.status;
    setCandidate((prev) => ({ ...prev, status }));
    try {
      await api.updateStatus(candidateId, status);
      toast.success(`Moved to ${status}.`);
    } catch (err) {
      setCandidate((prev) => ({ ...prev, status: previous }));
      toast.error(err.message || "Couldn't update status.");
    }
  }

  if (loading) return <p className="text-body">Loading resume analysis…</p>;
  if (!candidate) return <EmptyState title="Candidate not found" hint="They may have been removed." />;

  const isPdf = candidate.fileName?.toLowerCase().endsWith(".pdf");
  const { recommendation } = candidate;

  return (
    <div>
      <button className="btn btn--ghost btn--sm" onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div className="card section-card animate-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <ScoreRing score={candidate.overallScore} size={64} strokeWidth={6} />
          <div>
            <h1 className="page-header__title" style={{ fontSize: 20 }}>{candidate.name}</h1>
            <div style={{ display: "flex", gap: 14, marginTop: 4, fontSize: 12.5, color: "var(--ink-soft)" }}>
              <span><Mail size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{candidate.email || "No email"}</span>
              <span><Phone size={12} style={{ verticalAlign: -1, marginRight: 4 }} />{candidate.phone || "No phone"}</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusBadge status={candidate.status} />
          <a className="btn btn--ghost btn--sm" href={api.fileUrl(candidate.id)} target="_blank" rel="noreferrer">
            <Download size={14} /> Download resume
          </a>
        </div>
      </div>

      <div className="card section-card animate-in">
        <PipelineStepper status={candidate.status} />
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          {["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"].map((s) => (
            <button
              key={s}
              className={`btn btn--sm ${candidate.status === s ? "btn--primary" : "btn--ghost"}`}
              onClick={() => handleStatusChange(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="analysis-grid">
        {/* Left: resume preview */}
        <div className="resume-preview animate-in">
          {isPdf ? (
            <iframe src={api.fileUrl(candidate.id)} title="Resume preview" />
          ) : (
            <div className="resume-preview__fallback">
              <p className="text-label" style={{ marginBottom: 10 }}>
                <FileText size={13} style={{ verticalAlign: -2, marginRight: 6 }} />
                {candidate.fileName} (preview shown as extracted text)
              </p>
              {candidate.resumeText}
            </div>
          )}
        </div>

        {/* Right: breakdown, skills, recommendation */}
        <div className="animate-in">
          <div className="card section-card">
            <h3 className="text-card-title" style={{ marginBottom: 14 }}>Score breakdown</h3>
            {Object.entries(candidate.breakdown).map(([key, value]) => (
              <div className="breakdown-bar" key={key}>
                <div className="breakdown-bar__label">
                  <span>{BREAKDOWN_LABELS[key]}</span>
                  <span className="mono">{value}</span>
                </div>
                <div className="breakdown-bar__track">
                  <div className="breakdown-bar__fill" style={{ width: barsVisible ? `${value}%` : "0%" }} />
                </div>
              </div>
            ))}
          </div>

          <div className="card section-card">
            <h3 className="text-card-title" style={{ marginBottom: 10 }}>Matched skills ({candidate.matchedSkills.length})</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {candidate.matchedSkills.length === 0 && <p className="text-body">No required skills detected.</p>}
              {candidate.matchedSkills.map((s) => <SkillChip key={s} label={s} variant="matched" />)}
            </div>
            <h3 className="text-card-title" style={{ marginBottom: 10 }}>Missing skills ({candidate.missingSkills.length})</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {candidate.missingSkills.length === 0 && <p className="text-body">Every detected requirement is covered.</p>}
              {candidate.missingSkills.map((s) => <SkillChip key={s} label={s} variant="missing" />)}
            </div>
          </div>

          {recommendation && (
            <div className="recommendation-card animate-in">
              <p className="text-label" style={{ color: "var(--primary)" }}>Recruiter recommendation</p>
              <p className="recommendation-card__title">{recommendation.overallRecommendation}</p>

              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0" }}>
                <TrendingUp size={16} color="var(--primary)" />
                <span className="recommendation-card__probability">{recommendation.interviewProbability}%</span>
                <span className="text-body" style={{ margin: 0 }}>interview probability</span>
              </div>

              <p className="text-label" style={{ marginTop: 12 }}>Strengths</p>
              <ul className="recommendation-list">
                {recommendation.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>

              <p className="text-label" style={{ marginTop: 12 }}>Weaknesses</p>
              <ul className="recommendation-list">
                {recommendation.weaknesses.map((s, i) => <li key={i}>{s}</li>)}
              </ul>

              <p className="text-label" style={{ marginTop: 12 }}>Suggested action</p>
              <p className="text-body" style={{ fontWeight: 600, color: "var(--ink)" }}>{recommendation.recruiterAction}</p>

              <p className="text-body" style={{ marginTop: 14, fontSize: 11, fontStyle: "italic" }}>
                Generated by a rule-based recommendation engine from the score breakdown above — not a live AI call.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
