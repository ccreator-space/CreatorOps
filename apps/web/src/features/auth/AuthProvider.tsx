import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserSummary } from "../../lib/mock-data";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type LoginCredentials = {
  email: string;
  password: string;
};

type AuthContextValue = {
  viewer: UserSummary | null;
  users: UserSummary[];
  visibleUsers: UserSummary[];
  token: string | null;
  isAuthReady: boolean;
  authHeaders: () => Record<string, string>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
};

type LoginResponse = {
  data: {
    token: string;
    user: UserSummary;
  };
};

type MeResponse = {
  data: UserSummary;
};

type UsersResponse = {
  data: UserSummary[];
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState(() => localStorage.getItem("shipin.token"));
  const [viewer, setViewer] = useState<UserSummary | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const authHeaders = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const logout = () => {
    localStorage.removeItem("shipin.token");
    setToken(null);
    setViewer(null);
    setUsers([]);
  };

  async function loadSession(activeToken: string) {
    const meResponse = await fetch(`${apiUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    if (!meResponse.ok) {
      throw new Error("Session expired");
    }

    const mePayload = (await meResponse.json()) as MeResponse;
    const usersResponse = await fetch(`${apiUrl}/users`, {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    if (!usersResponse.ok) {
      throw new Error("Users could not be loaded");
    }

    const usersPayload = (await usersResponse.json()) as UsersResponse;
    setViewer(mePayload.data);
    setUsers(usersPayload.data);
  }

  useEffect(() => {
    let isCurrent = true;

    async function restoreSession() {
      if (!token) {
        setIsAuthReady(true);
        return;
      }

      try {
        await loadSession(token);
      } catch {
        if (isCurrent) {
          logout();
        }
      } finally {
        if (isCurrent) {
          setIsAuthReady(true);
        }
      }
    }

    void restoreSession();

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(() => {
    const visibleUsers = viewer
      ? viewer.role === "admin"
        ? users
        : users.filter((user) => user.id === viewer.id)
      : [];

    return {
      viewer,
      users,
      visibleUsers,
      token,
      isAuthReady,
      authHeaders,
      login: async ({ email, password }) => {
        const response = await fetch(`${apiUrl}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        if (!response.ok) {
          throw new Error("Invalid email or password");
        }

        const payload = (await response.json()) as LoginResponse;
        localStorage.setItem("shipin.token", payload.data.token);
        setToken(payload.data.token);
        setViewer(payload.data.user);
        await loadSession(payload.data.token);
      },
      logout
    };
  }, [isAuthReady, token, users, viewer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
