import React from "react";
import { Search } from "lucide-react";

const STATUSES = ["All", "Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

export default function FilterBar({ query, onQueryChange, statusFilter, onStatusChange, minScore, onMinScoreChange, counts }) {
  return (
    <div className="filter-bar">
      <div className="input filter-bar__search" style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Search size={14} color="var(--ink-faint)" />
        <input
          style={{ border: "none", outline: "none", background: "transparent", width: "100%" }}
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
        />
      </div>

      <div className="filter-pill-group">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`filter-pill ${statusFilter === s ? "filter-pill--active" : ""}`}
            onClick={() => onStatusChange(s)}
          >
            {s}
            {s !== "All" && counts && <span className="filter-pill__count">{counts[s] || 0}</span>}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--ink-soft)" }}>
        <label htmlFor="minScore">Min score</label>
        <input
          id="minScore"
          type="range"
          min={0}
          max={100}
          step={5}
          value={minScore}
          onChange={(e) => onMinScoreChange(Number(e.target.value))}
        />
        <span className="mono" style={{ width: 28 }}>{minScore}</span>
      </div>
    </div>
  );
}
