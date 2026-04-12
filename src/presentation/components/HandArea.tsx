"use client";

import { BetChipRack } from "@/presentation/components/BetChipRack";
import { PlayingCard } from "@/presentation/components/PlayingCard";
import type { TrainerViewHand } from "@/presentation/view-models/buildTrainerViewModel";

interface HandAreaProps {
  hand: TrainerViewHand;
  motionEnabled: boolean;
}

export function HandArea({ hand, motionEnabled }: HandAreaProps) {
  return (
    <section
      className={`table-panel animate-table-fade px-4 py-4 tablet:px-5 desktop:px-6 ${hand.isActive ? "ring-2 ring-gold/60" : ""}`}
      aria-label={hand.title}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg tracking-[0.2em] text-gold">{hand.title}</p>
          {hand.subtitle ? <p className="mt-1 text-sm text-ivory/80">{hand.subtitle}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-muted">{hand.totalLabel}</p>
          {hand.badge ? (
            <p className="mt-2 rounded-pill border border-gold/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {hand.badge}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        {hand.cards.map((card) => (
          <PlayingCard
            key={card.id}
            card={card}
            faceDown={card.faceDown}
            motionEnabled={motionEnabled}
          />
        ))}
      </div>
      <BetChipRack stacks={hand.betChipStacks ?? []} />
      {hand.detail ? <p className="mt-4 text-sm text-ivory/80">{hand.detail}</p> : null}
    </section>
  );
}
