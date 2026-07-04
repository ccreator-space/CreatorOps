import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Send,
  ThumbsUp,
  FileText
} from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "../../components/Modal";
import type { UserSummary } from "../../lib/mock-data";
import type { ContentAttachment } from "../calendar/ContentSheet";

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

type PreviewPost = {
  title: string;
  content: string;
  platform: "linkedin" | "instagram";
  scheduledDate: string;
  author: UserSummary;
  attachments: ContentAttachment[];
};

type PostPreviewModalProps = {
  post: PreviewPost;
  onClose: () => void;
};

function resolveAssetUrl(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  return value.startsWith("/uploads") ? `${apiUrl}${value}` : value;
}

function getAuthorHandle(author: UserSummary) {
  return author.email.split("@")[0] || author.name.toLowerCase().replace(/\s+/g, "");
}

function getAttachmentUrl(attachment: ContentAttachment) {
  return `${apiUrl}${attachment.publicUrl}`;
}

function MediaFrame({
  attachment,
  variant
}: {
  attachment?: ContentAttachment;
  variant: "linkedin" | "instagram";
}) {
  if (!attachment) {
    return (
      <div className={`post-preview-empty-media is-${variant}`}>
        <FileText size={28} />
        <span>No media attached</span>
      </div>
    );
  }

  if (attachment.type === "pdf") {
    return (
      <div className={`post-preview-pdf is-${variant}`}>
        <FileText size={38} />
        <strong>PDF</strong>
        <span>{attachment.originalName}</span>
      </div>
    );
  }

  return (
    <img
      alt={attachment.originalName}
      className={`post-preview-image is-${variant}`}
      src={getAttachmentUrl(attachment)}
    />
  );
}

function CarouselMedia({
  attachments,
  variant
}: {
  attachments: ContentAttachment[];
  variant: "linkedin" | "instagram";
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeAttachment = attachments[activeIndex];
  const hasMultipleItems = attachments.length > 1;

  const goToPrevious = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? attachments.length - 1 : currentIndex - 1
    );
  };

  const goToNext = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === attachments.length - 1 ? 0 : currentIndex + 1
    );
  };

  return (
    <div className={`post-preview-media is-${variant}`}>
      <MediaFrame attachment={activeAttachment} variant={variant} />

      {hasMultipleItems ? (
        <>
          <button
            className="post-preview-nav is-left"
            type="button"
            onClick={goToPrevious}
            aria-label="Previous media"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className="post-preview-nav is-right"
            type="button"
            onClick={goToNext}
            aria-label="Next media"
          >
            <ChevronRight size={18} />
          </button>
          <div className="post-preview-dots" aria-label="Carousel position">
            {attachments.map((attachment, index) => (
              <button
                className={index === activeIndex ? "is-active" : ""}
                key={attachment.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show media ${index + 1}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function LinkedInPreview({ post }: { post: PreviewPost }) {
  const avatarUrl = resolveAssetUrl(post.author.avatarUrl);

  return (
    <article className="linkedin-preview">
      <header className="linkedin-preview-header">
        <img alt={post.author.name} src={avatarUrl} />
        <div>
          <strong>{post.author.name}</strong>
          <span>Content contributor</span>
          <span>{post.scheduledDate}</span>
        </div>
        <button className="linkedin-more-button" type="button" aria-label="More options">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <div className="linkedin-preview-copy">
        <p>{post.content}</p>
      </div>

      <CarouselMedia attachments={post.attachments} variant="linkedin" />

      <div className="linkedin-preview-stats">
        <span>
          <ThumbsUp size={13} />
          128
        </span>
        <span>18 comments</span>
      </div>

      <footer className="linkedin-preview-actions">
        <span>
          <ThumbsUp size={18} />
          Like
        </span>
        <span>
          <MessageCircle size={18} />
          Comment
        </span>
        <span>
          <Repeat2 size={18} />
          Repost
        </span>
        <span>
          <Send size={18} />
          Send
        </span>
      </footer>
    </article>
  );
}

function InstagramPreview({ post }: { post: PreviewPost }) {
  const avatarUrl = resolveAssetUrl(post.author.avatarUrl);
  const handle = getAuthorHandle(post.author);

  return (
    <article className="instagram-preview">
      <header className="instagram-preview-header">
        <div>
          <img alt={post.author.name} src={avatarUrl} />
          <strong>{handle}</strong>
        </div>
        <button className="instagram-more-button" type="button" aria-label="More options">
          <MoreHorizontal size={20} />
        </button>
      </header>

      <CarouselMedia attachments={post.attachments} variant="instagram" />

      <div className="instagram-preview-actions">
        <span>
          <Heart size={21} />
          <MessageCircle size={21} />
          <Send size={21} />
        </span>
        <Bookmark size={21} />
      </div>

      <div className="instagram-preview-caption">
        <strong>{handle}</strong>
        <p>{post.content}</p>
      </div>
    </article>
  );
}

export function PostPreviewModal({ post, onClose }: PostPreviewModalProps) {
  const modalTitle = useMemo(
    () => `${post.platform === "instagram" ? "Instagram" : "LinkedIn"} preview`,
    [post.platform]
  );

  return (
    <Modal title={modalTitle} size="wide" onClose={onClose}>
      <div className="post-preview-shell">
        <div className="post-preview-stage">
          {post.platform === "instagram" ? (
            <InstagramPreview post={post} />
          ) : (
            <LinkedInPreview post={post} />
          )}
        </div>
      </div>
    </Modal>
  );
}
