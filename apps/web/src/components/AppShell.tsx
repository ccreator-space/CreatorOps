import { CalendarDays, FileCheck2, RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "../features/auth/AuthProvider";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { viewer, users, setViewerId } = useAuth();
  const isAdmin = viewer.role === "admin";

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

        <div className="viewer-panel">
          <label htmlFor="viewer-select">Mock login</label>
          <select
            id="viewer-select"
            value={viewer.id}
            onChange={(event) => setViewerId(event.target.value)}
          >
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.role})
              </option>
            ))}
          </select>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
