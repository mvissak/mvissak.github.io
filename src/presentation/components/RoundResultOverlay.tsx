"use client";

import { useEffect } from "react";
import { playDisappointedSound } from "@/presentation/audio/playDisappointedSound";
import { playWinChime } from "@/presentation/audio/playWinChime";
import { ConfettiLayer } from "@/presentation/components/ConfettiLayer";
import { PoopIcon } from "@/presentation/components/PoopIcon";
import type { RoundReactionType } from "@/presentation/roundReaction";

interface RoundResultOverlayProps {
  amountLabel?: string | null;
  reaction: RoundReactionType | null;
}

const overlayStyles: Record<
  RoundReactionType,
  {
    backdropClassName: string;
    label: string;
    showPoopIcon?: boolean;
    textClassName: string;
  }
> = {
  dealerBlackjack: {
    backdropClassName:
      "bg-[radial-gradient(circle_at_center,rgba(17,24,18,0.08)_0%,rgba(17,24,18,0.48)_58%,rgba(17,24,18,0.72)_100%)]",
    label: "Dealer Blackjack",
    showPoopIcon: true,
    textClassName: "text-ivory/80",
  },
  loss: {
    backdropClassName:
      "bg-[radial-gradient(circle_at_center,rgba(241,164,164,0.2)_0%,rgba(73,19,19,0.34)_46%,rgba(32,10,10,0.72)_100%)]",
    label: "Loss",
    textClassName: "text-danger",
  },
  victory: {
    backdropClassName:
      "bg-[radial-gradient(circle_at_center,rgba(178,225,118,0.22)_0%,rgba(16,61,36,0.42)_48%,rgba(7,26,16,0.78)_100%)]",
    label: "Victory",
    textClassName: "text-success",
  },
  blackjack: {
    backdropClassName:
      "bg-[linear-gradient(135deg,rgba(241,199,102,0.28),rgba(43,36,17,0.84))]",
    label: "Blackjack",
    textClassName: "text-gold",
  },
};

export function RoundResultOverlay({ amountLabel, reaction }: RoundResultOverlayProps) {
  useEffect(() => {
    if (!reaction) {
      return;
    }

    if (reaction === "loss" || reaction === "dealerBlackjack") {
      playDisappointedSound();
      return;
    }

    playWinChime();
  }, [reaction]);

  if (!reaction) {
    return null;
  }

  const styles = overlayStyles[reaction];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 grid place-items-center overflow-hidden"
      data-testid="round-result-reaction"
    >
      <div className={`absolute inset-0 ${styles.backdropClassName}`} />
      {reaction === "victory" ? <ConfettiLayer /> : null}
      <div className="relative flex flex-col items-center gap-4 animate-round-result-fade px-6 text-center">
        {styles.showPoopIcon ? (
          <PoopIcon
            className="h-[clamp(4.5rem,24vw,9rem)] w-[clamp(4.5rem,24vw,9rem)] drop-shadow-[0_16px_28px_rgba(0,0,0,0.45)]"
            testId="dealer-blackjack-icon"
          />
        ) : null}
        <p
          className={`font-display text-[clamp(2.75rem,12vw,6.5rem)] uppercase tracking-[0.22em] ${styles.textClassName}`}
        >
          {styles.label}
        </p>
        {amountLabel ? (
          <p
            className={`font-display text-[clamp(2rem,7vw,3.25rem)] font-semibold tracking-[0.08em] ${styles.textClassName}`}
          >
            {amountLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
