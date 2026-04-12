"use client";

import { useEffect } from "react";
import { playDisappointedSound } from "@/presentation/audio/playDisappointedSound";

interface DealerBlackjackOverlayProps {
  active: boolean;
}

export function DealerBlackjackOverlay({ active }: DealerBlackjackOverlayProps) {
  useEffect(() => {
    if (!active) {
      return;
    }

    playDisappointedSound();
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 grid place-items-center overflow-hidden"
      data-testid="dealer-blackjack-reaction"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(17,24,18,0.08)_0%,rgba(17,24,18,0.48)_58%,rgba(17,24,18,0.72)_100%)]" />
      <div className="relative flex flex-col items-center gap-4 animate-poop-fade">
        <div className="text-[7rem] leading-none drop-shadow-[0_16px_28px_rgba(0,0,0,0.45)] tablet:text-[9rem]">
          💩
        </div>
        <p className="font-display text-lg uppercase tracking-[0.35em] text-ivory/80 tablet:text-xl">
          Dealer Blackjack
        </p>
      </div>
    </div>
  );
}
