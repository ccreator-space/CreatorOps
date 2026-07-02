import { Check, Eye, Send, X } from "lucide-react";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { MediaCarouselModal, type MediaCarouselItem } from "../../components/MediaCarouselModal";
import {
  type FormResponse,
  type SubmissionForm,
  type SubmissionFormQuestion
} from "../forms/form-types";
import { formatBytes, prepareMediaFile, type PreparedMedia } from "../../lib/media-compression";

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

function getQuestionMaxFiles(question: SubmissionFormQuestion) {
  return question.config?.maxFiles ?? 1;
}

function getQuestionAccept(question: SubmissionFormQuestion) {
  return question.config?.allowedMimeTypes?.join(",") ?? "image/jpeg,image/png,image/webp,application/pdf";
}

export function PublicSubmissionPage() {
  const { slug = "" } = useParams();
  const [form, setForm] = useState<SubmissionForm | null>(null);
  const [commonForm, setCommonForm] = useState<CommonForm>(emptyCommonForm);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [mediaAnswers, setMediaAnswers] = useState<Record<string, PreparedMedia[]>>({});
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("Form yükleniyor.");
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const previewItems = useMemo<MediaCarouselItem[]>(
    () =>
      Object.values(mediaAnswers)
        .flat()
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
    [mediaAnswers]
  );

  useEffect(() => {
    let isCurrent = true;

    async function loadForm() {
      setStatusMessage("Form yükleniyor.");

      try {
        const response = await fetch(`${apiUrl}/public/forms/${slug}`);

        if (!response.ok) {
          throw new Error("Form alınamadı.");
        }

        const payload = (await response.json()) as FormResponse;

        if (isCurrent) {
          setForm(payload.data);
          setStatusMessage("");
        }
      } catch {
        if (isCurrent) {
          setForm(null);
          setStatusMessage("Form bulunamadı.");
        }
      }
    }

    void loadForm();

    return () => {
      isCurrent = false;
    };
  }, [slug]);

  const updateCommonForm = (key: keyof CommonForm, value: string) => {
    setCommonForm((currentForm) => ({
      ...currentForm,
      [key]: value
    }));
  };

  const updateAnswer = (key: string, value: string) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [key]: value
    }));
  };

  const handleMediaChange = async (question: SubmissionFormQuestion, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    const currentFiles = mediaAnswers[question.key] ?? [];
    const maxFiles = getQuestionMaxFiles(question);

    if (currentFiles.length + files.length > maxFiles) {
      toast.error(`${question.label} için en fazla ${maxFiles} dosya eklenebilir.`);
      return;
    }

    const allowedMimeTypes = question.config?.allowedMimeTypes;
    const unsupportedFile = allowedMimeTypes?.length
      ? files.find((file) => !allowedMimeTypes.includes(file.type))
      : null;

    if (unsupportedFile) {
      toast.error(`${unsupportedFile.name} bu alan için desteklenmiyor.`);
      return;
    }

    try {
      const preparedFiles = await Promise.all(files.map(prepareMediaFile));
      setMediaAnswers((currentAnswers) => ({
        ...currentAnswers,
        [question.key]: [...currentFiles, ...preparedFiles]
      }));
      toast.success("Medya hazırlandı.");
    } catch {
      toast.error("Medya hazırlanamadı.");
    }
  };

  const removeMedia = (questionKey: string, mediaId: string) => {
    setMediaAnswers((currentAnswers) => {
      const currentMedia = currentAnswers[questionKey] ?? [];
      const item = currentMedia.find((mediaItem) => mediaItem.id === mediaId);

      if (item?.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }

      return {
        ...currentAnswers,
        [questionKey]: currentMedia.filter((mediaItem) => mediaItem.id !== mediaId)
      };
    });
  };

  const resetForm = () => {
    setCommonForm(emptyCommonForm);
    setAnswers({});
    setPreviewIndex(null);
    setMediaAnswers((currentAnswers) => {
      Object.values(currentAnswers).flat().forEach((item) => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      return {};
    });
    setIsSubmitted(false);
  };

  const validateForm = () => {
    if (!form) {
      return false;
    }

    if (
      !commonForm.submitterFirstName.trim() ||
      !commonForm.submitterLastName.trim() ||
      !commonForm.submitterEmail.trim() ||
      !commonForm.submitterLinkedin.trim()
    ) {
      return false;
    }

    return form.questions.every((question) => {
      if (!question.required) {
        return true;
      }

      if (question.type === "media") {
        return Boolean(mediaAnswers[question.key]?.length);
      }

      return Boolean(answers[question.key]?.trim());
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form || !validateForm()) {
      toast.error("Zorunlu alanları doldur.");
      return;
    }

    setIsSaving(true);

    try {
      const body = new FormData();
      body.set("submitterFirstName", commonForm.submitterFirstName.trim());
      body.set("submitterLastName", commonForm.submitterLastName.trim());
      body.set("submitterEmail", commonForm.submitterEmail.trim());
      body.set("submitterLinkedin", commonForm.submitterLinkedin.trim());
      body.set("note", commonForm.note.trim());
      body.set("answers", JSON.stringify(answers));

      Object.entries(mediaAnswers).forEach(([questionKey, items]) => {
        items.forEach((item) => {
          body.append("attachments", item.file, item.originalName);
          body.append("attachmentQuestionKeys", questionKey);
          body.append("originalSizeBytes", String(item.originalSize));
          body.append("width", item.width ? String(item.width) : "");
          body.append("height", item.height ? String(item.height) : "");
        });
      });

      const response = await fetch(`${apiUrl}/public/forms/${form.slug}/submissions`, {
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

  const renderQuestion = (question: SubmissionFormQuestion) => {
    if (question.type === "media") {
      const items = mediaAnswers[question.key] ?? [];

      return (
        <label className="is-wide" key={question.id}>
          {question.label}
          {question.helpText ? <span className="field-help">{question.helpText}</span> : null}
          <input
            accept={getQuestionAccept(question)}
            multiple={getQuestionMaxFiles(question) > 1}
            type="file"
            onChange={(event) => handleMediaChange(question, event)}
          />
          {items.length ? (
            <div className="media-list">
              {items.map((item) => (
                <div className="media-item" key={item.id}>
                  {item.previewUrl && item.type === "image" ? (
                    <img alt={item.originalName} src={item.previewUrl} />
                  ) : (
                    <span className="media-file-type">PDF</span>
                  )}
                  <div>
                    <strong>{item.originalName}</strong>
                    <p>
                      {formatBytes(item.originalSize)} / {formatBytes(item.compressedSize)}
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
                  <button className="icon-button" type="button" onClick={() => removeMedia(question.key, item.id)} aria-label="Medyayı kaldır">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </label>
      );
    }

    if (question.type === "textarea") {
      return (
        <label className="is-wide" key={question.id}>
          {question.label}
          {question.helpText ? <span className="field-help">{question.helpText}</span> : null}
          <textarea
            rows={5}
            placeholder={question.placeholder ?? undefined}
            value={answers[question.key] ?? ""}
            onChange={(event) => updateAnswer(question.key, event.target.value)}
          />
        </label>
      );
    }

    if (question.type === "range") {
      const min = question.config?.min ?? 0;
      const max = question.config?.max ?? 10;
      const step = question.config?.step ?? 1;
      const value = answers[question.key] ?? String(min);

      return (
        <label key={question.id}>
          {question.label}
          <span className="range-control">
            <input
              min={min}
              max={max}
              step={step}
              type="range"
              value={value}
              onChange={(event) => updateAnswer(question.key, event.target.value)}
            />
            <strong>{value}</strong>
          </span>
        </label>
      );
    }

    return (
      <label key={question.id}>
        {question.label}
        {question.helpText ? <span className="field-help">{question.helpText}</span> : null}
        <input
          type={question.type === "number" ? "number" : question.type === "email" ? "email" : question.type === "url" ? "url" : "text"}
          placeholder={question.placeholder ?? undefined}
          value={answers[question.key] ?? ""}
          onChange={(event) => updateAnswer(question.key, event.target.value)}
        />
      </label>
    );
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
          <button className="secondary-button" type="button" onClick={resetForm}>
            Yeni başvuru gönder
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
            <h1>{form?.title ?? "Başvuru Formu"}</h1>
            <p>{form?.description ?? statusMessage}</p>
          </div>
        </header>

        {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

        {form ? (
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
              <h2>Sorular</h2>
              <div className="form-grid">{form.questions.map(renderQuestion)}</div>
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
        ) : null}
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
