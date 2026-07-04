import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UserSummary } from "../../lib/mock-data";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function resolveAvatarUrl(user: UserSummary): UserSummary {
  if (!user.avatarUrl || user.avatarUrl.startsWith("http://") || user.avatarUrl.startsWith("https://")) {
    return user;
  }

  return {
    ...user,
    avatarUrl: user.avatarUrl.startsWith("/uploads") ? `${apiUrl}${user.avatarUrl}` : user.avatarUrl
  };
}

type LoginCredentials = {
  email: string;
  password: string;
};

type BootstrapAdminPayload = {
  name: string;
  email: string;
  password: string;
};

type AuthContextValue = {
  viewer: UserSummary | null;
  users: UserSummary[];
  visibleUsers: UserSummary[];
  token: string | null;
  isAuthReady: boolean;
  needsBootstrap: boolean | null;
  authHeaders: () => Record<string, string>;
  login: (credentials: LoginCredentials) => Promise<void>;
  bootstrapAdmin: (payload: BootstrapAdminPayload) => Promise<void>;
  logout: () => void;
  refreshUsers: () => Promise<void>;
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

type BootstrapStatusResponse = {
  data: {
    needsBootstrap: boolean;
  };
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
  const [needsBootstrap, setNeedsBootstrap] = useState<boolean | null>(null);

  const authHeaders = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const logout = () => {
    localStorage.removeItem("shipin.token");
    setToken(null);
    setViewer(null);
    setUsers([]);
  };

  async function loadBootstrapStatus() {
    const response = await fetch(`${apiUrl}/auth/bootstrap-status`);

    if (!response.ok) {
      throw new Error("Bootstrap status could not be loaded");
    }

    const payload = (await response.json()) as BootstrapStatusResponse;
    setNeedsBootstrap(payload.data.needsBootstrap);

    return payload.data.needsBootstrap;
  }

  async function loadUsers(activeToken: string) {
    const usersResponse = await fetch(`${apiUrl}/users`, {
      headers: {
        Authorization: `Bearer ${activeToken}`
      }
    });

    if (!usersResponse.ok) {
      throw new Error("Users could not be loaded");
    }

    const usersPayload = (await usersResponse.json()) as UsersResponse;
    const nextUsers = usersPayload.data.map(resolveAvatarUrl);
    setUsers(nextUsers);
    setViewer((currentViewer) =>
      currentViewer ? nextUsers.find((user) => user.id === currentViewer.id) ?? currentViewer : currentViewer
    );
  }

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
    setViewer(resolveAvatarUrl(mePayload.data));
    await loadUsers(activeToken);
  }

  async function refreshUsers() {
    if (!token) {
      return;
    }

    await loadUsers(token);
  }

  useEffect(() => {
    let isCurrent = true;

    async function restoreSession() {
      try {
        setIsAuthReady(false);
        const shouldBootstrap = await loadBootstrapStatus();

        if (!isCurrent) {
          return;
        }

        if (shouldBootstrap) {
          localStorage.removeItem("shipin.token");
          setToken(null);
          setViewer(null);
          setUsers([]);
          return;
        }

        if (!token) {
          return;
        }

        await loadSession(token);
      } catch {
        if (isCurrent) {
          setNeedsBootstrap(false);

          if (token) {
            logout();
          }
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
        ? users.filter((user) => user.isActive)
        : users.filter((user) => user.id === viewer.id && user.isActive)
      : [];

    return {
      viewer,
      users,
      visibleUsers,
      token,
      isAuthReady,
      needsBootstrap,
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
        setNeedsBootstrap(false);
        setToken(payload.data.token);
        setViewer(resolveAvatarUrl(payload.data.user));
        await loadSession(payload.data.token);
      },
      bootstrapAdmin: async ({ name, email, password }) => {
        const response = await fetch(`${apiUrl}/auth/bootstrap-admin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name,
            email,
            password
          })
        });

        if (!response.ok) {
          throw new Error("Admin account could not be created");
        }

        const payload = (await response.json()) as LoginResponse;
        localStorage.setItem("shipin.token", payload.data.token);
        setNeedsBootstrap(false);
        setToken(payload.data.token);
        setViewer(resolveAvatarUrl(payload.data.user));
        await loadSession(payload.data.token);
      },
      logout,
      refreshUsers
    };
  }, [isAuthReady, needsBootstrap, token, users, viewer]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
