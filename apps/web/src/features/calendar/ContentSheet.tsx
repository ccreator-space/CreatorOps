import { X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import type { UserSummary } from "../../lib/mock-data";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type Platform = "linkedin" | "instagram";

type ContentSheetProps = {
  isOpen: boolean;
  authHeaders: () => Record<string, string>;
  users: UserSummary[];
  initialDate?: string;
  initialUserId?: string;
  onClose: () => void;
  onSaved: () => void;
  onStatusChange: (message: string) => void;
};

type FormState = {
  scheduledDate: string;
  assigneeId: string;
  platform: Platform;
  title: string;
  content: string;
};

const emptyForm: FormState = {
  scheduledDate: "",
  assigneeId: "",
  platform: "linkedin",
  title: "",
  content: ""
};

export function ContentSheet({
  isOpen,
  authHeaders,
  users,
  initialDate,
  initialUserId,
  onClose,
  onSaved,
  onStatusChange
}: ContentSheetProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm({
      ...emptyForm,
      scheduledDate: initialDate ?? "",
      assigneeId: initialUserId ?? ""
    });
  }, [initialDate, initialUserId, isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.scheduledDate || !form.assigneeId || !form.title.trim() || !form.content.trim()) {
      onStatusChange("Tarih, kullanıcı, başlık ve içerik alanları zorunlu.");
      return;
    }

    setIsSaving(true);
    onStatusChange("İçerik kaydediliyor.");

    try {
      const response = await fetch(`${apiUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          scheduledDate: form.scheduledDate,
          assigneeId: form.assigneeId,
          platform: form.platform,
          title: form.title.trim(),
          content: form.content.trim()
        })
      });

      if (!response.ok) {
        throw new Error("İçerik kaydedilemedi.");
      }

      onStatusChange("İçerik pending_review durumuyla kaydedildi.");
      onSaved();
      onClose();
    } catch {
      onStatusChange("İçerik kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="sheet-backdrop" role="presentation">
      <aside className="sheet" aria-label="Yeni içerik formu">
        <header className="sheet-header">
          <div>
            <p className="eyebrow">{form.scheduledDate || "Yeni kayıt"}</p>
            <h2>Yeni içerik</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>

        <form className="content-form" onSubmit={handleSubmit}>
          <label>
            Tarih
            <input
              name="scheduledDate"
              type="date"
              value={form.scheduledDate}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  scheduledDate: event.target.value
                }))
              }
            />
          </label>

          <label>
            Kullanıcı
            <select
              name="assigneeId"
              value={form.assigneeId}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  assigneeId: event.target.value
                }))
              }
            >
              <option value="">Kullanıcı seç</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Platform
            <select
              name="platform"
              value={form.platform}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  platform: event.target.value as Platform
                }))
              }
            >
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
            </select>
          </label>

          <label>
            Başlık
            <input
              name="title"
              placeholder="Gönderi başlığı"
              type="text"
              value={form.title}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  title: event.target.value
                }))
              }
            />
          </label>

          <label>
            İçerik
            <textarea
              name="content"
              placeholder="Gönderi içeriği"
              rows={8}
              value={form.content}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  content: event.target.value
                }))
              }
            />
          </label>

          <button className="primary-button is-full" type="submit" disabled={isSaving}>
            {isSaving ? "Kaydediliyor" : "Kaydet"}
          </button>
        </form>
      </aside>
    </div>
  );
}
