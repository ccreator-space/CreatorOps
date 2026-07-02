import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { users, type UserSummary } from "../../lib/mock-data";

type AuthContextValue = {
  viewer: UserSummary | null;
  users: UserSummary[];
  visibleUsers: UserSummary[];
  login: (userId: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [viewerId, setViewerIdState] = useState(() => {
    return localStorage.getItem("shipin.viewerId");
  });

  const viewer = users.find((user) => user.id === viewerId) ?? null;

  const value = useMemo<AuthContextValue>(() => {
    const visibleUsers =
      !viewer ? [] : viewer.role === "admin" ? users : users.filter((user) => user.id === viewer.id);

    return {
      viewer,
      users,
      visibleUsers,
      login: (userId: string) => {
        localStorage.setItem("shipin.viewerId", userId);
        setViewerIdState(userId);
      },
      logout: () => {
        localStorage.removeItem("shipin.viewerId");
        setViewerIdState(null);
      }
    };
  }, [viewer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
