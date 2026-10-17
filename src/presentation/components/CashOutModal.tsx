"use client";

import { ControlButton } from "@/presentation/components/ControlButton";
import { ModalFrame } from "@/presentation/components/ModalFrame";
import type { TrainerViewCashOut } from "@/presentation/view-models/buildCashOutMessage";

interface CashOutModalProps {
  cashOut: TrainerViewCashOut | null;
  isOpen: boolean;
  onDismiss: () => void;
}

export function CashOutModal({ cashOut, isOpen, onDismiss }: CashOutModalProps) {
  if (!isOpen || !cashOut) {
    return null;
  }

  return (
    <ModalFrame titleId="cash-out-title">
      <p className="text-xs uppercase tracking-[0.35em] text-gold-muted">Cash Out</p>
      <h2 id="cash-out-title" className="mt-3 font-display text-3xl text-gold">
        {cashOut.headline}
      </h2>
      <p
        className={`mt-4 text-3xl font-semibold ${cashOut.tone === "positive" ? "text-success" : "text-ivory/90"}`}
      >
        {cashOut.sessionTotalLabel}
      </p>
      <p className="mt-4 text-base leading-7 text-ivory/85">{cashOut.description}</p>
      <div className="mt-6">
        <ControlButton variant="primary" onClick={onDismiss}>
          Back to Table
        </ControlButton>
      </div>
    </ModalFrame>
  );
}
