import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Building2, Users } from "lucide-react";
import UploadDropzone from "../components/UploadDropzone.jsx";
import CandidateCard from "../components/CandidateCard.jsx";
import FilterBar from "../components/FilterBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { SkeletonCardGrid } from "../components/Skeletons.jsx";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [minScore, setMinScore] = useState(0);

  function refresh() {
    setLoading(true);
    Promise.all([api.getJob(jobId), api.listCandidates(jobId)])
      .then(([j, c]) => {
        setJob(j);
        setCandidates(c);
      })
      .catch(() => toast.error("Could not load this role."))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [jobId]);

  async function handleStatusChange(candidateId, status) {
    const previous = candidates;
    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, status } : c)));
    try {
      await api.updateStatus(candidateId, status);
      toast.success(`Candidate moved to ${status}.`);
    } catch (err) {
      setCandidates(previous);
      toast.error(err.message || "Couldn't update candidate status.");
    }
  }

  async function handleDelete(candidateId) {
    try {
      await api.deleteCandidate(candidateId);
      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      toast.info("Candidate removed.");
    } catch (err) {
      toast.error(err.message || "Couldn't remove this candidate.");
    }
  }

  const counts = useMemo(() => {
    const c = {};
    candidates.forEach((cand) => (c[cand.status] = (c[cand.status] || 0) + 1));
    return c;
  }, [candidates]);

  const filtered = candidates.filter((c) => {
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;
    const matchesQuery =
      query.trim() === "" ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(query.toLowerCase());
    const matchesScore = c.overallScore >= minScore;
    return matchesStatus && matchesQuery && matchesScore;
  });

  if (loading) {
    return <SkeletonCardGrid count={4} />;
  }

  if (!job) {
    return <EmptyState title="Role not found" hint="It may have been deleted." />;
  }

  return (
    <div>
      <button className="btn btn--ghost btn--sm" onClick={() => navigate("/jobs")} style={{ marginBottom: 16 }}>
        <ArrowLeft size={14} /> All roles
      </button>

      <div className="card section-card animate-in">
        <div className="job-card__top">
          <div>
            <h1 className="page-header__title">{job.title}</h1>
            <p className="job-card__company" style={{ marginTop: 4 }}>
              <Building2 size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
              {job.company} · {job.department}
            </p>
          </div>
        </div>

        <div className="job-card__meta-row" style={{ marginTop: 12 }}>
          <span className="job-card__meta-item"><MapPin size={13} /> {job.location}</span>
          {job.requiredYears > 0 && <span className="job-card__meta-item"><Clock size={13} /> {job.requiredYears}+ yrs required</span>}
          <span className="job-card__meta-item"><Users size={13} /> {candidates.length} applicant{candidates.length === 1 ? "" : "s"}</span>
          <span className={`status-badge status-badge--${job.status === "Open" ? "hired" : "rejected"}`}>{job.status}</span>
        </div>

        <p
          className="text-body"
          style={{
            margin: "16px 0 4px",
            whiteSpace: "pre-wrap",
            ...(descExpanded ? {} : { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }),
          }}
        >
          {job.description}
        </p>
        <button className="link-btn" style={{ color: "var(--primary)" }} onClick={() => setDescExpanded((e) => !e)}>
          {descExpanded ? "Show less" : "Show full description"}
        </button>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16, alignItems: "center" }}>
          <span className="text-label">Detected requirements:</span>
          {job.requiredSkills.map((s) => (
            <span className="chip chip--neutral" key={s}>{s}</span>
          ))}
        </div>
      </div>

      <UploadDropzone jobId={job.id} onUploaded={refresh} />

      <FilterBar
        query={query}
        onQueryChange={setQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        minScore={minScore}
        onMinScoreChange={setMinScore}
        counts={counts}
      />

      {filtered.length === 0 && (
        <div className="card">
          <EmptyState
            icon={Users}
            title={candidates.length === 0 ? "No candidates yet" : "No matches"}
            hint={candidates.length === 0 ? "Upload resumes above to see them scored and ranked here." : "Try adjusting your filters."}
          />
        </div>
      )}

      {filtered.length > 0 && (
        <div className="candidate-grid">
          {filtered.map((c, i) => (
            <CandidateCard key={c.id} candidate={c} onStatusChange={handleStatusChange} onDelete={handleDelete} delay={i * 30} />
          ))}
        </div>
      )}
    </div>
  );
}
