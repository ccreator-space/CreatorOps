import { Eye, X } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { MediaCarouselModal, type MediaCarouselItem } from "../../components/MediaCarouselModal";
import type { UserSummary } from "../../lib/mock-data";
import { formatBytes, prepareMediaFile, type PreparedMedia } from "../../lib/media-compression";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type Platform = "linkedin" | "instagram";
type PostStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "revision_requested";

export type ContentAttachment = {
  id: string;
  type: "image" | "pdf";
  originalName: string;
  mimeType: string;
  sizeBytes?: number;
  compressedSizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  publicUrl: string;
};

export type EditableContentPost = {
  id: string;
  assigneeId: string;
  scheduledDate: string;
  platform: Platform;
  title: string;
  content: string;
  status?: PostStatus;
  attachments: ContentAttachment[];
};

type ContentSheetProps = {
  isOpen: boolean;
  authHeaders: () => Record<string, string>;
  users: UserSummary[];
  editingPost?: EditableContentPost | null;
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
  editingPost,
  initialDate,
  initialUserId,
  onClose,
  onSaved,
  onStatusChange
}: ContentSheetProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [media, setMedia] = useState<PreparedMedia[]>([]);
  const [existingMedia, setExistingMedia] = useState<ContentAttachment[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = Boolean(editingPost);
  const previewItems: MediaCarouselItem[] = [
    ...existingMedia.map((item) => ({
      id: item.id,
      type: item.type,
      originalName: item.originalName,
      mimeType: item.mimeType,
      sourceUrl: `${apiUrl}${item.publicUrl}`,
      width: item.width,
      height: item.height
    })),
    ...media
      .filter((item) => item.previewUrl)
      .map((item) => ({
        id: item.id,
        type: item.type,
        originalName: item.originalName,
        mimeType: item.file.type,
        sourceUrl: item.previewUrl ?? "",
        width: item.width,
        height: item.height
      }))
  ];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(
      editingPost
        ? {
            scheduledDate: editingPost.scheduledDate,
            assigneeId: editingPost.assigneeId,
            platform: editingPost.platform,
            title: editingPost.title,
            content: editingPost.content
          }
        : {
            ...emptyForm,
            scheduledDate: initialDate ?? "",
            assigneeId: initialUserId ?? users[0]?.id ?? ""
          }
    );
    setExistingMedia(editingPost?.attachments ?? []);
    setPreviewIndex(null);
    setMedia((currentMedia) => {
      currentMedia.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return [];
    });
  }, [editingPost?.id, initialDate, initialUserId, isOpen, users]);

  const handleMediaChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const maxFiles = form.platform === "instagram" ? 10 : 5;

    if (existingMedia.length + media.length + files.length > maxFiles) {
      toast.error(`${form.platform === "instagram" ? "Instagram" : "LinkedIn"} için en fazla ${maxFiles} medya eklenebilir.`);
      return;
    }

    try {
      const preparedFiles = await Promise.all(files.map(prepareMediaFile));
      setMedia((currentMedia) => [...currentMedia, ...preparedFiles]);
      toast.success("Medya hazırlandı.");
    } catch {
      toast.error("Medya hazırlanamadı.");
    }
  };

  const removeMedia = (mediaId: string) => {
    setMedia((currentMedia) => {
      const item = currentMedia.find((mediaItem) => mediaItem.id === mediaId);

      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }

      return currentMedia.filter((mediaItem) => mediaItem.id !== mediaId);
    });
  };

  const removeExistingMedia = (mediaId: string) => {
    setExistingMedia((currentMedia) => currentMedia.filter((item) => item.id !== mediaId));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.scheduledDate || !form.assigneeId || !form.title.trim() || !form.content.trim()) {
      toast.error("Tarih, kullanıcı, başlık ve içerik alanları zorunlu.");
      onStatusChange("Tarih, kullanıcı, başlık ve içerik alanları zorunlu.");
      return;
    }

    const maxFiles = form.platform === "instagram" ? 10 : 5;
    if (existingMedia.length + media.length > maxFiles) {
      toast.error(`${form.platform === "instagram" ? "Instagram" : "LinkedIn"} için en fazla ${maxFiles} medya eklenebilir.`);
      return;
    }

    setIsSaving(true);
    onStatusChange(isEditing ? "İçerik güncelleniyor." : "İçerik kaydediliyor.");

    try {
      const body = new FormData();
      body.set("scheduledDate", form.scheduledDate);
      body.set("assigneeId", form.assigneeId);
      body.set("platform", form.platform);
      body.set("title", form.title.trim());
      body.set("content", form.content.trim());
      existingMedia.forEach((item) => {
        body.append("keepAttachmentIds", item.id);
      });
      media.forEach((item) => {
        body.append("attachments", item.file, item.originalName);
        body.append("originalSizeBytes", String(item.originalSize));
        body.append("width", item.width ? String(item.width) : "");
        body.append("height", item.height ? String(item.height) : "");
      });

      const response = await fetch(isEditing ? `${apiUrl}/posts/${editingPost?.id}` : `${apiUrl}/posts`, {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          ...authHeaders()
        },
        body
      });

      if (!response.ok) {
        throw new Error(isEditing ? "İçerik güncellenemedi." : "İçerik kaydedilemedi.");
      }

      toast.success(isEditing ? "İçerik güncellendi." : "İçerik onaya gönderildi.");
      onStatusChange(isEditing ? "İçerik güncellendi." : "İçerik pending_review durumuyla kaydedildi.");
      onSaved();
      onClose();
    } catch {
      toast.error(isEditing ? "İçerik güncellenemedi." : "İçerik kaydedilemedi.");
      onStatusChange(isEditing ? "İçerik güncellenemedi." : "İçerik kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="sheet-backdrop" role="presentation">
      <aside className="sheet" aria-label={isEditing ? "İçerik düzenleme formu" : "Yeni içerik formu"}>
        <header className="sheet-header">
          <div>
            <h2>{isEditing ? "İçeriği düzenle" : "Yeni içerik"}</h2>
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

          <label>
            Medya
            <input
              accept="image/jpeg,image/png,image/webp,application/pdf"
              multiple
              type="file"
              onChange={handleMediaChange}
            />
          </label>

          {existingMedia.length || media.length ? (
            <div className="media-list">
              {existingMedia.map((item) => (
                <div className="media-item" key={item.id}>
                  {item.type === "image" ? (
                    <img alt={item.originalName} src={`${apiUrl}${item.publicUrl}`} />
                  ) : (
                    <span className="media-file-type">PDF</span>
                  )}
                  <div>
                    <strong>{item.originalName}</strong>
                    <p>Mevcut medya</p>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setPreviewIndex(previewItems.findIndex((previewItem) => previewItem.id === item.id))}
                    aria-label="Medyayı önizle"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => removeExistingMedia(item.id)}
                    aria-label="Medyayı kaldır"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {media.map((item) => (
                <div className="media-item" key={item.id}>
                  {item.previewUrl ? (
                    <img alt={item.originalName} src={item.previewUrl} />
                  ) : (
                    <span className="media-file-type">PDF</span>
                  )}
                  <div>
                    <strong>{item.originalName}</strong>
                    <p>
                      {formatBytes(item.originalSize)} → {formatBytes(item.compressedSize)}
                    </p>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setPreviewIndex(previewItems.findIndex((previewItem) => previewItem.id === item.id))}
                    aria-label="Medyayı önizle"
                  >
                    <Eye size={16} />
                  </button>
                  <button className="icon-button" type="button" onClick={() => removeMedia(item.id)} aria-label="Medyayı kaldır">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <button className="primary-button is-full" type="submit" disabled={isSaving}>
            {isSaving ? "Kaydediliyor" : isEditing ? "Güncelle" : "Kaydet"}
          </button>
        </form>
      </aside>

      {previewIndex !== null ? (
        <MediaCarouselModal
          title="Medya önizleme"
          items={previewItems}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      ) : null}
    </div>
  );
}
