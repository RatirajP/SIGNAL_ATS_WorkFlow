import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Users, Gauge, PhoneCall, Trophy, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import KPICard from "../components/KPICard.jsx";
import { SkeletonKPIGrid } from "../components/Skeletons.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { api } from "../api.js";

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getSummary(), api.getAnalytics()])
      .then(([s, a]) => {
        setSummary(s);
        setAnalytics(a);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Recruiter Dashboard</h1>
          <p className="page-header__subtitle">A live snapshot of every role and candidate in the system.</p>
        </div>
        <Link to="/jobs" className="btn btn--primary">
          <Briefcase size={15} /> Manage roles
        </Link>
      </div>

      {loading && <SkeletonKPIGrid count={6} />}

      {!loading && summary && (
        <div className="kpi-grid">
          <KPICard icon={Briefcase} label="Total jobs" value={summary.totalJobs} accent="primary" delay={0} />
          <KPICard icon={Users} label="Total candidates" value={summary.totalCandidates} accent="accent" delay={40} />
          <KPICard icon={Gauge} label="Average ATS score" value={summary.averageScore} suffix="" accent="success" delay={80} />
          <KPICard icon={PhoneCall} label="Interview rate" value={summary.interviewRate} suffix="%" accent="warning" delay={120} />
          <KPICard icon={Trophy} label="Offer rate" value={summary.offerRate} suffix="%" accent="success" delay={160} />
          <KPICard icon={Activity} label="Active recruitments" value={summary.activeRecruitments} accent="primary" delay={200} />
        </div>
      )}

      {!loading && summary && summary.totalCandidates === 0 && (
        <div className="card animate-in">
          <EmptyState
            icon={Users}
            title="No candidates yet"
            hint="Create a role and upload resumes to start seeing live scoring data here."
            action={
              <Link to="/jobs" className="btn btn--primary btn--sm" style={{ marginTop: 12 }}>
                Go to Jobs
              </Link>
            }
          />
        </div>
      )}

      {!loading && analytics && summary?.totalCandidates > 0 && (
        <div className="chart-grid">
          <div className="card section-card animate-in">
            <div className="section-card__header">
              <h3 className="text-card-title">Hiring funnel</h3>
              <Link to="/analytics" className="link-btn text-label" style={{ color: "var(--primary)" }}>
                Full analytics →
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.hiringFunnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="stage" tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card section-card animate-in">
            <div className="section-card__header">
              <h3 className="text-card-title">ATS score distribution</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="band" tick={{ fontSize: 10, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--ink-faint)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 }} />
                <Bar dataKey="count" fill="var(--accent)" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
