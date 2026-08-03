import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { BarChart3 } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import { api } from "../api.js";

const PIE_COLORS = ["#4f46e5", "#06b6d4", "#16a34a", "#d97706", "#dc2626", "#7c3aed"];

const tooltipStyle = { background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10, fontSize: 12 };
const axisTick = { fontSize: 11, fill: "var(--ink-faint)" };

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card section-card animate-in">
      <div className="section-card__header" style={{ flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
        <h3 className="text-card-title">{title}</h3>
        {subtitle && <p className="text-body" style={{ margin: 0 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAnalytics().then(setData).finally(() => setLoading(false));
  }, []);

  const hasData = data && data.scoreDistribution.some((d) => d.count > 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Analytics</h1>
          <p className="page-header__subtitle">Every chart here is computed live from your jobs and candidates.</p>
        </div>
      </div>

      {loading && <p className="text-body">Loading analytics…</p>}

      {!loading && !hasData && (
        <div className="card">
          <EmptyState icon={BarChart3} title="Nothing to chart yet" hint="Upload some resumes to a role and the charts here will populate automatically." />
        </div>
      )}

      {!loading && hasData && (
        <div className="chart-grid">
          <ChartCard title="ATS score distribution" subtitle="How candidates spread across score bands">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.scoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="band" tick={{ ...axisTick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Candidate experience distribution" subtitle="Years of experience across applicants">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={data.experienceDistribution} dataKey="count" nameKey="label" innerRadius={50} outerRadius={85} paddingAngle={3} animationDuration={900}>
                  {data.experienceDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Top skills frequency" subtitle="Most common matched skills across all resumes">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.skillsFrequency} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" horizontal={false} />
                <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="skill" tick={{ ...axisTick, fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--accent)" radius={[0, 6, 6, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Hiring funnel" subtitle="Candidates who reached each pipeline stage or further">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.hiringFunnel}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="stage" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--success)" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Application timeline" subtitle="Resumes uploaded per day">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.applicationTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="date" tick={{ ...axisTick, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3 }} animationDuration={900} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Job-wise candidate count" subtitle="Applicant volume per open role">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.jobWiseCandidateCount}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
                <XAxis dataKey="job" tick={{ ...axisTick, fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="var(--warning)" radius={[6, 6, 0, 0]} animationDuration={900} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
