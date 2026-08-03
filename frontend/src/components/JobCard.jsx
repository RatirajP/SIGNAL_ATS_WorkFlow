import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Users, X } from "lucide-react";

export default function JobCard({ job, onDelete, delay = 0 }) {
  const navigate = useNavigate();

  return (
    <div
      className="card card--interactive job-card animate-in-scale"
      style={{ animationDelay: `${delay}ms` }}
      onClick={() => navigate(`/jobs/${job.id}`)}
    >
      <div className="job-card__top">
        <div>
          <p className="job-card__title text-card-title">{job.title}</p>
          <p className="job-card__company">{job.company} · {job.department}</p>
        </div>
        <button
          className="job-card__delete"
          title="Delete role"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${job.title}" and all its candidates?`)) onDelete(job.id);
          }}
        >
          <X size={15} />
        </button>
      </div>

      <div className="job-card__meta-row">
        <span className="job-card__meta-item"><MapPin size={13} /> {job.location}</span>
        {job.requiredYears > 0 && (
          <span className="job-card__meta-item"><Clock size={13} /> {job.requiredYears}+ yrs</span>
        )}
        <span className={`status-badge status-badge--${job.status === "Open" ? "hired" : "rejected"}`}>
          {job.status}
        </span>
      </div>

      <div className="job-card__skills">
        {job.requiredSkills.slice(0, 4).map((s) => (
          <span className="chip chip--neutral" key={s}>{s}</span>
        ))}
        {job.requiredSkills.length > 4 && (
          <span className="chip chip--neutral">+{job.requiredSkills.length - 4} more</span>
        )}
      </div>

      <div className="job-card__footer">
        <span className="job-card__applicants">
          <Users size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
          {job.applicantCount} applicant{job.applicantCount === 1 ? "" : "s"}
        </span>
        <span className="job-card__date">{new Date(job.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
