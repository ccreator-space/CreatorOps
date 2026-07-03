import { ChevronLeft, ChevronRight, ExternalLink, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "./Modal";

export type MediaCarouselItem = {
  id: string;
  type: "image" | "pdf";
  originalName: string;
  mimeType?: string;
  sourceUrl: string;
  width?: number | null;
  height?: number | null;
};

type MediaCarouselModalProps = {
  title: string;
  items: MediaCarouselItem[];
  initialIndex?: number;
  onClose: () => void;
};

export function MediaCarouselModal({
  title,
  items,
  initialIndex = 0,
  onClose
}: MediaCarouselModalProps) {
  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0));
  const [activeIndex, setActiveIndex] = useState(safeInitialIndex);
  const activeItem = items[activeIndex];
  const hasMultipleItems = items.length > 1;

  const activeSource = useMemo(() => {
    if (!activeItem) {
      return "";
    }

    return activeItem.type === "pdf"
      ? `${activeItem.sourceUrl}#toolbar=0&navpanes=0&view=FitH`
      : activeItem.sourceUrl;
  }, [activeItem]);

  const goPrevious = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === 0 ? items.length - 1 : currentIndex - 1
    );
  };

  const goNext = () => {
    setActiveIndex((currentIndex) =>
      currentIndex === items.length - 1 ? 0 : currentIndex + 1
    );
  };

  if (!activeItem) {
    return null;
  }

  return (
    <Modal title={title} onClose={onClose} size="wide">
      <div className="media-carousel">
        <div className="media-carousel-stage">
          {hasMultipleItems ? (
            <button
              className="media-carousel-nav is-left"
              type="button"
              onClick={goPrevious}
              aria-label="Previous media"
            >
              <ChevronLeft size={22} />
            </button>
          ) : null}

          {activeItem.type === "image" ? (
            <img alt={activeItem.originalName} src={activeSource} />
          ) : (
            <iframe src={activeSource} title={activeItem.originalName} />
          )}

          {hasMultipleItems ? (
            <button
              className="media-carousel-nav is-right"
              type="button"
              onClick={goNext}
              aria-label="Next media"
            >
              <ChevronRight size={22} />
            </button>
          ) : null}
        </div>

        <div className="media-carousel-meta">
          <div>
            <strong>{activeItem.originalName}</strong>
            <p>
              {activeItem.type === "pdf" ? "PDF" : "Image"}
              {activeItem.mimeType ? ` · ${activeItem.mimeType}` : ""}
              {activeItem.width && activeItem.height
                ? ` · ${activeItem.width}x${activeItem.height}`
                : ""}
            </p>
          </div>

          <a className="secondary-button" href={activeItem.sourceUrl} rel="noreferrer" target="_blank">
            <ExternalLink size={16} />
            Open
          </a>
        </div>

        {hasMultipleItems ? (
          <div className="media-carousel-thumbs" aria-label="Media list">
            {items.map((item, index) => (
              <button
                className={`media-carousel-thumb ${activeIndex === index ? "is-active" : ""}`}
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show media ${index + 1}`}
              >
                {item.type === "image" ? (
                  <img alt={item.originalName} src={item.sourceUrl} />
                ) : (
                  <span>
                    <FileText size={18} />
                    PDF
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
