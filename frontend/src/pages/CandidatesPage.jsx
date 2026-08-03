import React, { useEffect, useMemo, useState } from "react";
import { Users } from "lucide-react";
import CandidateCard from "../components/CandidateCard.jsx";
import FilterBar from "../components/FilterBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { SkeletonCardGrid } from "../components/Skeletons.jsx";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [minScore, setMinScore] = useState(0);
  const toast = useToast();

  function refresh() {
    setLoading(true);
    api.listAllCandidates().then(setCandidates).finally(() => setLoading(false));
  }

  useEffect(refresh, []);

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
    const q = query.toLowerCase();
    const matchesQuery =
      q.trim() === "" ||
      c.name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      c.jobTitle.toLowerCase().includes(q);
    const matchesScore = c.overallScore >= minScore;
    return matchesStatus && matchesQuery && matchesScore;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Candidates</h1>
          <p className="page-header__subtitle">{candidates.length} candidate{candidates.length === 1 ? "" : "s"} across every open role</p>
        </div>
      </div>

      {loading && <SkeletonCardGrid count={6} />}

      {!loading && (
        <>
          <FilterBar
            query={query}
            onQueryChange={setQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            minScore={minScore}
            onMinScoreChange={setMinScore}
            counts={counts}
          />

          {filtered.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={Users}
                title={candidates.length === 0 ? "No candidates yet" : "No matches"}
                hint={candidates.length === 0 ? "Upload resumes to a role to see candidates here." : "Try adjusting your filters or search."}
              />
            </div>
          ) : (
            <div className="candidate-grid">
              {filtered.map((c, i) => (
                <CandidateCard key={c.id} candidate={c} onStatusChange={handleStatusChange} onDelete={handleDelete} showJobTitle delay={i * 30} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
