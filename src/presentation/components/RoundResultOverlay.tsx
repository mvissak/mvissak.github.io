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
      "bg-[radial-gradient(circle_at_center,rgba(19,27,21,0.18)_0%,rgba(15,21,17,0.7)_48%,rgba(6,10,8,0.9)_100%)]",
    label: "Dealer Blackjack",
    showPoopIcon: true,
    textClassName: "text-ivory/80",
  },
  loss: {
    backdropClassName:
      "bg-[radial-gradient(circle_at_center,rgba(186,78,78,0.24)_0%,rgba(67,18,18,0.64)_44%,rgba(18,7,7,0.9)_100%)]",
    label: "Loss",
    textClassName: "text-danger",
  },
  victory: {
    backdropClassName:
      "bg-[radial-gradient(circle_at_center,rgba(130,191,96,0.24)_0%,rgba(13,56,31,0.66)_46%,rgba(5,18,11,0.9)_100%)]",
    label: "Victory",
    textClassName: "text-success",
  },
  blackjack: {
    backdropClassName:
      "bg-[linear-gradient(135deg,rgba(241,199,102,0.34),rgba(56,44,16,0.78),rgba(15,11,5,0.92))]",
    label: "Blackjack",
    textClassName: "text-gold",
  },
  push: {
    backdropClassName:
      "bg-[radial-gradient(circle_at_center,rgba(233,225,206,0.16)_0%,rgba(37,49,42,0.68)_44%,rgba(10,15,12,0.9)_100%)]",
    label: "Push",
    textClassName: "text-ivory",
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

    if (reaction === "push") {
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
          className={`font-body text-[clamp(2.75rem,11vw,5.75rem)] font-black uppercase tracking-[0.16em] drop-shadow-[0_10px_24px_rgba(0,0,0,0.7)] ${styles.textClassName}`}
        >
          {styles.label}
        </p>
        {amountLabel ? (
          <p
            className={`font-body text-[clamp(2.1rem,7vw,3.35rem)] font-extrabold tracking-[0.04em] drop-shadow-[0_8px_18px_rgba(0,0,0,0.65)] ${styles.textClassName}`}
          >
            {amountLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
