import { Check, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ListPageTemplate, type ListColumn } from "../../components/ListPageTemplate";
import { MediaCarouselModal } from "../../components/MediaCarouselModal";
import { Modal } from "../../components/Modal";
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
  attachments: Array<{
    id: string;
    type: "image" | "pdf";
    originalName: string;
    mimeType: string;
    publicUrl: string;
  }>;
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
  const [editingPost, setEditingPost] = useState<RevisionPost | null>(null);
  const [mediaPost, setMediaPost] = useState<RevisionPost | null>(null);
  const [draft, setDraft] = useState<DraftState>({
    title: "",
    content: ""
  });
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
      setStatusMessage("");
    } catch {
      setPosts([]);
      setStatusMessage("Revizeler alınamadı.");
    }
  }

  useEffect(() => {
    void loadRevisions();
  }, [viewer?.id]);

  const openEditor = (post: RevisionPost) => {
    setEditingPost(post);
    setDraft({
      title: post.title,
      content: post.content
    });
  };

  const closeEditor = () => {
    setEditingPost(null);
    setDraft({
      title: "",
      content: ""
    });
  };

  const handleResubmit = async () => {
    if (!viewer || !editingPost) {
      return;
    }

    if (!draft.title.trim() || !draft.content.trim()) {
      toast.error("Başlık ve içerik zorunlu.");
      setStatusMessage("Başlık ve içerik zorunlu.");
      return;
    }

    setActivePostId(editingPost.id);
    setStatusMessage("Tekrar onaya gönderiliyor.");

    try {
      const response = await fetch(`${apiUrl}/posts/${editingPost.id}/resubmit`, {
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
      closeEditor();
      setStatusMessage("İçerik tekrar onaya gönderildi.");
      await loadRevisions();
    } catch {
      toast.error("İçerik tekrar onaya gönderilemedi.");
      setStatusMessage("İçerik tekrar onaya gönderilemedi.");
    } finally {
      setActivePostId(null);
    }
  };

  const columns = useMemo<Array<ListColumn<RevisionPost>>>(
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
        key: "media",
        header: "Medya",
        width: "130px",
        render: (post) =>
          post.attachments.length ? (
            <button className="media-summary" type="button" onClick={() => setMediaPost(post)}>
              {post.attachments.slice(0, 3).map((attachment) =>
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
              {post.attachments.length > 3 ? <span className="media-count">+{post.attachments.length - 3}</span> : null}
            </button>
          ) : (
            "-"
          )
      },
      {
        key: "note",
        header: "Revize Notu",
        render: (post) => post.latestReview?.note ?? "-"
      },
      {
        key: "actions",
        header: "",
        align: "right",
        width: "52px",
        render: (post) => (
          <button
            className="icon-button"
            type="button"
            aria-label="Düzenle"
            onClick={() => openEditor(post)}
          >
            <Pencil size={18} />
          </button>
        )
      }
    ],
    []
  );

  return (
    <>
      <ListPageTemplate
        title="Revizeler"
        columns={columns}
        rows={posts}
        getRowId={(post) => post.id}
        statusMessage={statusMessage}
        emptyMessage="Revize bekleyen içerik yok."
      />

      {editingPost ? (
        <Modal
          title="Revizeyi düzenle"
          onClose={closeEditor}
          footer={
            <>
              <button className="secondary-button" type="button" onClick={closeEditor}>
                Vazgeç
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={activePostId === editingPost.id}
                onClick={handleResubmit}
              >
                <Check size={18} />
                Onaya gönder
              </button>
            </>
          }
        >
          <div className="modal-form">
            {editingPost.latestReview?.note ? (
              <p className="review-note">Revize notu: {editingPost.latestReview.note}</p>
            ) : null}

            <label>
              Başlık
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    title: event.target.value
                  }))
                }
              />
            </label>

            <label>
              İçerik
              <textarea
                rows={6}
                value={draft.content}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    content: event.target.value
                  }))
                }
              />
            </label>
          </div>
        </Modal>
      ) : null}

      {mediaPost ? (
        <MediaCarouselModal
          title={mediaPost.title}
          items={mediaPost.attachments.map((attachment) => ({
            id: attachment.id,
            type: attachment.type,
            originalName: attachment.originalName,
            mimeType: attachment.mimeType,
            sourceUrl: `${apiUrl}${attachment.publicUrl}`
          }))}
          onClose={() => setMediaPost(null)}
        />
      ) : null}
    </>
  );
}
