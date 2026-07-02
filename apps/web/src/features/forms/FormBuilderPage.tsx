import { ArrowDown, ArrowUp, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ListPageTemplate, type ListColumn } from "../../components/ListPageTemplate";
import { Modal } from "../../components/Modal";
import { useAuth } from "../auth/AuthProvider";
import {
  type FormQuestionConfig,
  type FormQuestionType,
  type FormResponse,
  type FormsResponse,
  mediaMimeOptions,
  questionTypeLabels,
  type SubmissionForm,
  type SubmissionFormQuestion
} from "./form-types";
import {
  submissionTypeLabels,
  submissionTypes,
  type SubmissionType
} from "../submissions/submission-config";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const questionTypes: FormQuestionType[] = ["text", "textarea", "range", "media"];

function createQuestionDraft(): SubmissionFormQuestion {
  return {
    id: "new",
    key: `question_${Date.now().toString(36)}`,
    label: "Yeni soru",
    description: "",
    type: "text",
    required: false,
    sortOrder: 0,
    placeholder: "",
    helpText: "",
    config: {}
  };
}

function getDefaultConfig(type: FormQuestionType): FormQuestionConfig {
  if (type === "media") {
    return {
      maxFiles: 3,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "application/pdf"]
    };
  }

  if (type === "range") {
    return {
      min: 0,
      max: 10,
      step: 1
    };
  }

  return {};
}

export function FormBuilderPage() {
  const { authHeaders, viewer } = useAuth();
  const [forms, setForms] = useState<SubmissionForm[]>([]);
  const [editingForm, setEditingForm] = useState<SubmissionForm | null>(null);
  const [questionDraft, setQuestionDraft] = useState<SubmissionFormQuestion | null>(null);
  const [statusMessage, setStatusMessage] = useState("Formlar yükleniyor.");
  const [isSaving, setIsSaving] = useState(false);

  async function loadForms() {
    if (!viewer || viewer.role !== "admin") {
      return;
    }

    setStatusMessage("Formlar yükleniyor.");

    try {
      const response = await fetch(`${apiUrl}/forms`, {
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Formlar alınamadı.");
      }

      const payload = (await response.json()) as FormsResponse;
      setForms(payload.data);
      setStatusMessage("");
    } catch {
      setForms([]);
      setStatusMessage("Formlar alınamadı.");
    }
  }

  useEffect(() => {
    void loadForms();
  }, [viewer?.id]);

  const updateEditingForm = (patch: Partial<SubmissionForm>) => {
    setEditingForm((currentForm) => (currentForm ? { ...currentForm, ...patch } : currentForm));
  };

  const updateQuestionDraft = (patch: Partial<SubmissionFormQuestion>) => {
    setQuestionDraft((currentQuestion) => {
      if (!currentQuestion) {
        return currentQuestion;
      }

      const nextType = patch.type ?? currentQuestion.type;

      return {
        ...currentQuestion,
        ...patch,
        config: patch.type && patch.type !== currentQuestion.type ? getDefaultConfig(nextType) : patch.config ?? currentQuestion.config
      };
    });
  };

  const updateQuestionConfig = (patch: FormQuestionConfig) => {
    setQuestionDraft((currentQuestion) =>
      currentQuestion
        ? {
            ...currentQuestion,
            config: {
              ...(currentQuestion.config ?? {}),
              ...patch
            }
          }
        : currentQuestion
    );
  };

  const replaceForm = (form: SubmissionForm) => {
    setForms((currentForms) => currentForms.map((item) => (item.id === form.id ? form : item)));
    setEditingForm(form);
  };

  const saveForm = async () => {
    if (!editingForm) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/forms/${editingForm.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          title: editingForm.title,
          description: editingForm.description,
          slug: editingForm.slug,
          seriesType: editingForm.seriesType,
          isActive: editingForm.isActive
        })
      });

      if (!response.ok) {
        throw new Error("Form kaydedilemedi.");
      }

      const payload = (await response.json()) as FormResponse;
      replaceForm(payload.data);
      toast.success("Form kaydedildi.");
    } catch {
      toast.error("Form kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveQuestion = async () => {
    if (!editingForm || !questionDraft) {
      return;
    }

    setIsSaving(true);

    try {
      const isNewQuestion = questionDraft.id === "new";
      const response = await fetch(
        isNewQuestion
          ? `${apiUrl}/forms/${editingForm.id}/questions`
          : `${apiUrl}/forms/${editingForm.id}/questions/${questionDraft.id}`,
        {
          method: isNewQuestion ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify({
            key: questionDraft.key,
            label: questionDraft.label,
            description: questionDraft.description ?? "",
            type: questionDraft.type,
            required: questionDraft.required,
            placeholder: questionDraft.placeholder ?? "",
            helpText: questionDraft.helpText ?? "",
            config: questionDraft.config ?? {}
          })
        }
      );

      if (!response.ok) {
        throw new Error("Soru kaydedilemedi.");
      }

      const payload = (await response.json()) as FormResponse;
      replaceForm(payload.data);
      setQuestionDraft(null);
      toast.success("Soru kaydedildi.");
    } catch {
      toast.error("Soru kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuestion = async (question: SubmissionFormQuestion) => {
    if (!editingForm) {
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/forms/${editingForm.id}/questions/${question.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Soru silinemedi.");
      }

      const payload = (await response.json()) as FormResponse;
      replaceForm(payload.data);
      toast.success("Soru silindi.");
    } catch {
      toast.error("Soru silinemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const reorderQuestion = async (question: SubmissionFormQuestion, direction: "up" | "down") => {
    if (!editingForm) {
      return;
    }

    const currentIndex = editingForm.questions.findIndex((item) => item.id === question.id);
    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (nextIndex < 0 || nextIndex >= editingForm.questions.length) {
      return;
    }

    const questionIds = [...editingForm.questions.map((item) => item.id)];
    const [movedQuestionId] = questionIds.splice(currentIndex, 1);
    questionIds.splice(nextIndex, 0, movedQuestionId);

    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/forms/${editingForm.id}/questions/reorder`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          questionIds
        })
      });

      if (!response.ok) {
        throw new Error("Sıralama kaydedilemedi.");
      }

      const payload = (await response.json()) as FormResponse;
      replaceForm(payload.data);
    } catch {
      toast.error("Sıralama kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<Array<ListColumn<SubmissionForm>>>(
    () => [
      {
        key: "title",
        header: "Form",
        render: (form) => (
          <div className="table-primary">
            <strong>{form.title}</strong>
            <span>/submit/{form.slug}</span>
          </div>
        )
      },
      {
        key: "series",
        header: "Seri",
        width: "180px",
        render: (form) => submissionTypeLabels[form.seriesType]
      },
      {
        key: "questions",
        header: "Sorular",
        width: "100px",
        render: (form) => form.questions.length
      },
      {
        key: "status",
        header: "Durum",
        width: "120px",
        render: (form) => (
          <span className={`status-pill ${form.isActive ? "is-approved" : "is-archived"}`}>
            {form.isActive ? "Aktif" : "Pasif"}
          </span>
        )
      },
      {
        key: "actions",
        header: "",
        align: "right",
        width: "52px",
        render: (form) => (
          <button className="icon-button" type="button" aria-label="Formu düzenle" onClick={() => setEditingForm(form)}>
            <Pencil size={18} />
          </button>
        )
      }
    ],
    []
  );

  if (!viewer || viewer.role !== "admin") {
    return null;
  }

  return (
    <>
      <ListPageTemplate
        title="Formlar"
        columns={columns}
        rows={forms}
        getRowId={(form) => form.id}
        statusMessage={statusMessage}
        emptyMessage="Form yok."
      />

      {editingForm ? (
        <Modal title={editingForm.title} size="wide" onClose={() => setEditingForm(null)}>
          <div className={`form-builder ${questionDraft ? "has-editor" : ""}`}>
            <div className="form-builder-main">
              <section className="form-section">
                <h2>Form bilgileri</h2>
                <div className="form-grid">
                  <label>
                    Başlık
                    <input value={editingForm.title} onChange={(event) => updateEditingForm({ title: event.target.value })} />
                  </label>
                  <label>
                    Slug
                    <input value={editingForm.slug} onChange={(event) => updateEditingForm({ slug: event.target.value })} />
                  </label>
                  <label>
                    Seri
                    <select value={editingForm.seriesType} onChange={(event) => updateEditingForm({ seriesType: event.target.value as SubmissionType })}>
                      {submissionTypes.map((type) => (
                        <option key={type} value={type}>
                          {submissionTypeLabels[type]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Aktif
                    <select value={editingForm.isActive ? "true" : "false"} onChange={(event) => updateEditingForm({ isActive: event.target.value === "true" })}>
                      <option value="true">Aktif</option>
                      <option value="false">Pasif</option>
                    </select>
                  </label>
                  <label className="is-wide">
                    Açıklama
                    <textarea rows={3} value={editingForm.description} onChange={(event) => updateEditingForm({ description: event.target.value })} />
                  </label>
                </div>
                <button className="primary-button" type="button" disabled={isSaving} onClick={saveForm}>
                  <Save size={18} />
                  Formu kaydet
                </button>
              </section>

              <section className="form-section">
                <div className="section-heading">
                  <h2>Sorular</h2>
                  <button className="secondary-button" type="button" onClick={() => setQuestionDraft(createQuestionDraft())}>
                    <Plus size={16} />
                    Soru ekle
                  </button>
                </div>

                <div className="question-list">
                  {editingForm.questions.map((question, index) => (
                    <div className={`question-row ${questionDraft?.id === question.id ? "is-selected" : ""}`} key={question.id}>
                      <div>
                        <strong>{question.label}</strong>
                        <p>
                          {question.key} · {questionTypeLabels[question.type]}
                          {question.required ? " · Zorunlu" : ""}
                        </p>
                      </div>
                      <div className="table-actions">
                        <button className="icon-button" type="button" aria-label="Yukarı taşı" disabled={index === 0 || isSaving} onClick={() => reorderQuestion(question, "up")}>
                          <ArrowUp size={16} />
                        </button>
                        <button className="icon-button" type="button" aria-label="Aşağı taşı" disabled={index === editingForm.questions.length - 1 || isSaving} onClick={() => reorderQuestion(question, "down")}>
                          <ArrowDown size={16} />
                        </button>
                        <button className="icon-button" type="button" aria-label="Düzenle" onClick={() => setQuestionDraft(question)}>
                          <Pencil size={16} />
                        </button>
                        <button className="icon-button is-danger" type="button" aria-label="Sil" disabled={isSaving} onClick={() => deleteQuestion(question)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {questionDraft ? (
              <aside className="question-editor-panel">
                <div className="question-editor-header">
                  <div>
                    <h3>{questionDraft.id === "new" ? "Soru ekle" : "Soruyu düzenle"}</h3>
                    <p>{questionTypeLabels[questionDraft.type]}</p>
                  </div>
                  <button className="icon-button" type="button" aria-label="Editörü kapat" onClick={() => setQuestionDraft(null)}>
                    <X size={16} />
                  </button>
                </div>

                <div className="modal-form">
                  <label>
                    Soru anahtarı
                    <input value={questionDraft.key} onChange={(event) => updateQuestionDraft({ key: event.target.value })} />
                  </label>
                  <label>
                    Soru metni
                    <input value={questionDraft.label} onChange={(event) => updateQuestionDraft({ label: event.target.value })} />
                  </label>
                  <label>
                    Tip
                    <select value={questionDraft.type} onChange={(event) => updateQuestionDraft({ type: event.target.value as FormQuestionType })}>
                      {questionTypes.map((type) => (
                        <option key={type} value={type}>
                          {questionTypeLabels[type]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Zorunlu
                    <select value={questionDraft.required ? "true" : "false"} onChange={(event) => updateQuestionDraft({ required: event.target.value === "true" })}>
                      <option value="false">Hayır</option>
                      <option value="true">Evet</option>
                    </select>
                  </label>
                  <label>
                    Placeholder
                    <input value={questionDraft.placeholder ?? ""} onChange={(event) => updateQuestionDraft({ placeholder: event.target.value })} />
                  </label>
                  <label>
                    Yardım metni
                    <input value={questionDraft.helpText ?? ""} onChange={(event) => updateQuestionDraft({ helpText: event.target.value })} />
                  </label>

                  {questionDraft.type === "range" ? (
                    <div className="config-grid">
                      <label>
                        Min
                        <input type="number" value={questionDraft.config?.min ?? 0} onChange={(event) => updateQuestionConfig({ min: Number(event.target.value) })} />
                      </label>
                      <label>
                        Max
                        <input type="number" value={questionDraft.config?.max ?? 10} onChange={(event) => updateQuestionConfig({ max: Number(event.target.value) })} />
                      </label>
                      <label>
                        Step
                        <input type="number" value={questionDraft.config?.step ?? 1} onChange={(event) => updateQuestionConfig({ step: Number(event.target.value) })} />
                      </label>
                    </div>
                  ) : null}

                  {questionDraft.type === "media" ? (
                    <div className="media-config">
                      <label>
                        Maksimum dosya
                        <input type="number" value={questionDraft.config?.maxFiles ?? 1} onChange={(event) => updateQuestionConfig({ maxFiles: Number(event.target.value) })} />
                      </label>
                      <label>
                        İzin verilen medya tipleri
                        <select
                          className="multi-select-box"
                          multiple
                          value={questionDraft.config?.allowedMimeTypes ?? []}
                          onChange={(event) =>
                            updateQuestionConfig({
                              allowedMimeTypes: Array.from(event.currentTarget.selectedOptions).map((option) => option.value)
                            })
                          }
                        >
                          {mediaMimeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <div className="selected-mime-list">
                        {(questionDraft.config?.allowedMimeTypes ?? []).map((mimeType) => {
                          const option = mediaMimeOptions.find((item) => item.value === mimeType);

                          return (
                            <span key={mimeType}>
                              {option?.label ?? mimeType}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="question-editor-actions">
                    <button className="secondary-button" type="button" onClick={() => setQuestionDraft(null)}>
                      Vazgeç
                    </button>
                    <button className="primary-button" type="button" disabled={isSaving} onClick={saveQuestion}>
                      Kaydet
                    </button>
                  </div>
                </div>
              </aside>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </>
  );
}
