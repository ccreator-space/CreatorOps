import { Eye, ImageIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ListPageTemplate, type ListColumn } from "../../components/ListPageTemplate";
import { MediaCarouselModal } from "../../components/MediaCarouselModal";
import { Modal } from "../../components/Modal";
import type { UserSummary } from "../../lib/mock-data";
import { useAuth } from "../auth/AuthProvider";
import type { SubmissionForm, SubmissionFormQuestion } from "../forms/form-types";
import {
  submissionConfigs,
  submissionStatusLabels,
  submissionTypeLabels,
  type SubmissionStatus,
  type SubmissionType
} from "./submission-config";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type SubmissionAttachment = {
  id: string;
  type: "image" | "pdf";
  originalName: string;
  mimeType: string;
  questionKey?: string | null;
  width?: number | null;
  height?: number | null;
  publicUrl: string;
};

type Submission = {
  id: string;
  type: SubmissionType;
  status: SubmissionStatus;
  submitterFirstName: string;
  submitterLastName: string;
  submitterEmail: string;
  submitterLinkedin: string;
  note?: string | null;
  payload: Record<string, unknown>;
  form?: SubmissionForm | null;
  assignedTo?: UserSummary | null;
  createdAt: string;
  attachments: SubmissionAttachment[];
};

type SubmissionsResponse = {
  data: Submission[];
};

type SubmissionResponse = {
  data: Submission;
};

const statusOptions: SubmissionStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "approved",
  "rejected",
  "archived"
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getSubmitterName(submission: Submission) {
  return `${submission.submitterFirstName} ${submission.submitterLastName}`;
}

function stringifyPayloadValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return value ? String(value) : "-";
}

function getFallbackQuestions(submission: Submission): SubmissionFormQuestion[] {
  return submissionConfigs[submission.type].fields.map((field, index) => ({
    id: field.key,
    key: field.key,
    label: field.label,
    type: field.type === "textarea" ? "textarea" : "text",
    required: Boolean(field.required),
    sortOrder: index
  }));
}

export function SubmissionsPage() {
  const { authHeaders, users, viewer } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<Submission | null>(null);
  const [mediaSubmission, setMediaSubmission] = useState<Submission | null>(null);
  const [statusMessage, setStatusMessage] = useState("Başvurular yükleniyor.");
  const [isSaving, setIsSaving] = useState(false);
  const isAdmin = viewer?.role === "admin";
  const assignableUsers = users.filter((user) => user.role === "user");

  async function loadSubmissions() {
    if (!viewer) {
      return;
    }

    setStatusMessage("Başvurular yükleniyor.");

    try {
      const response = await fetch(`${apiUrl}/submissions`, {
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Başvurular alınamadı.");
      }

      const payload = (await response.json()) as SubmissionsResponse;
      setSubmissions(payload.data);
      setStatusMessage("");
    } catch {
      setSubmissions([]);
      setStatusMessage("Başvurular alınamadı.");
    }
  }

  useEffect(() => {
    void loadSubmissions();
  }, [viewer?.id]);

  const updateStatus = async (submissionId: string, status: SubmissionStatus) => {
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          status
        })
      });

      if (!response.ok) {
        throw new Error("Durum güncellenemedi.");
      }

      const payload = (await response.json()) as SubmissionResponse;
      setActiveSubmission(payload.data);
      setSubmissions((currentSubmissions) =>
        currentSubmissions.map((submission) =>
          submission.id === payload.data.id ? payload.data : submission
        )
      );
      toast.success("Durum güncellendi.");
    } catch {
      toast.error("Durum güncellenemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const assignSubmission = async (submissionId: string, assignedToId: string | null) => {
    setIsSaving(true);

    try {
      const response = await fetch(`${apiUrl}/submissions/${submissionId}/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          assignedToId
        })
      });

      if (!response.ok) {
        throw new Error("Atama güncellenemedi.");
      }

      const payload = (await response.json()) as SubmissionResponse;
      setActiveSubmission(payload.data);
      setSubmissions((currentSubmissions) =>
        currentSubmissions.map((submission) =>
          submission.id === payload.data.id ? payload.data : submission
        )
      );
      toast.success("Atama güncellendi.");
    } catch {
      toast.error("Atama güncellenemedi.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<Array<ListColumn<Submission>>>(
    () => [
      {
        key: "series",
        header: "Seri",
        width: "180px",
        render: (submission) => submissionTypeLabels[submission.type]
      },
      {
        key: "submitter",
        header: "Gönderen",
        render: (submission) => (
          <div className="table-primary">
            <strong>{getSubmitterName(submission)}</strong>
            <span>{submission.submitterEmail}</span>
          </div>
        )
      },
      {
        key: "date",
        header: "Tarih",
        width: "180px",
        render: (submission) => formatDate(submission.createdAt)
      },
      {
        key: "assigned",
        header: "Atanan",
        width: "160px",
        render: (submission) => submission.assignedTo?.name ?? "-"
      },
      {
        key: "media",
        header: "Medya",
        width: "120px",
        render: (submission) =>
          submission.attachments.length ? (
            <button className="media-summary" type="button" onClick={() => setMediaSubmission(submission)}>
              {submission.attachments.slice(0, 3).map((attachment) =>
                attachment.type === "image" ? (
                  <img
                    alt={attachment.originalName}
                    key={attachment.id}
                    src={`${apiUrl}${attachment.publicUrl}`}
                  />
                ) : (
                  <span className="media-file-type is-small" key={attachment.id}>
                    PDF
                  </span>
                )
              )}
              {submission.attachments.length > 3 ? (
                <span className="media-count">+{submission.attachments.length - 3}</span>
              ) : null}
            </button>
          ) : (
            "-"
          )
      },
      {
        key: "status",
        header: "Durum",
        width: "140px",
        render: (submission) => (
          <span className={`status-pill is-${submission.status}`}>
            {submissionStatusLabels[submission.status]}
          </span>
        )
      },
      {
        key: "actions",
        header: "",
        align: "right",
        width: "52px",
        render: (submission) => (
          <button
            className="icon-button"
            type="button"
            aria-label="Başvuruyu görüntüle"
            onClick={() => setActiveSubmission(submission)}
          >
            <Eye size={18} />
          </button>
        )
      }
    ],
    []
  );

  return (
    <>
      <ListPageTemplate
        title="Başvurular"
        columns={columns}
        rows={submissions}
        getRowId={(submission) => submission.id}
        statusMessage={statusMessage}
        emptyMessage="Henüz başvuru yok."
      />

      {activeSubmission ? (
        <Modal title={getSubmitterName(activeSubmission)} onClose={() => setActiveSubmission(null)} size="wide">
          <div className="submission-detail">
            <div className="submission-detail-summary">
              <span className="status-pill is-assigned">
                {submissionTypeLabels[activeSubmission.type]}
              </span>
              <span className={`status-pill is-${activeSubmission.status}`}>
                {submissionStatusLabels[activeSubmission.status]}
              </span>
              <a href={activeSubmission.submitterLinkedin} rel="noreferrer" target="_blank">
                LinkedIn
              </a>
              <a href={`mailto:${activeSubmission.submitterEmail}`}>
                {activeSubmission.submitterEmail}
              </a>
            </div>

            <div className="submission-management">
              <label>
                Durum
                <select
                  value={activeSubmission.status}
                  disabled={isSaving}
                  onChange={(event) =>
                    updateStatus(activeSubmission.id, event.target.value as SubmissionStatus)
                  }
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {submissionStatusLabels[status]}
                    </option>
                  ))}
                </select>
              </label>

              {isAdmin ? (
                <label>
                  Atanan kişi
                  <select
                    value={activeSubmission.assignedTo?.id ?? ""}
                    disabled={isSaving}
                    onChange={(event) =>
                      assignSubmission(activeSubmission.id, event.target.value || null)
                    }
                  >
                    <option value="">Atanmamış</option>
                    {assignableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <div className="submission-answer-grid">
              {(activeSubmission.form?.questions ?? getFallbackQuestions(activeSubmission)).map((question) => {
                const mediaCount = activeSubmission.attachments.filter(
                  (attachment) => attachment.questionKey === question.key
                ).length;

                return (
                  <div className="submission-answer" key={question.key}>
                    <strong>{question.label}</strong>
                    <p>
                      {question.type === "media"
                        ? mediaCount
                          ? `${mediaCount} medya dosyası`
                          : "-"
                        : stringifyPayloadValue(activeSubmission.payload[question.key])}
                    </p>
                  </div>
                );
              })}
              {activeSubmission.note ? (
                <div className="submission-answer">
                  <strong>Ek not</strong>
                  <p>{activeSubmission.note}</p>
                </div>
              ) : null}
            </div>

            {activeSubmission.attachments.length ? (
              <button className="secondary-button" type="button" onClick={() => setMediaSubmission(activeSubmission)}>
                <ImageIcon size={16} />
                Medyayı görüntüle
              </button>
            ) : null}
          </div>
        </Modal>
      ) : null}

      {mediaSubmission ? (
        <MediaCarouselModal
          title={getSubmitterName(mediaSubmission)}
          items={mediaSubmission.attachments.map((attachment) => ({
            id: attachment.id,
            type: attachment.type,
            originalName: attachment.originalName,
            mimeType: attachment.mimeType,
            sourceUrl: `${apiUrl}${attachment.publicUrl}`,
            width: attachment.width,
            height: attachment.height
          }))}
          onClose={() => setMediaSubmission(null)}
        />
      ) : null}
    </>
  );
}
