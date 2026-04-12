"use client";

import { ControlButton } from "@/presentation/components/ControlButton";
import type { TrainerViewCorrection } from "@/presentation/view-models/buildTrainerViewModel";

interface CorrectionModalProps {
  correction: TrainerViewCorrection | null;
  onDismiss: () => void;
}

export function CorrectionModal({ correction, onDismiss }: CorrectionModalProps) {
  if (!correction) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-overlay px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="correction-title"
    >
      <div className="table-panel w-full max-w-xl px-6 py-6">
        <p className="text-xs uppercase tracking-[0.35em] text-gold-muted">Correction</p>
        <h2 id="correction-title" className="mt-3 font-display text-3xl text-gold">
          {correction.recommendedLabel} is the chart play.
        </h2>
        <p className="mt-4 text-base text-ivory/90">
          You chose <span className="font-semibold text-danger">{correction.incorrectLabel}</span>.
        </p>
        <p className="mt-4 text-base leading-7 text-ivory/85">{correction.explanation}</p>
        <div className="mt-6">
          <ControlButton variant="primary" onClick={onDismiss}>
            Choose Again
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
