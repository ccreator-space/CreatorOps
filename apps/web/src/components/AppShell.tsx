import { CalendarDays, FileCheck2, RotateCcw } from "lucide-react";
import { currentViewer } from "../lib/mock-data";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const isAdmin = currentViewer.role === "admin";

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Ana navigasyon">
        <div className="brand">
          <span className="brand-mark">S</span>
          <span>Shipin</span>
        </div>

        <nav className="nav-list">
          <a className="nav-link is-active" href="#calendar">
            <CalendarDays size={18} />
            Takvim
          </a>
          {isAdmin ? (
            <a className="nav-link" href="#contents">
              <FileCheck2 size={18} />
              İçerikler
            </a>
          ) : (
            <a className="nav-link" href="#revisions">
              <RotateCcw size={18} />
              Revizeler
            </a>
          )}
        </nav>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

