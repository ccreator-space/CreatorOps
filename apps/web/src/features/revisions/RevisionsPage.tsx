import { Pencil } from "lucide-react";

export function RevisionsPage() {
  return (
    <section className="list-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Kullanıcı</p>
          <h1>Revizeler</h1>
        </div>
      </header>

      <div className="list-row">
        <div>
          <strong>Instagram ekip tanıtımı</strong>
          <p>Revize istendi</p>
        </div>
        <button className="icon-button" type="button" aria-label="Düzenle">
          <Pencil size={18} />
        </button>
      </div>
    </section>
  );
}

