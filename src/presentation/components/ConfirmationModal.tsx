"use client";

import { ControlButton } from "@/presentation/components/ControlButton";
import { ModalFrame } from "@/presentation/components/ModalFrame";

interface ConfirmationModalProps {
  cancelLabel: string;
  confirmLabel: string;
  description: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

export function ConfirmationModal({
  cancelLabel,
  confirmLabel,
  description,
  isOpen,
  onCancel,
  onConfirm,
  title,
}: ConfirmationModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalFrame titleId="confirmation-title">
      <p className="text-xs uppercase tracking-[0.35em] text-gold-muted">Confirm</p>
      <h2 id="confirmation-title" className="mt-3 font-display text-3xl text-gold">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-ivory/85">{description}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ControlButton variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </ControlButton>
        <ControlButton variant="primary" onClick={onConfirm}>
          {confirmLabel}
        </ControlButton>
      </div>
    </ModalFrame>
  );
}
