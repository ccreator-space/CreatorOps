import { Lightbulb, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState, type FormEvent } from "react";
import type { UserSummary } from "../../lib/mock-data";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export type EditableContentIdea = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  createdBy: UserSummary;
  createdAt: string;
  updatedAt: string;
};

type ContentIdeaSheetProps = {
  isOpen: boolean;
  authHeaders: () => Record<string, string>;
  idea?: EditableContentIdea | null;
  initialDate?: string;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
  onStatusChange: (message: string) => void;
};

type FormState = {
  date: string;
  title: string;
  description: string;
};

const emptyForm: FormState = {
  date: "",
  title: "",
  description: ""
};

export function ContentIdeaSheet({
  isOpen,
  authHeaders,
  idea,
  initialDate,
  canEdit,
  onClose,
  onSaved,
  onStatusChange
}: ContentIdeaSheetProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = Boolean(idea);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(
      idea
        ? {
            date: idea.date,
            title: idea.title,
            description: idea.description ?? ""
          }
        : {
            ...emptyForm,
            date: initialDate ?? ""
          }
    );
    setIsSaving(false);
    setIsDeleting(false);
  }, [idea?.id, initialDate, isOpen]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canEdit) {
      return;
    }

    if (!form.date || !form.title.trim()) {
      toast.error("Date and title are required.");
      onStatusChange("Date and title are required.");
      return;
    }

    setIsSaving(true);
    onStatusChange(isEditing ? "Updating content idea." : "Saving content idea.");

    try {
      const response = await fetch(
        isEditing ? `${apiUrl}/content-ideas/${idea?.id}` : `${apiUrl}/content-ideas`,
        {
          method: isEditing ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...authHeaders()
          },
          body: JSON.stringify({
            date: form.date,
            title: form.title.trim(),
            description: form.description.trim()
          })
        }
      );

      if (!response.ok) {
        throw new Error("Content idea could not be saved.");
      }

      toast.success(isEditing ? "Content idea updated." : "Content idea added.");
      onStatusChange(isEditing ? "Content idea updated." : "Content idea added.");
      onSaved();
      onClose();
    } catch {
      toast.error("Content idea could not be saved.");
      onStatusChange("Content idea could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canEdit || !idea || isDeleting) {
      return;
    }

    setIsDeleting(true);
    onStatusChange("Deleting content idea.");

    try {
      const response = await fetch(`${apiUrl}/content-ideas/${idea.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Content idea could not be deleted.");
      }

      toast.success("Content idea deleted.");
      onStatusChange("Content idea deleted.");
      onSaved();
      onClose();
    } catch {
      toast.error("Content idea could not be deleted.");
      onStatusChange("Content idea could not be deleted.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="sheet-backdrop" role="presentation">
      <aside className="sheet" aria-label={isEditing ? "Content idea details" : "New content idea form"}>
        <header className="sheet-header">
          <div className="sheet-title-row">
            <span className="sheet-title-icon" aria-hidden="true">
              <Lightbulb size={18} />
            </span>
            <h2>{isEditing ? (canEdit ? "Edit content idea" : "Content idea") : "New content idea"}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>

        {idea ? (
          <p className="sheet-meta">
            Added by {idea.createdBy.name} on {new Date(idea.createdAt).toLocaleDateString()}
          </p>
        ) : null}

        <form className="content-form" onSubmit={handleSubmit}>
          <label>
            Date
            <input
              name="date"
              readOnly={!canEdit}
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  date: event.target.value
                }))
              }
            />
          </label>

          <label>
            Title
            <input
              name="title"
              placeholder="Idea title"
              readOnly={!canEdit}
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
            Description
            <textarea
              name="description"
              placeholder="Notes, angle, hook, or context"
              readOnly={!canEdit}
              rows={8}
              value={form.description}
              onChange={(event) =>
                setForm((currentForm) => ({
                  ...currentForm,
                  description: event.target.value
                }))
              }
            />
          </label>

          {canEdit ? (
            <div className="sheet-actions">
              {isEditing ? (
                <button
                  className="secondary-button is-danger"
                  type="button"
                  onClick={handleDelete}
                  disabled={isSaving || isDeleting}
                >
                  <Trash2 size={16} />
                  {isDeleting ? "Deleting..." : "Delete"}
                </button>
              ) : null}
              <button className="primary-button" type="submit" disabled={isSaving || isDeleting}>
                {isSaving ? "Saving..." : isEditing ? "Save changes" : "Save idea"}
              </button>
            </div>
          ) : null}
        </form>
      </aside>
    </div>
  );
}
