import { ArrowLeft, Check, Eye, Send, X } from "lucide-react";
import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import toast from "react-hot-toast";
import { MediaCarouselModal, type MediaCarouselItem } from "../../components/MediaCarouselModal";
import { formatBytes, prepareMediaFile, type PreparedMedia } from "../../lib/media-compression";
import {
  submissionConfigs,
  submissionTypeLabels,
  submissionTypes,
  type SubmissionType
} from "./submission-config";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type CommonForm = {
  submitterFirstName: string;
  submitterLastName: string;
  submitterEmail: string;
  submitterLinkedin: string;
  note: string;
};

const emptyCommonForm: CommonForm = {
  submitterFirstName: "",
  submitterLastName: "",
  submitterEmail: "",
  submitterLinkedin: "",
  note: ""
};

export function PublicSubmissionPage() {
  const [selectedType, setSelectedType] = useState<SubmissionType>("builder_spotlight");
  const [commonForm, setCommonForm] = useState<CommonForm>(emptyCommonForm);
  const [payload, setPayload] = useState<Record<string, string>>({});
  const [media, setMedia] = useState<PreparedMedia[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const config = submissionConfigs[selectedType];

  const previewItems = useMemo<MediaCarouselItem[]>(
    () =>
      media
        .filter((item) => item.previewUrl)
        .map((item) => ({
          id: item.id,
          type: item.type,
          originalName: item.originalName,
          mimeType: item.file.type,
          sourceUrl: item.previewUrl ?? "",
          width: item.width,
          height: item.height
        })),
    [media]
  );

  const updateCommonForm = (key: keyof CommonForm, value: string) => {
    setCommonForm((currentForm) => ({
      ...currentForm,
      [key]: value
    }));
  };

  const updatePayload = (key: string, value: string) => {
    setPayload((currentPayload) => ({
      ...currentPayload,
      [key]: value
    }));
  };

  const changeType = (type: SubmissionType) => {
    setSelectedType(type);
    setPayload({});
    setMedia((currentMedia) => {
      currentMedia.forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return [];
    });
  };

  const handleMediaChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    if (media.length + files.length > config.maxFiles) {
      toast.error(`${config.title} için en fazla ${config.maxFiles} dosya eklenebilir.`);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missingRequiredField = config.fields.find(
      (field) => field.required && !payload[field.key]?.trim()
    );

    if (
      !commonForm.submitterFirstName.trim() ||
      !commonForm.submitterLastName.trim() ||
      !commonForm.submitterEmail.trim() ||
      !commonForm.submitterLinkedin.trim() ||
      missingRequiredField
    ) {
      toast.error("Zorunlu alanları doldur.");
      return;
    }

    setIsSaving(true);

    try {
      const body = new FormData();
      body.set("type", selectedType);
      body.set("submitterFirstName", commonForm.submitterFirstName.trim());
      body.set("submitterLastName", commonForm.submitterLastName.trim());
      body.set("submitterEmail", commonForm.submitterEmail.trim());
      body.set("submitterLinkedin", commonForm.submitterLinkedin.trim());
      body.set("note", commonForm.note.trim());
      body.set("payload", JSON.stringify(payload));
      media.forEach((item) => {
        body.append("attachments", item.file, item.originalName);
        body.append("originalSizeBytes", String(item.originalSize));
        body.append("width", item.width ? String(item.width) : "");
        body.append("height", item.height ? String(item.height) : "");
      });

      const response = await fetch(`${apiUrl}/public/submissions`, {
        method: "POST",
        body
      });

      if (!response.ok) {
        throw new Error("Başvuru gönderilemedi.");
      }

      toast.success("Başvuru gönderildi.");
      setIsSubmitted(true);
    } catch {
      toast.error("Başvuru gönderilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isSubmitted) {
    return (
      <main className="public-submit-page">
        <section className="public-submit-success">
          <span>
            <Check size={28} />
          </span>
          <h1>Başvurunu aldık</h1>
          <p>Ekibimiz seri akışına göre başvurunu panelde değerlendirecek.</p>
          <button className="secondary-button" type="button" onClick={() => window.location.hash = "login"}>
            <ArrowLeft size={16} />
            Panele dön
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="public-submit-page">
      <section className="public-submit-shell">
        <header className="public-submit-header">
          <div>
            <h1>Shipin Seri Başvuruları</h1>
            <p>Builder Spotlight, Project Highlight ve README önerileri için bilgilerini buradan gönder.</p>
          </div>
          <a className="secondary-button" href="#login">
            Panele giriş
          </a>
        </header>

        <div className="submission-type-grid">
          {submissionTypes.map((type) => (
            <button
              className={`submission-type-card ${selectedType === type ? "is-active" : ""}`}
              key={type}
              type="button"
              onClick={() => changeType(type)}
            >
              <strong>{submissionTypeLabels[type]}</strong>
              <span>{submissionConfigs[type].description}</span>
            </button>
          ))}
        </div>

        <form className="public-submit-form" onSubmit={handleSubmit}>
          <section className="form-section">
            <h2>İletişim</h2>
            <div className="form-grid">
              <label>
                Ad
                <input
                  value={commonForm.submitterFirstName}
                  onChange={(event) => updateCommonForm("submitterFirstName", event.target.value)}
                />
              </label>
              <label>
                Soyad
                <input
                  value={commonForm.submitterLastName}
                  onChange={(event) => updateCommonForm("submitterLastName", event.target.value)}
                />
              </label>
              <label>
                E-posta
                <input
                  type="email"
                  value={commonForm.submitterEmail}
                  onChange={(event) => updateCommonForm("submitterEmail", event.target.value)}
                />
              </label>
              <label>
                LinkedIn
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/..."
                  value={commonForm.submitterLinkedin}
                  onChange={(event) => updateCommonForm("submitterLinkedin", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="form-section">
            <h2>{config.title}</h2>
            <div className="form-grid">
              {config.fields.map((field) => (
                <label className={field.type === "textarea" ? "is-wide" : undefined} key={field.key}>
                  {field.label}
                  {field.type === "textarea" ? (
                    <textarea
                      rows={5}
                      placeholder={field.placeholder}
                      value={payload[field.key] ?? ""}
                      onChange={(event) => updatePayload(field.key, event.target.value)}
                    />
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={payload[field.key] ?? ""}
                      onChange={(event) => updatePayload(field.key, event.target.value)}
                    />
                  )}
                </label>
              ))}
            </div>
          </section>

          <section className="form-section">
            <h2>Medya</h2>
            <label>
              {config.mediaLabel}
              <input
                accept="image/jpeg,image/png,image/webp,application/pdf"
                multiple
                type="file"
                onChange={handleMediaChange}
              />
            </label>
            {media.length ? (
              <div className="media-list">
                {media.map((item) => (
                  <div className="media-item" key={item.id}>
                    {item.previewUrl && item.type === "image" ? (
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
          </section>

          <section className="form-section">
            <h2>Ek not</h2>
            <label>
              Eklemek istediğin başka bir şey
              <textarea
                rows={4}
                value={commonForm.note}
                onChange={(event) => updateCommonForm("note", event.target.value)}
              />
            </label>
          </section>

          <button className="primary-button is-full" type="submit" disabled={isSaving}>
            <Send size={18} />
            {isSaving ? "Gönderiliyor" : "Başvuruyu gönder"}
          </button>
        </form>
      </section>

      {previewIndex !== null ? (
        <MediaCarouselModal
          title="Medya önizleme"
          items={previewItems}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      ) : null}
    </main>
  );
}
