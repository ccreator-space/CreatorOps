import { Check, MessageSquareText, X } from "lucide-react";

export function ContentListPage() {
  return (
    <section className="list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>İçerikler</h1>
        </div>
      </header>

      <div className="list-row">
        <div>
          <strong>LinkedIn lansman duyurusu</strong>
          <p>Onay bekliyor</p>
        </div>
        <div className="row-actions">
          <button className="icon-button" type="button" aria-label="Onayla">
            <Check size={18} />
          </button>
          <button className="icon-button" type="button" aria-label="Revize iste">
            <MessageSquareText size={18} />
          </button>
          <button className="icon-button" type="button" aria-label="Reddet">
            <X size={18} />
          </button>
        </div>
      </div>
    </section>
  );
}

