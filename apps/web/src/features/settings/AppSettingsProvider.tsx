import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { defaultPrimaryColor, isValidHexColor } from "../../lib/theme";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const fallbackLogoSrc = "/logos/cpcreator.png";

type AppSettings = {
  logoUrl: string | null;
  primaryColor: string;
};

type AppSettingsResponse = {
  data: AppSettings;
};

type AppSettingsContextValue = {
  settings: AppSettings;
  logoSrc: string;
  refreshSettings: () => Promise<void>;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function resolveAssetUrl(value: string | null) {
  if (!value) {
    return fallbackLogoSrc;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return value.startsWith("/uploads") ? `${apiUrl}${value}` : value;
}

function normalizeSettings(settings: Partial<AppSettings>): AppSettings {
  return {
    logoUrl: settings.logoUrl ?? null,
    primaryColor: isValidHexColor(settings.primaryColor ?? "")
      ? settings.primaryColor!
      : defaultPrimaryColor
  };
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    logoUrl: null,
    primaryColor: defaultPrimaryColor
  });

  const refreshSettings = async () => {
    const response = await fetch(`${apiUrl}/public/settings`);

    if (!response.ok) {
      throw new Error("Settings could not be loaded");
    }

    const payload = (await response.json()) as AppSettingsResponse;
    setSettings(normalizeSettings(payload.data));
  };

  useEffect(() => {
    let isCurrent = true;

    async function loadSettings() {
      try {
        const response = await fetch(`${apiUrl}/public/settings`);

        if (!response.ok) {
          throw new Error("Settings could not be loaded");
        }

        const payload = (await response.json()) as AppSettingsResponse;

        if (isCurrent) {
          setSettings(normalizeSettings(payload.data));
        }
      } catch {
        if (isCurrent) {
          setSettings({
            logoUrl: null,
            primaryColor: defaultPrimaryColor
          });
        }
      }
    }

    void loadSettings();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const primaryColor = isValidHexColor(settings.primaryColor)
      ? settings.primaryColor
      : defaultPrimaryColor;

    document.documentElement.style.setProperty("--theme-primary", primaryColor);
  }, [settings.primaryColor]);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      settings,
      logoSrc: resolveAssetUrl(settings.logoUrl),
      refreshSettings
    }),
    [settings]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error("useAppSettings must be used inside AppSettingsProvider");
  }

  return context;
}
