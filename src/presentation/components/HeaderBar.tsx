"use client";

import { blackjackRules } from "@/domain/blackjackRules";
import { ControlButton } from "@/presentation/components/ControlButton";
import { WagerAmountControl } from "@/presentation/components/WagerAmountControl";

interface HeaderBarProps {
  onNewSession: () => void;
  onWagerAmountChange: (value: number) => void;
  wagerAmount: number;
}

export function HeaderBar({
  onNewSession,
  onWagerAmountChange,
  wagerAmount,
}: HeaderBarProps) {
  return (
    <header className="flex flex-col gap-4 tablet:flex-row tablet:items-end tablet:justify-between">
      <div>
        <p className="font-display text-sm uppercase tracking-[0.45em] text-gold-muted">
          Blackjack Trainer
        </p>
        <h1 className="mt-2 font-display text-3xl text-gold tablet:text-4xl">
          Basic Strategy Table Practice
        </h1>
        <p className="mt-3 max-w-2xl text-base text-ivory/80">
          Every hand is checked against the exact 6-deck S17 chart. Wrong moves pause the
          hand and explain the correction before play continues.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-ivory/70">
          Table rules: 6-deck shoe, blackjack pays 3:2, dealer stands on soft 17 and all
          totals 17+, double on any two cards including after splits, no surrender or
          insurance, and a ${blackjackRules.minimumWagerAmount}-${blackjackRules.maximumWagerAmount} bet range.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <WagerAmountControl onChange={onWagerAmountChange} value={wagerAmount} />
        <ControlButton variant="primary" onClick={onNewSession}>
          New Session
        </ControlButton>
      </div>
    </header>
  );
}
