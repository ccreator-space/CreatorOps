import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { AuthProvider } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { CalendarPage } from "./features/calendar/CalendarPage";
import { ContentListPage } from "./features/content/ContentListPage";
import { useAuth } from "./features/auth/AuthProvider";
import { RevisionsPage } from "./features/revisions/RevisionsPage";
import { PublicSubmissionPage } from "./features/submissions/PublicSubmissionPage";
import { SeriesAssignmentsPage } from "./features/submissions/SeriesAssignmentsPage";
import { SubmissionsPage } from "./features/submissions/SubmissionsPage";

type AppView = "calendar" | "contents" | "revisions" | "submissions" | "series-assignments" | "submit";

function getHashView(): AppView {
  const hash = window.location.hash.replace("#", "");

  if (
    hash === "contents" ||
    hash === "revisions" ||
    hash === "submissions" ||
    hash === "series-assignments" ||
    hash === "submit"
  ) {
    return hash;
  }

  return "calendar";
}

function AppContent() {
  const { isAuthReady, viewer } = useAuth();
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

    if (currentView === "revisions" && viewer.role === "admin") {
      window.location.hash = "calendar";
    }

    if (currentView === "series-assignments" && viewer.role !== "admin") {
      window.location.hash = "submissions";
    }
  }, [currentView, viewer]);

  if (currentView === "submit") {
    return <PublicSubmissionPage />;
  }

  if (!isAuthReady) {
    return (
      <main className="login-page">
        <p className="status-message">Oturum kontrol ediliyor.</p>
      </main>
    );
  }

  if (!viewer) {
    return <LoginPage />;
  }

  const visibleView =
    currentView === "contents"
      ? "contents"
      : currentView === "submissions"
        ? "submissions"
      : currentView === "series-assignments" && viewer.role === "admin"
        ? "series-assignments"
      : currentView === "revisions" && viewer.role !== "admin"
        ? "revisions"
        : "calendar";

  return (
    <AppShell currentView={visibleView}>
      {visibleView === "contents" ? (
        <ContentListPage />
      ) : visibleView === "submissions" ? (
        <SubmissionsPage />
      ) : visibleView === "series-assignments" ? (
        <SeriesAssignmentsPage />
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
    <>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: "#ffffff",
            border: "1px solid #dfe4df",
            borderRadius: "8px",
            boxShadow: "0 18px 48px rgb(23 32 38 / 12%)",
            color: "#172026",
            fontSize: "14px",
            maxWidth: "420px",
            padding: "12px 14px"
          },
          success: {
            iconTheme: {
              primary: "#1f6f5b",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#b42318",
              secondary: "#ffffff"
            }
          }
        }}
      />
    </>
  );
}
