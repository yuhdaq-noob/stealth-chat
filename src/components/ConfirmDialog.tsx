"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  count: number;
  deleteAll?: boolean;
  isConfirming: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  count,
  deleteAll = false,
  isConfirming,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const itemLabel = deleteAll
    ? "seluruh chat, termasuk pesan partner"
    : count === 1
      ? "pesan ini"
      : `${count} pesan yang dipilih`;

  useEffect(() => {
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isConfirming) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConfirming, onCancel]);

  return (
    <div
      className="confirm-modal"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirming) onCancel();
      }}
    >
      <section
        className="confirm-panel"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirmation-title"
        aria-describedby="delete-confirmation-description"
      >
        <div className="confirm-icon" aria-hidden="true">
          <AlertTriangle size={19} />
        </div>
        <button
          type="button"
          className="confirm-close"
          onClick={onCancel}
          disabled={isConfirming}
          aria-label="Tutup konfirmasi"
        >
          <X size={17} />
        </button>
        <div className="confirm-copy">
          <h2 id="delete-confirmation-title">
            {deleteAll ? "Hapus semua chat?" : "Hapus pesan?"}
          </h2>
          <p id="delete-confirmation-description">
            {`Anda akan menghapus ${itemLabel}. Tindakan ini tidak dapat dibatalkan.`}
          </p>
        </div>
        <div className="confirm-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="button button-secondary"
            onClick={onCancel}
            disabled={isConfirming}
          >
            Batal
          </button>
          <button
            type="button"
            className="button button-confirm-danger"
            onClick={onConfirm}
            disabled={isConfirming}
          >
            <Trash2 size={15} />
            {isConfirming
              ? "Menghapus..."
              : deleteAll
                ? "Hapus semua chat"
                : "Hapus pesan"}
          </button>
        </div>
      </section>
    </div>
  );
}
