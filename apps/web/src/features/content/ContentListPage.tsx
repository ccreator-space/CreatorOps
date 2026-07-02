import { Check, MessageSquareText, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ListPageTemplate, type ListColumn } from "../../components/ListPageTemplate";
import { Modal } from "../../components/Modal";
import { useAuth } from "../auth/AuthProvider";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type PostStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "revision_requested";

type ReviewAction = "approve" | "reject" | "request_revision";

type AdminPost = {
  id: string;
  assigneeId: string;
  scheduledDate: string;
  platform: "linkedin" | "instagram";
  title: string;
  content: string;
  status: PostStatus;
  author: {
    name: string;
  };
  latestReview?: {
    note?: string;
  };
};

type PostsResponse = {
  data: AdminPost[];
};

const statusLabels: Record<PostStatus, string> = {
  draft: "Taslak",
  pending_review: "Onay bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  revision_requested: "Revize istendi"
};

const platformLabels: Record<AdminPost["platform"], string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram"
};

export function ContentListPage() {
  const { authHeaders, viewer } = useAuth();
  const [statusFilter, setStatusFilter] = useState<PostStatus>("pending_review");
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [statusMessage, setStatusMessage] = useState("İçerikler yükleniyor.");
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [revisionPost, setRevisionPost] = useState<AdminPost | null>(null);
  const [revisionNote, setRevisionNote] = useState("");

  async function loadPosts() {
    if (!viewer) {
      return;
    }

    setStatusMessage("İçerikler yükleniyor.");

    try {
      const response = await fetch(`${apiUrl}/posts?status=${statusFilter}`, {
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("İçerikler alınamadı.");
      }

      const payload = (await response.json()) as PostsResponse;
      setPosts(payload.data);
      setStatusMessage("");
    } catch {
      setPosts([]);
      setStatusMessage("İçerikler alınamadı.");
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
    setStatusMessage("İşlem kaydediliyor.");

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
        throw new Error("İşlem kaydedilemedi.");
      }

      toast.success("İşlem kaydedildi.");
      setStatusMessage("İşlem kaydedildi.");
      setRevisionPost(null);
      setRevisionNote("");
      await loadPosts();
    } catch {
      toast.error("İşlem kaydedilemedi.");
      setStatusMessage("İşlem kaydedilemedi.");
    } finally {
      setActivePostId(null);
    }
  };

  const submitRevisionRequest = () => {
    if (!revisionPost) {
      return;
    }

    const note = revisionNote.trim();

    if (!note) {
      toast.error("Revize istemek için not gir.");
      return;
    }

    void handleReview(revisionPost.id, "request_revision", note);
  };

  const columns = useMemo<Array<ListColumn<AdminPost>>>(
    () => [
      {
        key: "content",
        header: "İçerik",
        render: (post) => (
          <div className="table-primary">
            <strong>{post.title}</strong>
            <span>{post.content}</span>
          </div>
        )
      },
      {
        key: "author",
        header: "Gönderen",
        width: "170px",
        render: (post) => post.author.name
      },
      {
        key: "date",
        header: "Tarih",
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
        header: "Durum",
        width: "150px",
        render: (post) => <span className={`status-pill is-${post.status}`}>{statusLabels[post.status]}</span>
      },
      {
        key: "actions",
        header: "",
        align: "right",
        width: "132px",
        render: (post) => (
          <div className="table-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Onayla"
              disabled={activePostId === post.id}
              onClick={() => handleReview(post.id, "approve")}
            >
              <Check size={18} />
            </button>
            <button
              className="icon-button"
              type="button"
              aria-label="Revize iste"
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
              aria-label="Reddet"
              disabled={activePostId === post.id}
              onClick={() => handleReview(post.id, "reject")}
            >
              <X size={18} />
            </button>
          </div>
        )
      }
    ],
    [activePostId]
  );

  if (!viewer) {
    return null;
  }

  return (
    <>
      <ListPageTemplate
        title="İçerikler"
        actions={
          <label className="filter-control">
            Durum
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as PostStatus)}
            >
              {Object.entries(statusLabels).map(([status, label]) => (
                <option key={status} value={status}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        }
        columns={columns}
        rows={posts}
        getRowId={(post) => post.id}
        statusMessage={statusMessage}
        emptyMessage="Bu filtrede içerik yok."
      />

      {revisionPost ? (
        <Modal
          title="Revize iste"
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
                Vazgeç
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={activePostId === revisionPost.id}
                onClick={submitRevisionRequest}
              >
                Revize iste
              </button>
            </>
          }
        >
          <div className="modal-form">
            <label>
              Revize notu
              <textarea
                rows={5}
                value={revisionNote}
                onChange={(event) => setRevisionNote(event.target.value)}
                placeholder="Kullanıcıdan beklenen değişikliği yaz"
              />
            </label>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
