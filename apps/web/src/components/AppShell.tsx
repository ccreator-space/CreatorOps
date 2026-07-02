import { CalendarDays, ClipboardList, FileCheck2, LogOut, Route, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthProvider";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type AppView = "calendar" | "contents" | "revisions" | "submissions" | "series-assignments";

type AppShellProps = {
  children: ReactNode;
  currentView: AppView;
};

type PostsCountResponse = {
  data: unknown[];
};

export function AppShell({ children, currentView }: AppShellProps) {
  const { authHeaders, viewer, logout } = useAuth();
  const navigate = useNavigate();
  const [revisionCount, setRevisionCount] = useState(0);

  useEffect(() => {
    if (!viewer || viewer.role === "admin") {
      setRevisionCount(0);
      return;
    }

    let isCurrent = true;

    async function loadRevisionCount() {
      try {
        const response = await fetch(`${apiUrl}/posts?status=revision_requested`, {
          headers: authHeaders()
        });

        if (!response.ok) {
          throw new Error("Revision count could not be loaded");
        }

        const payload = (await response.json()) as PostsCountResponse;

        if (isCurrent) {
          setRevisionCount(payload.data.length);
        }
      } catch {
        if (isCurrent) {
          setRevisionCount(0);
        }
      }
    }

    void loadRevisionCount();

    return () => {
      isCurrent = false;
    };
  }, [viewer?.id, viewer?.role]);

  if (!viewer) {
    return null;
  }

  const isAdmin = viewer.role === "admin";
  const handleLogout = () => {
    logout();
    navigate("/login", {
      replace: true
    });
  };

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Ana navigasyon">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>Shipin</span>
        </div>

        <nav className="nav-list">
          <NavLink className={`nav-link ${currentView === "calendar" ? "is-active" : ""}`} to="/calendar">
            <CalendarDays size={18} />
            Takvim
          </NavLink>
          <NavLink
            className={`nav-link ${currentView === "contents" ? "is-active" : ""}`}
            to="/contents"
          >
            <FileCheck2 size={18} />
            İçerikler
          </NavLink>
          {!isAdmin ? (
            <NavLink
              className={`nav-link ${currentView === "revisions" ? "is-active" : ""}`}
              to="/revisions"
            >
              <RotateCcw size={18} />
              <span>Revizeler</span>
              {revisionCount > 0 ? <span className="nav-badge">{revisionCount}</span> : null}
            </NavLink>
          ) : null}
          <NavLink
            className={`nav-link ${currentView === "submissions" ? "is-active" : ""}`}
            to="/submissions"
          >
            <ClipboardList size={18} />
            Başvurular
          </NavLink>
          {isAdmin ? (
            <NavLink
              className={`nav-link ${currentView === "series-assignments" ? "is-active" : ""}`}
              to="/series-assignments"
            >
              <Route size={18} />
              Seri Atamaları
            </NavLink>
          ) : null}
        </nav>

        <div className="viewer-panel">
          <div>
            <strong>{viewer.name}</strong>
            <p>{viewer.email}</p>
          </div>
          <button className="secondary-button is-full" type="button" onClick={handleLogout}>
            <LogOut size={16} />
            Çıkış yap
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
