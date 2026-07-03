import { Toaster } from "react-hot-toast";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { AppShell, type AppView } from "./components/AppShell";
import { AuthProvider, useAuth } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { CalendarPage } from "./features/calendar/CalendarPage";
import { ContentListPage } from "./features/content/ContentListPage";
import { FormBuilderPage } from "./features/forms/FormBuilderPage";
import { RevisionsPage } from "./features/revisions/RevisionsPage";
import { SettingsPage } from "./features/settings/SettingsPage";
import { PublicSubmissionPage } from "./features/submissions/PublicSubmissionPage";
import { SeriesAssignmentsPage } from "./features/submissions/SeriesAssignmentsPage";
import { SubmissionsPage } from "./features/submissions/SubmissionsPage";
import { UsersPage } from "./features/users/UsersPage";

const routeViewMap: Record<string, AppView> = {
  "/calendar": "calendar",
  "/contents": "contents",
  "/revisions": "revisions",
  "/submissions": "submissions",
  "/series": "series",
  "/forms": "forms",
  "/users": "users",
  "/settings": "settings"
};

function AuthGate() {
  const { isAuthReady, viewer } = useAuth();
  const location = useLocation();

  if (!isAuthReady) {
    return (
      <main className="login-page">
        <p className="status-message">Checking session.</p>
      </main>
    );
  }

  if (!viewer) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function RoleGuard({ role, fallback }: { role: "admin" | "user"; fallback: string }) {
  const { viewer } = useAuth();

  if (!viewer || viewer.role !== role) {
    return <Navigate to={fallback} replace />;
  }

  return <Outlet />;
}

function GuestOnlyLogin() {
  const { isAuthReady, viewer } = useAuth();

  if (!isAuthReady) {
    return (
      <main className="login-page">
        <p className="status-message">Checking session.</p>
      </main>
    );
  }

  if (viewer) {
    return <Navigate to="/calendar" replace />;
  }

  return <LoginPage />;
}

function PanelLayout() {
  const location = useLocation();
  const currentView = routeViewMap[location.pathname] ?? "calendar";

  return (
    <AppShell currentView={currentView}>
      <Outlet />
    </AppShell>
  );
}

export function App() {
  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/submit" element={<Navigate to="/submit/builder-spotlight" replace />} />
            <Route path="/submit/:slug" element={<PublicSubmissionPage />} />

            <Route path="/login" element={<GuestOnlyLogin />} />

            <Route element={<AuthGate />}>
              <Route element={<PanelLayout />}>
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/contents" element={<ContentListPage />} />
                <Route path="/submissions" element={<SubmissionsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route element={<RoleGuard role="user" fallback="/calendar" />}>
                  <Route path="/revisions" element={<RevisionsPage />} />
                </Route>
                <Route element={<RoleGuard role="admin" fallback="/submissions" />}>
                  <Route path="/series" element={<SeriesAssignmentsPage />} />
                  <Route path="/series-assignments" element={<Navigate to="/series" replace />} />
                  <Route path="/forms" element={<FormBuilderPage />} />
                  <Route path="/users" element={<UsersPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="*" element={<Navigate to="/calendar" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
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
