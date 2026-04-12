"use client";

import type { Card } from "@/domain/types";
import { CardCorner } from "@/presentation/components/CardCorner";

interface PlayingCardProps {
  card: Card;
  faceDown?: boolean;
  motionEnabled: boolean;
}

const suitSymbols: Record<Card["suit"], string> = {
  clubs: "♣",
  diamonds: "♦",
  hearts: "♥",
  spades: "♠",
};

const suitTone: Record<Card["suit"], string> = {
  clubs: "text-ink",
  spades: "text-ink",
  hearts: "text-rose-700",
  diamonds: "text-rose-700",
};

export function PlayingCard({
  card,
  faceDown = false,
  motionEnabled,
}: PlayingCardProps) {
  const suitSymbol = suitSymbols[card.suit];
  const toneClassName = suitTone[card.suit];

  return (
    <div
      className={`relative h-30 w-[4.8rem] tablet:h-[8rem] tablet:w-[5.8rem] [perspective:1200px] ${motionEnabled ? "animate-card-draw" : ""}`}
    >
      <div
        className={`relative h-full w-full preserve-3d transition-transform duration-flip ${faceDown ? "rotate-y-180" : ""}`}
      >
        <div className="card-face backface-hidden border border-ivory-muted/80 bg-[linear-gradient(180deg,#fffdf8_0%,#f7ecd4_100%)] text-ink shadow-card">
          <CardCorner
            rank={card.rank}
            suitSymbol={suitSymbol}
            toneClassName={toneClassName}
            position="top-left"
          />
          <CardCorner
            rank={card.rank}
            suitSymbol={suitSymbol}
            toneClassName={toneClassName}
            position="bottom-right"
          />
          <div className={`absolute inset-0 grid place-items-center ${toneClassName}`}>
            <span className="text-[2.25rem] leading-none tablet:text-[2.85rem]">{suitSymbol}</span>
          </div>
        </div>
        <div className="card-face backface-hidden rotate-y-180 overflow-hidden border border-gold/50 bg-[linear-gradient(135deg,#1b7250_0%,#0f5b3a_50%,#072a1b_100%)] shadow-card">
          <div className="grid h-full place-items-center bg-[radial-gradient(circle_at_center,rgba(241,199,102,0.18)_0%,transparent_62%)] text-gold">
            <div className="rounded-full border border-gold/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.35em] tablet:text-sm">
              BJ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
