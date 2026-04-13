"use client";

import { useEffect } from "react";
import { playDisappointedSound } from "@/presentation/audio/playDisappointedSound";
import { playDrinkPourSound } from "@/presentation/audio/playDrinkPourSound";
import { ControlButton } from "@/presentation/components/ControlButton";
import { ViewportPortal } from "@/presentation/components/ViewportPortal";
import type { WaitressReaction } from "@/presentation/hooks/useDrinkServiceInterruptions";

interface WaitressReactionModalProps {
  onDismiss: () => void;
  reaction: WaitressReaction | null;
}

export function WaitressReactionModal({
  onDismiss,
  reaction,
}: WaitressReactionModalProps) {
  useEffect(() => {
    if (!reaction) {
      return;
    }

    if (reaction.tone === "disappointed") {
      playDisappointedSound();
      return;
    }

    playDrinkPourSound();
  }, [reaction]);

  if (!reaction) {
    return null;
  }

  return (
    <ViewportPortal>
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-overlay px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitress-reaction-title"
      >
        <div className="table-panel w-full max-w-xl px-6 py-6">
          <p className="text-xs uppercase tracking-[0.35em] text-gold-muted">Table Mood</p>
          <h2 id="waitress-reaction-title" className="mt-3 font-display text-3xl text-gold">
            {reaction.title}
          </h2>
          <p
            className={`mt-4 text-base leading-7 ${reaction.tone === "disappointed" ? "text-ivory/85" : "text-ivory/90"}`}
          >
            {reaction.description}
          </p>
          <div className="mt-6">
            <ControlButton variant="primary" onClick={onDismiss}>
              Back to Table
            </ControlButton>
          </div>
        </div>
      </div>
    </ViewportPortal>
  );
}
