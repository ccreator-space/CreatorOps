import { Check, Eye, MessageSquareText, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ListPageTemplate, type ListColumn } from "../../components/ListPageTemplate";
import { Modal } from "../../components/Modal";
import type { UserSummary } from "../../lib/mock-data";
import { useAuth } from "../auth/AuthProvider";
import {
  ContentSheet,
  type ContentAttachment,
  type EditableContentPost
} from "../calendar/ContentSheet";
import { PostPreviewModal } from "./PostPreviewModal";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type PostStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "revision_requested";

type StatusFilter = PostStatus | "all";
type ReviewAction = "approve" | "reject" | "request_revision";

export type ContentPost = EditableContentPost & {
  status: PostStatus;
  author: UserSummary;
  latestReview?: {
    note?: string;
  };
  attachments: ContentAttachment[];
};

type PostsResponse = {
  data: ContentPost[];
};

const statusLabels: Record<PostStatus, string> = {
  draft: "Draft",
  pending_review: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  revision_requested: "Revision requested"
};

const filterLabels: Record<StatusFilter, string> = {
  all: "All",
  ...statusLabels
};

const platformLabels: Record<ContentPost["platform"], string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram"
};

function canUserEdit(post: ContentPost) {
  return post.status !== "approved";
}

function resolveAvatarUrl(user: UserSummary) {
  if (!user.avatarUrl || user.avatarUrl.startsWith("http://") || user.avatarUrl.startsWith("https://")) {
    return user.avatarUrl ?? "";
  }

  return user.avatarUrl.startsWith("/uploads") ? `${apiUrl}${user.avatarUrl}` : user.avatarUrl;
}

export function ContentListPage() {
  const { authHeaders, viewer, visibleUsers } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    viewer?.role === "admin" ? "pending_review" : "all"
  );
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [statusMessage, setStatusMessage] = useState("Loading content.");
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [revisionPost, setRevisionPost] = useState<ContentPost | null>(null);
  const [previewPost, setPreviewPost] = useState<ContentPost | null>(null);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [deletePost, setDeletePost] = useState<ContentPost | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");

  const isAdmin = viewer?.role === "admin";

  async function loadPosts() {
    if (!viewer) {
      return;
    }

    setStatusMessage("Loading content.");

    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const query = params.toString();
      const response = await fetch(`${apiUrl}/posts${query ? `?${query}` : ""}`, {
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Content could not be loaded.");
      }

      const payload = (await response.json()) as PostsResponse;
      setPosts(payload.data);
      setStatusMessage("");
    } catch {
      setPosts([]);
      setStatusMessage("Content could not be loaded.");
    }
  }

  useEffect(() => {
    void loadPosts();
  }, [statusFilter, viewer?.id]);

  const handleReview = async (postId: string, action: ReviewAction, note?: string) => {
    if (!viewer) {
      return;
    }

    setActivePostId(postId);
    setStatusMessage("Saving action.");

    try {
      const response = await fetch(`${apiUrl}/posts/${postId}/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          action,
          note: note || undefined
        })
      });

      if (!response.ok) {
        throw new Error("Action could not be saved.");
      }

      toast.success("Action saved.");
      setStatusMessage("Action saved.");
      setRevisionPost(null);
      setRevisionNote("");
      await loadPosts();
    } catch {
      toast.error("Action could not be saved.");
      setStatusMessage("Action could not be saved.");
    } finally {
      setActivePostId(null);
    }
  };

  const handleDelete = async () => {
    if (!deletePost) {
      return;
    }

    setActivePostId(deletePost.id);
    setStatusMessage("Deleting content.");

    try {
      const response = await fetch(`${apiUrl}/posts/${deletePost.id}`, {
        method: "DELETE",
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Content could not be deleted.");
      }

      toast.success("Content deleted.");
      setDeletePost(null);
      setStatusMessage("Content deleted.");
      await loadPosts();
    } catch {
      toast.error("Content could not be deleted.");
      setStatusMessage("Content could not be deleted.");
    } finally {
      setActivePostId(null);
    }
  };

  const openCreateSheet = () => {
    setEditingPost(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (post: ContentPost) => {
    setEditingPost(post);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setEditingPost(null);
  };

  const submitRevisionRequest = () => {
    if (!revisionPost) {
      return;
    }

    const note = revisionNote.trim();

    if (!note) {
      toast.error("Add a note before requesting a revision.");
      return;
    }

    void handleReview(revisionPost.id, "request_revision", note);
  };

  const columns = useMemo<Array<ListColumn<ContentPost>>>(
    () => {
      const baseColumns: Array<ListColumn<ContentPost>> = [
        {
          key: "content",
          header: "Content",
          render: (post) => (
            <div className="table-primary">
              <strong className="table-title-only">{post.title}</strong>
            </div>
          )
        },
        ...(isAdmin
          ? [
              {
                key: "author",
                header: "Submitted by",
                width: "116px",
                render: (post: ContentPost) => (
                  <img
                    className="submitted-avatar"
                    alt={post.author.name}
                    src={resolveAvatarUrl(post.author)}
                    title={post.author.name}
                  />
                )
              }
            ]
          : []),
        {
          key: "date",
          header: "Date",
          width: "130px",
          render: (post) => post.scheduledDate
        },
        {
          key: "platform",
          header: "Platform",
          width: "120px",
          render: (post) => platformLabels[post.platform]
        },
        {
          key: "status",
          header: "Status",
          width: "92px",
          render: (post) => (
            <span
              className={`status-dot is-${post.status}`}
              title={statusLabels[post.status]}
              aria-label={statusLabels[post.status]}
            />
          )
        }
      ];

      if (!isAdmin) {
        baseColumns.push({
          key: "note",
          header: "Revision Note",
          render: (post) => post.latestReview?.note ?? "-"
        });
      }

      baseColumns.push({
        key: "actions",
        header: "",
        align: "right",
        width: isAdmin ? "272px" : "144px",
        render: (post) => (
          <div className="table-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Preview post"
              onClick={() => setPreviewPost(post)}
            >
              <Eye size={18} />
            </button>
            {isAdmin ? (
              <>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Approve"
                  disabled={activePostId === post.id}
                  onClick={() => handleReview(post.id, "approve")}
                >
                  <Check size={18} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Request revision"
                  disabled={activePostId === post.id}
                  onClick={() => {
                    setRevisionPost(post);
                    setRevisionNote(post.latestReview?.note ?? "");
                  }}
                >
                  <MessageSquareText size={18} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Reject"
                  disabled={activePostId === post.id}
                  onClick={() => handleReview(post.id, "reject")}
                >
                  <X size={18} />
                </button>
              </>
            ) : null}
            {isAdmin || canUserEdit(post) ? (
              <>
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Edit"
                  disabled={activePostId === post.id}
                  onClick={() => openEditSheet(post)}
                >
                  <Pencil size={18} />
                </button>
                <button
                  className="icon-button is-danger"
                  type="button"
                  aria-label="Delete"
                  disabled={activePostId === post.id}
                  onClick={() => setDeletePost(post)}
                >
                  <Trash2 size={18} />
                </button>
              </>
            ) : (
              "-"
            )}
          </div>
        )
      });

      return baseColumns;
    },
    [activePostId, isAdmin]
  );

  if (!viewer) {
    return null;
  }

  return (
    <>
      <ListPageTemplate
        title="Content"
        actions={
          <>
            <label className="filter-control">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              >
                {Object.entries(filterLabels).map(([status, label]) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="button" onClick={openCreateSheet}>
              <Plus size={18} />
              Add content
            </button>
          </>
        }
        columns={columns}
        rows={posts}
        getRowId={(post) => post.id}
        statusMessage={statusMessage}
        emptyMessage="No content matches this filter."
      />

      <ContentSheet
        isOpen={isSheetOpen}
        authHeaders={authHeaders}
        users={visibleUsers}
        editingPost={editingPost}
        initialUserId={isAdmin ? undefined : viewer.id}
        onClose={closeSheet}
        onSaved={loadPosts}
        onStatusChange={setStatusMessage}
      />

      {revisionPost ? (
        <Modal
          title="Request revision"
          onClose={() => {
            setRevisionPost(null);
            setRevisionNote("");
          }}
          footer={
            <>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setRevisionPost(null);
                  setRevisionNote("");
                }}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={activePostId === revisionPost.id}
                onClick={submitRevisionRequest}
              >
                Request revision
              </button>
            </>
          }
        >
          <div className="modal-form">
            <label>
              Revision note
              <textarea
                rows={5}
                value={revisionNote}
                onChange={(event) => setRevisionNote(event.target.value)}
                placeholder="Describe the changes you want from the creator"
              />
            </label>
          </div>
        </Modal>
      ) : null}

      {deletePost ? (
        <Modal
          title="Delete content"
          onClose={() => setDeletePost(null)}
          footer={
            <>
              <button className="secondary-button" type="button" onClick={() => setDeletePost(null)}>
                Cancel
              </button>
              <button
                className="primary-button is-danger"
                type="button"
                disabled={activePostId === deletePost.id}
                onClick={handleDelete}
              >
                Delete
              </button>
            </>
          }
        >
          <p className="confirm-copy">
            "{deletePost.title}" and its attached media will be deleted.
          </p>
        </Modal>
      ) : null}

      {previewPost ? (
        <PostPreviewModal post={previewPost} onClose={() => setPreviewPost(null)} />
      ) : null}
    </>
  );
}
