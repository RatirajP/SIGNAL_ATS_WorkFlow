import React from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { Moon, Sun, Info } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Settings</h1>
          <p className="page-header__subtitle">Appearance and application info.</p>
        </div>
      </div>

      <div className="card section-card animate-in" style={{ maxWidth: 560 }}>
        <h3 className="text-card-title" style={{ marginBottom: 4 }}>Appearance</h3>
        <div className="settings-row">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {theme === "light" ? <Sun size={17} color="var(--warning)" /> : <Moon size={17} color="var(--primary)" />}
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 13.5 }}>Theme</p>
              <p className="text-body" style={{ margin: 0 }}>
                {theme === "light" ? "Light mode" : "Dark mode"}
              </p>
            </div>
          </div>
          <button
            className={`theme-toggle-switch ${theme === "dark" ? "theme-toggle-switch--dark" : ""}`}
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Toggle dark mode"
          >
            <span className="theme-toggle-switch__knob" />
          </button>
        </div>
      </div>

      <div className="card section-card animate-in" style={{ maxWidth: 560 }}>
        <h3 className="text-card-title" style={{ marginBottom: 10 }}>
          <Info size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          About Signal
        </h3>
        <p className="text-body">
          Signal is a portfolio ATS workflow: post a role, upload resumes, and get an
          explainable match score for every candidate — skill match, experience match,
          keyword density, and resume completeness, blended into one ranked score.
        </p>
        <p className="text-body" style={{ marginTop: 8 }}>
          Data is stored locally on this server in a JSON file, so it resets if the
          backend's <code>data/db.json</code> is cleared.
        </p>
      </div>
    </div>
  );
}
