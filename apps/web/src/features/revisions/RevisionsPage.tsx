import { Check, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type RevisionPost = {
  id: string;
  scheduledDate: string;
  platform: "linkedin" | "instagram";
  title: string;
  content: string;
  latestReview?: {
    note?: string;
  };
};

type PostsResponse = {
  data: RevisionPost[];
};

type DraftState = {
  title: string;
  content: string;
};

const platformLabels: Record<RevisionPost["platform"], string> = {
  linkedin: "LinkedIn",
  instagram: "Instagram"
};

export function RevisionsPage() {
  const { authHeaders, viewer } = useAuth();
  const [posts, setPosts] = useState<RevisionPost[]>([]);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Revizeler yükleniyor.");

  async function loadRevisions() {
    if (!viewer) {
      return;
    }

    setStatusMessage("Revizeler yükleniyor.");

    try {
      const response = await fetch(`${apiUrl}/posts?status=revision_requested`, {
        headers: authHeaders()
      });

      if (!response.ok) {
        throw new Error("Revizeler alınamadı.");
      }

      const payload = (await response.json()) as PostsResponse;
      setPosts(payload.data);
      setDrafts(
        Object.fromEntries(
          payload.data.map((post) => [
            post.id,
            {
              title: post.title,
              content: post.content
            }
          ])
        )
      );
      setStatusMessage(payload.data.length ? "" : "Revize bekleyen içerik yok.");
    } catch {
      setPosts([]);
      setStatusMessage("Revizeler alınamadı.");
    }
  }

  useEffect(() => {
    void loadRevisions();
  }, [viewer?.id]);

  const handleResubmit = async (postId: string) => {
    if (!viewer) {
      return;
    }

    const draft = drafts[postId];

    if (!draft?.title.trim() || !draft.content.trim()) {
      toast.error("Başlık ve içerik zorunlu.");
      setStatusMessage("Başlık ve içerik zorunlu.");
      return;
    }

    setActivePostId(postId);
    setStatusMessage("Tekrar onaya gönderiliyor.");

    try {
      const response = await fetch(`${apiUrl}/posts/${postId}/resubmit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders()
        },
        body: JSON.stringify({
          title: draft.title.trim(),
          content: draft.content.trim()
        })
      });

      if (!response.ok) {
        throw new Error("İçerik tekrar onaya gönderilemedi.");
      }

      toast.success("İçerik tekrar onaya gönderildi.");
      setEditingPostId(null);
      setStatusMessage("İçerik tekrar onaya gönderildi.");
      await loadRevisions();
    } catch {
      toast.error("İçerik tekrar onaya gönderilemedi.");
      setStatusMessage("İçerik tekrar onaya gönderilemedi.");
    } finally {
      setActivePostId(null);
    }
  };

  return (
    <section className="list-page">
      <header className="page-header">
        <h1>Revizeler</h1>
      </header>

      {statusMessage ? <p className="status-message">{statusMessage}</p> : null}

      {posts.map((post) => {
        const isEditing = editingPostId === post.id;
        const draft = drafts[post.id] ?? {
          title: post.title,
          content: post.content
        };

        return (
          <article className="list-row content-row" key={post.id}>
            <div className="row-main">
              <div>
                <strong>{post.title}</strong>
                <p>
                  {platformLabels[post.platform]} · {post.scheduledDate} · Revize istendi
                </p>
              </div>

              {post.latestReview?.note ? (
                <p className="review-note">Revize notu: {post.latestReview.note}</p>
              ) : null}

              {isEditing ? (
                <div className="revision-editor">
                  <label>
                    Başlık
                    <input
                      value={draft.title}
                      onChange={(event) =>
                        setDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [post.id]: {
                            ...draft,
                            title: event.target.value
                          }
                        }))
                      }
                    />
                  </label>
                  <label>
                    İçerik
                    <textarea
                      rows={5}
                      value={draft.content}
                      onChange={(event) =>
                        setDrafts((currentDrafts) => ({
                          ...currentDrafts,
                          [post.id]: {
                            ...draft,
                            content: event.target.value
                          }
                        }))
                      }
                    />
                  </label>
                </div>
              ) : (
                <p className="post-content">{post.content}</p>
              )}
            </div>

            <div className="row-actions">
              {isEditing ? (
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Tekrar onaya gönder"
                  disabled={activePostId === post.id}
                  onClick={() => handleResubmit(post.id)}
                >
                  <Check size={18} />
                </button>
              ) : (
                <button
                  className="icon-button"
                  type="button"
                  aria-label="Düzenle"
                  onClick={() => setEditingPostId(post.id)}
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}
