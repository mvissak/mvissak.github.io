"use client";

import { blackjackPayouts, isBlackjackPayout } from "@/domain/blackjackRules";
import type { BlackjackPayout } from "@/domain/types";
import { ControlButton } from "@/presentation/components/ControlButton";

interface BlackjackPayoutControlProps {
  onChange: (value: BlackjackPayout) => void;
  value: BlackjackPayout;
}

export function BlackjackPayoutControl({ onChange, value }: BlackjackPayoutControlProps) {
  return (
    <div aria-label="Blackjack Payout" role="group" className="table-panel flex flex-col px-3 py-2 text-ivory">
      <span className="text-xs font-semibold uppercase tracking-wide text-gold-muted">
        Blackjack Payout
      </span>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {Object.keys(blackjackPayouts).filter(isBlackjackPayout).map((payout) => (
          <ControlButton
            key={payout}
            aria-pressed={value === payout}
            onClick={() => onChange(payout)}
            type="button"
            variant={value === payout ? "primary" : "secondary"}
          >
            {payout}
          </ControlButton>
        ))}
      </div>
      <span className="mt-1 text-xs text-ivory/65">Applies to the next dealt hand.</span>
    </div>
  );
}
