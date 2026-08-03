import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Briefcase } from "lucide-react";
import JobCard from "../components/JobCard.jsx";
import JobFormModal from "../components/JobFormModal.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { SkeletonCardGrid } from "../components/Skeletons.jsx";
import { api } from "../api.js";
import { useToast } from "../contexts/ToastContext.jsx";

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { globalSearch } = useOutletContext();
  const toast = useToast();

  function refresh() {
    setLoading(true);
    api.listJobs().then(setJobs).finally(() => setLoading(false));
  }

  useEffect(refresh, []);

  async function handleCreate(form) {
    const job = await api.createJob(form);
    setJobs((prev) => [{ ...job, applicantCount: 0, averageScore: 0 }, ...prev]);
    toast.success(`"${job.title}" role created — ${job.requiredSkills.length} skills detected.`);
  }

  async function handleDelete(id) {
    try {
      await api.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.info("Role deleted.");
    } catch (err) {
      toast.error(err.message || "Couldn't delete this role.");
    }
  }

  const filtered = jobs.filter((j) =>
    (j.title + j.company + j.department).toLowerCase().includes((globalSearch || "").toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Jobs</h1>
          <p className="page-header__subtitle">{jobs.length} open role{jobs.length === 1 ? "" : "s"}</p>
        </div>
        <button className="btn btn--primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> New role
        </button>
      </div>

      {loading && <SkeletonCardGrid count={6} />}

      {!loading && filtered.length === 0 && (
        <div className="card">
          <EmptyState
            icon={Briefcase}
            title={jobs.length === 0 ? "No jobs found" : "No matching roles"}
            hint={jobs.length === 0 ? "Post your first role to start screening resumes." : "Try a different search term."}
            action={
              jobs.length === 0 && (
                <button className="btn btn--primary btn--sm" style={{ marginTop: 12 }} onClick={() => setShowForm(true)}>
                  <Plus size={14} /> New role
                </button>
              )
            }
          />
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="job-grid">
          {filtered.map((job, i) => (
            <JobCard key={job.id} job={job} onDelete={handleDelete} delay={i * 40} />
          ))}
        </div>
      )}

      {showForm && <JobFormModal onClose={() => setShowForm(false)} onCreate={handleCreate} />}
    </div>
  );
}
