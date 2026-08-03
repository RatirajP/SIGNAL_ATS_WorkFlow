import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useToast } from "../contexts/ToastContext.jsx";

export default function JobFormModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ title: "", company: "", department: "", location: "", description: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onCreate(form);
      onClose();
    } catch (err) {
      const message =
        err.message === "Failed to fetch"
          ? "Couldn't reach the backend server. Make sure it's running (npm start in the backend folder) on http://localhost:5000."
          : err.message || "Something went wrong creating this role.";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="drawer-overlay" style={{ alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div
        className="card animate-in-scale"
        style={{ width: 560, maxWidth: "92vw", maxHeight: "88vh", overflowY: "auto", padding: 28, position: "relative" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn btn--icon" style={{ position: "absolute", top: 16, right: 16 }} onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <h3 className="text-section-title" style={{ marginBottom: 4 }}>Post a new role</h3>
        <p className="text-body" style={{ marginBottom: 20 }}>
          Required skills and years of experience are detected automatically from the description.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div
              className="banner banner--error"
              style={{ display: "flex", alignItems: "flex-start", gap: 8, margin: 0 }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}
          <div className="field">
            <label>Role title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Data Analyst" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label>Company</label>
              <input className="input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Your Company" />
            </div>
            <div className="field">
              <label>Department</label>
              <input className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Analytics" />
            </div>
          </div>
          <div className="field">
            <label>Location</label>
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Remote" />
          </div>
          <div className="field">
            <label>Job description</label>
            <textarea
              className="input"
              rows={7}
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Paste the full job description here…"
            />
          </div>
          <button className="btn btn--primary btn--block" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create role"}
          </button>
        </form>
      </div>
    </div>
  );
}
