import { Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { ListPageTemplate, type ListColumn } from "../../components/ListPageTemplate";
import { Modal } from "../../components/Modal";
import type { UserSummary } from "../../lib/mock-data";
import { useAuth } from "../auth/AuthProvider";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type Series = {
  id: string;
  slug: string;
  title: string;
  description: string;
  isActive: boolean;
  legacyType?: string | null;
  assignedUsers: UserSummary[];
  createdAt: string;
  updatedAt: string;
};

type SeriesResponse = {
  data: Series[];
};

type SingleSeriesResponse = {
  data: Series;
};

type SeriesDraft = {
  id?: string;
  title: string;
  slug: string;
  description: string;
  isActive: boolean;
  userIds: string[];
};

const emptyDraft: SeriesDraft = {
  title: "",
  slug: "",
  description: "",
  isActive: true,
  userIds: []
};

function createSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function SeriesAssignmentsPage() {
  const { authHeaders, users, viewer } = useAuth();
  const [series, setSeries] = useState<Series[]>([]);
  const [draft, setDraft] = useState<SeriesDraft | null>(null);
  const [deleteSeries, setDeleteSeries] = useState<Series | null>(null);
  const [, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const assignableUsers = users.filter((user) => user.role === "user" && user.isActive);

  async function loadSeries() {
    if (!viewer || viewer.role !== "admin") {
      return;
    }

    setIsLoading(true);
    setStatusMessage("");

    try {
      const response = await fetch(`${apiUrl}/series`, {
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Series could not be loaded.");
      }

      const payload = (await response.json()) as SeriesResponse;
      setSeries(payload.data);
      setStatusMessage("");
    } catch {
      setSeries([]);
      toast.error("Series could not be loaded.");
      setStatusMessage("");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSeries();
  }, [viewer?.id]);

  const openCreateModal = () => {
    setDraft(emptyDraft);
  };

  const openEditModal = (item: Series) => {
    setDraft({
      id: item.id,
      title: item.title,
      slug: item.slug,
      description: item.description,
      isActive: item.isActive,
      userIds: item.assignedUsers.map((user) => user.id)
    });
  };

  const updateDraft = (patch: Partial<SeriesDraft>) => {
    setDraft((currentDraft) => (currentDraft ? { ...currentDraft, ...patch } : currentDraft));
  };

  const toggleUser = (userId: string) => {
    setDraft((currentDraft) => {
      if (!currentDraft) {
        return currentDraft;
      }

      const nextUserIds = currentDraft.userIds.includes(userId)
        ? currentDraft.userIds.filter((selectedUserId) => selectedUserId !== userId)
        : [...currentDraft.userIds, userId];

      return {
        ...currentDraft,
        userIds: nextUserIds
      };
    });
  };

  const saveSeries = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!draft) {
      return;
    }

    const title = draft.title.trim();
    const description = draft.description.trim();
    const slug = (draft.slug.trim() || createSlug(title)).toLowerCase();

    if (!title || !description || !slug) {
      toast.error("Title, slug, and description are required.");
      return;
    }

    setIsSaving(true);
    setStatusMessage(draft.id ? "Updating series." : "Creating series.");

    try {
      const response = await fetch(draft.id ? `${apiUrl}/series/${draft.id}` : `${apiUrl}/series`, {
        method: draft.id ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          title,
          description,
          slug,
          isActive: draft.isActive,
          userIds: draft.userIds
        })
      });

      if (!response.ok) {
        throw new Error("Series could not be saved.");
      }

      const payload = (await response.json()) as SingleSeriesResponse;
      setSeries((currentSeries) =>
        draft.id
          ? currentSeries.map((item) => (item.id === payload.data.id ? payload.data : item))
          : [...currentSeries, payload.data]
      );
      toast.success(draft.id ? "Series updated." : "Series created.");
      setStatusMessage(draft.id ? "Series updated." : "Series created.");
      setDraft(null);
    } catch {
      toast.error("Series could not be saved.");
      setStatusMessage("Series could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSeries = async () => {
    if (!deleteSeries) {
      return;
    }

    setIsSaving(true);
    setStatusMessage("Deleting series.");

    try {
      const response = await fetch(`${apiUrl}/series/${deleteSeries.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Series could not be deleted.");
      }

      setSeries((currentSeries) => currentSeries.filter((item) => item.id !== deleteSeries.id));
      toast.success("Series deleted.");
      setStatusMessage("Series deleted.");
      setDeleteSeries(null);
    } catch {
      toast.error("Series could not be deleted.");
      setStatusMessage("Series could not be deleted.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<Array<ListColumn<Series>>>(
    () => [
      {
        key: "series",
        header: "Series",
        render: (item) => (
          <div className="table-primary">
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </div>
        )
      },
      {
        key: "slug",
        header: "Slug",
        width: "180px",
        render: (item) => `/submit/${item.slug}`
      },
      {
        key: "users",
        header: "Assigned Users",
        render: (item) => (
          <div className="assignment-picker">
            {item.assignedUsers.length
              ? item.assignedUsers.map((user) => <span key={user.id}>{user.name}</span>)
              : "-"}
          </div>
        )
      },
      {
        key: "status",
        header: "Status",
        width: "120px",
        render: (item) => (
          <span className={`status-pill ${item.isActive ? "is-approved" : "is-archived"}`}>
            {item.isActive ? "Active" : "Inactive"}
          </span>
        )
      },
      {
        key: "actions",
        header: "",
        align: "right",
        width: "96px",
        render: (item) => (
          <div className="table-actions">
            <button className="icon-button" type="button" aria-label="Edit series" onClick={() => openEditModal(item)}>
              <Pencil size={18} />
            </button>
            <button className="icon-button is-danger" type="button" aria-label="Delete series" onClick={() => setDeleteSeries(item)}>
              <Trash2 size={18} />
            </button>
          </div>
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
        title="Series"
        actions={
          <button className="primary-button" type="button" onClick={openCreateModal}>
            <Plus size={18} />
            Add series
          </button>
        }
        columns={columns}
        rows={series}
        getRowId={(item) => item.id}
        isLoading={isLoading}
        emptyMessage="No series yet."
      />

      {draft ? (
        <Modal
          title={draft.id ? "Edit series" : "Add series"}
          onClose={() => setDraft(null)}
          footer={
            <>
              <button className="secondary-button" type="button" onClick={() => setDraft(null)}>
                Cancel
              </button>
              <button className="primary-button" type="submit" form="series-form" disabled={isSaving}>
                {draft.id ? "Save changes" : "Create series"}
              </button>
            </>
          }
        >
          <form className="modal-form" id="series-form" onSubmit={saveSeries}>
            <label>
              Title
              <input
                value={draft.title}
                onChange={(event) => {
                  const title = event.target.value;
                  updateDraft({
                    title,
                    slug: draft.id ? draft.slug : createSlug(title)
                  });
                }}
              />
            </label>
            <label>
              Slug
              <input value={draft.slug} onChange={(event) => updateDraft({ slug: createSlug(event.target.value) })} />
            </label>
            <label>
              Status
              <select
                value={draft.isActive ? "true" : "false"}
                onChange={(event) => updateDraft({ isActive: event.target.value === "true" })}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            <label>
              Description
              <textarea
                rows={4}
                value={draft.description}
                onChange={(event) => updateDraft({ description: event.target.value })}
              />
            </label>
            <div className="modal-field">
              <strong>Assigned users</strong>
              <div className="assignment-picker">
                {assignableUsers.map((user) => (
                  <label key={user.id}>
                    <input
                      type="checkbox"
                      checked={draft.userIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                    {user.name}
                  </label>
                ))}
              </div>
            </div>
          </form>
        </Modal>
      ) : null}

      {deleteSeries ? (
        <Modal
          title="Delete series"
          onClose={() => setDeleteSeries(null)}
          footer={
            <>
              <button className="secondary-button" type="button" onClick={() => setDeleteSeries(null)}>
                Cancel
              </button>
              <button className="primary-button is-danger" type="button" disabled={isSaving} onClick={handleDeleteSeries}>
                Delete
              </button>
            </>
          }
        >
          <p className="confirm-copy">
            “{deleteSeries.title}” and its public form will be deleted. Existing submissions will stay in the archive without this series link.
          </p>
        </Modal>
      ) : null}
    </>
  );
}
