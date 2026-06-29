import { AppShell } from "./components/AppShell";
import { AuthProvider } from "./features/auth/AuthProvider";
import { CalendarPage } from "./features/calendar/CalendarPage";

export function App() {
  return (
    <AuthProvider>
      <AppShell>
        <CalendarPage />
      </AppShell>
    </AuthProvider>
  );
}
