import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { AuthProvider } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { CalendarPage } from "./features/calendar/CalendarPage";
import { ContentListPage } from "./features/content/ContentListPage";
import { useAuth } from "./features/auth/AuthProvider";
import { RevisionsPage } from "./features/revisions/RevisionsPage";

type AppView = "calendar" | "contents" | "revisions";

function getHashView(): AppView {
  const hash = window.location.hash.replace("#", "");

  if (hash === "contents" || hash === "revisions") {
    return hash;
  }

  return "calendar";
}

function AppContent() {
  const { viewer } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(getHashView);

  useEffect(() => {
    const handleHashChange = () => setCurrentView(getHashView());

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (!viewer) {
      return;
    }

    if (currentView === "contents" && viewer.role !== "admin") {
      window.location.hash = "calendar";
    }

    if (currentView === "revisions" && viewer.role === "admin") {
      window.location.hash = "calendar";
    }
  }, [currentView, viewer]);

  if (!viewer) {
    return <LoginPage />;
  }

  const visibleView =
    currentView === "contents" && viewer.role === "admin"
      ? "contents"
      : currentView === "revisions" && viewer.role !== "admin"
        ? "revisions"
        : "calendar";

  return (
    <AppShell currentView={visibleView}>
      {visibleView === "contents" ? (
        <ContentListPage />
      ) : visibleView === "revisions" ? (
        <RevisionsPage />
      ) : (
        <CalendarPage />
      )}
    </AppShell>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
