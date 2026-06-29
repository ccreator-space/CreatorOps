import { X } from "lucide-react";

type ContentSheetProps = {
  isOpen: boolean;
  selectedDate: string;
  onClose: () => void;
};

export function ContentSheet({ isOpen, selectedDate, onClose }: ContentSheetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="sheet-backdrop" role="presentation">
      <aside className="sheet" aria-label="Yeni içerik formu">
        <header className="sheet-header">
          <div>
            <p className="eyebrow">{selectedDate}</p>
            <h2>Yeni içerik</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>

        <form className="content-form">
          <label>
            Platform
            <select name="platform" defaultValue="linkedin">
              <option value="linkedin">LinkedIn</option>
              <option value="instagram">Instagram</option>
            </select>
          </label>

          <label>
            Başlık
            <input name="title" placeholder="Gönderi başlığı" type="text" />
          </label>

          <label>
            Content
            <textarea name="content" placeholder="Gönderi içeriği" rows={8} />
          </label>

          <button className="primary-button is-full" type="submit">
            Kaydet
          </button>
        </form>
      </aside>
    </div>
  );
}
