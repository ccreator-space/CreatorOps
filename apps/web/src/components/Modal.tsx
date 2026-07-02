import { X } from "lucide-react";
import type { ReactNode } from "react";

type ModalProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export function Modal({ title, children, footer, onClose }: ModalProps) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </header>

        <div className="modal-body">{children}</div>

        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </section>
    </div>
  );
}
