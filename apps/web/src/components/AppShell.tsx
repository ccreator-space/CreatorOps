import { CalendarDays, FileCheck2, LogOut, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../features/auth/AuthProvider";

type AppShellProps = {
  children: ReactNode;
  currentView: "calendar" | "contents" | "revisions";
};

export function AppShell({ children, currentView }: AppShellProps) {
  const { viewer, logout } = useAuth();

  if (!viewer) {
    return null;
  }

  const isAdmin = viewer.role === "admin";

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Ana navigasyon">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>Shipin</span>
        </div>

        <nav className="nav-list">
          <a className={`nav-link ${currentView === "calendar" ? "is-active" : ""}`} href="#calendar">
            <CalendarDays size={18} />
            Takvim
          </a>
          {isAdmin ? (
            <a
              className={`nav-link ${currentView === "contents" ? "is-active" : ""}`}
              href="#contents"
            >
              <FileCheck2 size={18} />
              İçerikler
            </a>
          ) : (
            <a
              className={`nav-link ${currentView === "revisions" ? "is-active" : ""}`}
              href="#revisions"
            >
              <RotateCcw size={18} />
              Revizeler
            </a>
          )}
        </nav>

        <div className="viewer-panel">
          <div>
            <strong>{viewer.name}</strong>
            <p>{viewer.email}</p>
          </div>
          <button className="secondary-button is-full" type="button" onClick={logout}>
            <LogOut size={16} />
            Çıkış yap
          </button>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
