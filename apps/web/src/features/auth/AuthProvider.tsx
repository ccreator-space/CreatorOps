import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { users, type UserSummary } from "../../lib/mock-data";

type AuthContextValue = {
  viewer: UserSummary;
  users: UserSummary[];
  visibleUsers: UserSummary[];
  setViewerId: (userId: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [viewerId, setViewerIdState] = useState(() => {
    return localStorage.getItem("shipin.viewerId") ?? "user-1";
  });

  const viewer = users.find((user) => user.id === viewerId) ?? users[0];

  const value = useMemo<AuthContextValue>(() => {
    const visibleUsers =
      viewer.role === "admin" ? users : users.filter((user) => user.id === viewer.id);

    return {
      viewer,
      users,
      visibleUsers,
      setViewerId: (userId: string) => {
        localStorage.setItem("shipin.viewerId", userId);
        setViewerIdState(userId);
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
