import React from "react";
import { useNavigate } from "react-router-dom";
import { Eye, Sparkles, Trash2, Briefcase } from "lucide-react";
import ScoreRing from "./ScoreRing.jsx";
import StatusBadge from "./StatusBadge.jsx";
import SkillChip from "./SkillChip.jsx";
import { api } from "../api.js";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function CandidateCard({ candidate, onStatusChange, onDelete, showJobTitle = false, delay = 0 }) {
  const navigate = useNavigate();
  const STATUSES = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

  return (
    <div className="card card--interactive candidate-card animate-in-scale" style={{ animationDelay: `${delay}ms` }}>
      <div className="candidate-card__head">
        <div className="candidate-avatar">{initials(candidate.name)}</div>
        <div style={{ minWidth: 0 }}>
          <p className="candidate-card__name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {candidate.name}
          </p>
          <p className="candidate-card__email" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {candidate.email || "No email detected"}
          </p>
          {showJobTitle && (
            <p className="candidate-card__email" style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Briefcase size={11} /> {candidate.jobTitle}
            </p>
          )}
        </div>
        <div className="candidate-card__ring">
          <ScoreRing score={candidate.overallScore} size={52} strokeWidth={5} />
        </div>
      </div>

      <div className="candidate-card__meta">
        <span>{candidate.candidateYears} yrs experience</span>
        <span>{candidate.matchedSkills.length} skills matched</span>
      </div>

      <div className="candidate-card__skills">
        {candidate.matchedSkills.slice(0, 4).map((s) => (
          <SkillChip key={s} label={s} variant="matched" />
        ))}
        {candidate.missingSkills.slice(0, 2).map((s) => (
          <SkillChip key={s} label={s} variant="missing" />
        ))}
      </div>

      <div className="candidate-card__footer">
        <StatusBadge status={candidate.status} />
        <div className="candidate-card__buttons">
          <a
            className="btn btn--icon"
            href={api.fileUrl(candidate.id)}
            target="_blank"
            rel="noreferrer"
            title="View resume"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye size={14} />
          </a>
          <button
            className="btn btn--icon"
            title="Resume analysis"
            onClick={() => navigate(`/candidates/${candidate.id}`)}
          >
            <Sparkles size={14} />
          </button>
          <button
            className="btn btn--icon"
            title="Remove candidate"
            onClick={() => {
              if (confirm(`Remove ${candidate.name} from this role?`)) onDelete(candidate.id);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <select
        className={`input status-select`}
        value={candidate.status}
        onChange={(e) => onStatusChange(candidate.id, e.target.value)}
        style={{ marginTop: 4 }}
        onClick={(e) => e.stopPropagation()}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>Move to: {s}</option>
        ))}
      </select>
    </div>
  );
}
