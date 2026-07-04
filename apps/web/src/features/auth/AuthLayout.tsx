import { type ReactNode } from "react";
import { CreatorCredit } from "../../components/CreatorCredit";
import { useAppSettings } from "../settings/AppSettingsProvider";

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  const { logoSrc } = useAppSettings();

  return (
    <main className="auth-layout">
      <section className="auth-form-pane">{children}</section>
      <aside className="auth-visual-pane" aria-label="Workspace brand">
        <div className="auth-visual-grid">
          <div className="auth-logo-mark">
            <img src={logoSrc} alt="Site logo" />
          </div>
        </div>
      </aside>
      <CreatorCredit />
    </main>
  );
}
