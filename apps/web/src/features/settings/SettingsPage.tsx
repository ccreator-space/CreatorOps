import { ImageUp, Save, UserRound } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthProvider";
import { useAppSettings } from "./AppSettingsProvider";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type SettingsTab = "profile" | "site";

function createObjectUrl(file: File | null) {
  return file ? URL.createObjectURL(file) : "";
}

export function SettingsPage() {
  const { authHeaders, refreshUsers, viewer } = useAuth();
  const { logoSrc, refreshSettings } = useAppSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [name, setName] = useState(viewer?.name ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);

  const avatarPreview = useMemo(() => createObjectUrl(avatarFile), [avatarFile]);
  const logoPreview = useMemo(() => createObjectUrl(logoFile), [logoFile]);

  useEffect(() => {
    setName(viewer?.name ?? "");
  }, [viewer?.name]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    return () => {
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

  const updateAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    setAvatarFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const updateLogo = (event: ChangeEvent<HTMLInputElement>) => {
    setLogoFile(event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!viewer || !name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setIsSavingProfile(true);

    try {
      const profileResponse = await fetch(`${apiUrl}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          name: name.trim()
        })
      });

      if (!profileResponse.ok) {
        throw new Error("Profile could not be updated.");
      }

      if (avatarFile) {
        const body = new FormData();
        body.set("avatar", avatarFile);

        const avatarResponse = await fetch(`${apiUrl}/users/me/avatar`, {
          method: "PATCH",
          headers: authHeaders(),
          body
        });

        if (!avatarResponse.ok) {
          throw new Error("Avatar could not be updated.");
        }
      }

      await refreshUsers();
      setAvatarFile(null);
      toast.success("Profile updated.");
    } catch {
      toast.error("Profile could not be updated.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const saveLogo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!logoFile) {
      toast.error("Choose a logo first.");
      return;
    }

    setIsSavingLogo(true);

    try {
      const body = new FormData();
      body.set("logo", logoFile);

      const response = await fetch(`${apiUrl}/settings/logo`, {
        method: "PATCH",
        headers: authHeaders(),
        body
      });

      if (!response.ok) {
        throw new Error("Logo could not be updated.");
      }

      await refreshSettings();
      setLogoFile(null);
      toast.success("Logo updated.");
    } catch {
      toast.error("Logo could not be updated.");
    } finally {
      setIsSavingLogo(false);
    }
  };

  if (!viewer) {
    return null;
  }

  const avatarSrc = avatarPreview || viewer.avatarUrl || "";
  const currentLogoSrc = logoPreview || logoSrc;

  return (
    <section className="settings-page">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        <button
          className={activeTab === "profile" ? "is-active" : ""}
          type="button"
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
        {viewer.role === "admin" ? (
          <button
            className={activeTab === "site" ? "is-active" : ""}
            type="button"
            onClick={() => setActiveTab("site")}
          >
            Site settings
          </button>
        ) : null}
      </div>

      {activeTab === "profile" ? (
        <form className="settings-panel" onSubmit={saveProfile}>
          <div className="settings-media-preview">
            {avatarSrc ? <img alt={viewer.name} src={avatarSrc} /> : <UserRound size={42} />}
          </div>

          <div className="form-grid">
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Email
              <input value={viewer.email} readOnly />
            </label>
            <label>
              Role
              <input value={viewer.role === "admin" ? "Admin" : "User"} readOnly />
            </label>
            <label>
              Avatar
              <input accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" type="file" onChange={updateAvatar} />
            </label>
          </div>

          <button className="primary-button" type="submit" disabled={isSavingProfile}>
            <Save size={18} />
            {isSavingProfile ? "Saving..." : "Save profile"}
          </button>
        </form>
      ) : null}

      {activeTab === "site" && viewer.role === "admin" ? (
        <form className="settings-panel" onSubmit={saveLogo}>
          <div className="settings-logo-preview">
            <img alt="Current site logo" src={currentLogoSrc} />
          </div>

          <label className="settings-file-field">
            Logo
            <input accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml" type="file" onChange={updateLogo} />
          </label>

          <button className="primary-button" type="submit" disabled={isSavingLogo}>
            <ImageUp size={18} />
            {isSavingLogo ? "Uploading..." : "Save logo"}
          </button>
        </form>
      ) : null}
    </section>
  );
}
