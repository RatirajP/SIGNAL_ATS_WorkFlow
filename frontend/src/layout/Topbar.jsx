import React, { useState } from "react";
import { Search, Bell, Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function Topbar({ onOpenMobileSidebar, searchValue, onSearchChange, title }) {
  const { theme, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="topbar glass">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button className="icon-toggle mobile-menu-btn" onClick={onOpenMobileSidebar} aria-label="Open menu">
          <Menu size={18} />
        </button>
        <h2 className="text-section-title" style={{ display: "none" }}>{title}</h2>
        <div className="topbar__search">
          <Search size={15} />
          <input
            placeholder="Search jobs, candidates…"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            aria-label="Search"
          />
        </div>
      </div>

      <div className="topbar__actions">
        <button
          className="icon-toggle"
          onClick={toggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title="Toggle theme"
        >
          {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
        </button>

        <div style={{ position: "relative" }}>
          <button
            className="icon-toggle"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell size={17} />
            <span className="icon-toggle__dot" />
          </button>
          {notifOpen && (
            <div className="card animate-in-scale" style={{ position: "absolute", right: 0, top: 46, width: 260, padding: 14, zIndex: 30 }}>
              <p className="text-label" style={{ marginBottom: 8 }}>Recent activity</p>
              <p className="text-body">Notifications appear here as candidates are scored and moved through the pipeline.</p>
            </div>
          )}
        </div>

        <button className="profile-pill" aria-label="User profile">
          <span className="profile-pill__avatar">RC</span>
          <span className="profile-pill__name">Recruiter</span>
        </button>
      </div>
    </header>
  );
}
