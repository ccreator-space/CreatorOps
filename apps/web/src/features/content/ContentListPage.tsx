import { Check, MessageSquareText, X } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
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
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState("İçerikler yükleniyor.");
  const [activePostId, setActivePostId] = useState<string | null>(null);

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
      setStatusMessage(payload.data.length ? "" : "Bu filtrede içerik yok.");
    } catch {
      setPosts([]);
      setStatusMessage("İçerikler alınamadı.");
    }
  }

  useEffect(() => {
    void loadPosts();
  }, [statusFilter, viewer?.id]);

  const handleReview = async (postId: string, action: ReviewAction) => {
    if (!viewer) {
      return;
    }

    const note = notes[postId]?.trim();

    if (action === "request_revision" && !note) {
      toast.error("Revize istemek için not gir.");
      setStatusMessage("Revize istemek için not gir.");
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

      setNotes((currentNotes) => ({
        ...currentNotes,
        [postId]: ""
      }));
      toast.success("İşlem kaydedildi.");
      setStatusMessage("İşlem kaydedildi.");
      await loadPosts();
    } catch {
      toast.error("İşlem kaydedilemedi.");
      setStatusMessage("İşlem kaydedilemedi.");
    } finally {
      setActivePostId(null);
    }
  };

  if (!viewer) {
    return null;
  }

  return (
    <section className="list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>İçerikler</h1>
        </div>

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
      </header>

      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

      {posts.map((post) => (
        <article className="list-row content-row" key={post.id}>
          <div className="row-main">
            <div>
              <strong>{post.title}</strong>
              <p>
                {platformLabels[post.platform]} · {post.scheduledDate} · {post.author.name} ·{" "}
                {statusLabels[post.status]}
              </p>
            </div>
            <p className="post-content">{post.content}</p>
            {post.latestReview?.note ? (
              <p className="review-note">Son not: {post.latestReview.note}</p>
            ) : null}
            <textarea
              className="note-input"
              placeholder="Revize notu"
              rows={2}
              value={notes[post.id] ?? ""}
              onChange={(event) =>
                setNotes((currentNotes) => ({
                  ...currentNotes,
                  [post.id]: event.target.value
                }))
              }
            />
          </div>

          <div className="row-actions">
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
              onClick={() => handleReview(post.id, "request_revision")}
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
        </article>
      ))}
    </section>
  );
}
