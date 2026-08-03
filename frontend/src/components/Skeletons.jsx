import React from "react";

export function SkeletonKPIGrid({ count = 6 }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card kpi-card" key={i}>
          <div className="skeleton" style={{ width: 42, height: 42, borderRadius: 14 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: "60%", height: 18, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: "80%", height: 11 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonCardGrid({ count = 6 }) {
  return (
    <div className="job-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="card" key={i} style={{ padding: 20 }}>
          <div className="skeleton" style={{ width: "70%", height: 18, marginBottom: 10 }} />
          <div className="skeleton" style={{ width: "40%", height: 12, marginBottom: 18 }} />
          <div className="skeleton" style={{ width: "100%", height: 12, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: "90%", height: 12 }} />
        </div>
      ))}
    </div>
  );
}
