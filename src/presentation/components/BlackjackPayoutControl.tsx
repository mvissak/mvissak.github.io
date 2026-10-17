"use client";

import { blackjackPayouts, isBlackjackPayout } from "@/domain/blackjackRules";
import type { BlackjackPayout } from "@/domain/types";

interface BlackjackPayoutControlProps {
  onChange: (value: BlackjackPayout) => void;
  value: BlackjackPayout;
}

export function BlackjackPayoutControl({ onChange, value }: BlackjackPayoutControlProps) {
  return (
    <label className="table-panel flex flex-col px-3 py-2 text-ivory">
      <span className="text-xs font-semibold uppercase tracking-wide text-gold-muted">
        Blackjack Payout
      </span>
      <select
        aria-label="Blackjack Payout"
        className="mt-2 w-full rounded-lg border border-ivory/20 bg-felt-dark px-2 py-1 text-lg font-semibold text-ivory outline-none focus:border-gold"
        onChange={(event) => {
          const payout = event.currentTarget.value;
          if (isBlackjackPayout(payout)) {
            onChange(payout);
          }
        }}
        value={value}
      >
        {Object.keys(blackjackPayouts).map((payout) => (
          <option key={payout} value={payout}>{payout}</option>
        ))}
      </select>
      <span className="mt-1 text-xs text-ivory/65">Applies to the next dealt hand.</span>
    </label>
  );
}
