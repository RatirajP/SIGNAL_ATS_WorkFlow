import React from "react";
import { Routes, Route } from "react-router-dom";
import AppLayout from "./layout/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import JobsPage from "./pages/JobsPage.jsx";
import JobDetailPage from "./pages/JobDetailPage.jsx";
import CandidatesPage from "./pages/CandidatesPage.jsx";
import AnalyticsPage from "./pages/AnalyticsPage.jsx";
import ResumeAnalysisPage from "./pages/ResumeAnalysisPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:jobId" element={<JobDetailPage />} />
        <Route path="candidates" element={<CandidatesPage />} />
        <Route path="candidates/:candidateId" element={<ResumeAnalysisPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
