"use client";

import { useEffect, useState } from "react";
import { blackjackRules } from "@/domain/blackjackRules";

interface WagerAmountControlProps {
  onChange: (value: number) => void;
  value: number;
}

export function WagerAmountControl({ onChange, value }: WagerAmountControlProps) {
  const [draftValue, setDraftValue] = useState(String(value));

  useEffect(() => {
    setDraftValue(String(value));
  }, [value]);

  const commitDraftValue = () => {
    if (draftValue.length === 0) {
      setDraftValue(String(value));
      return;
    }

    const nextValue = Number.parseInt(draftValue, 10);

    if (!Number.isFinite(nextValue)) {
      setDraftValue(String(value));
      return;
    }

    const committedValue = Math.min(
      blackjackRules.maximumWagerAmount,
      Math.max(blackjackRules.minimumWagerAmount, nextValue),
    );
    onChange(committedValue);
    setDraftValue(String(committedValue));
  };

  return (
    <label className="table-panel flex min-w-[11rem] flex-col px-3 py-2 text-ivory">
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-gold-muted">
        Base Bet
      </span>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-sm font-semibold text-gold">$</span>
        <input
          aria-label="Base Bet"
          className="w-full border-0 bg-transparent p-0 text-lg font-semibold text-ivory outline-none"
          inputMode="numeric"
          max={blackjackRules.maximumWagerAmount}
          min={blackjackRules.minimumWagerAmount}
          onChange={(event) => {
            const nextDraftValue = event.currentTarget.value.replace(/\D/g, "");

            setDraftValue(nextDraftValue);
          }}
          onBlur={commitDraftValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitDraftValue();
              event.currentTarget.blur();
            }
          }}
          pattern="[0-9]*"
          step={1}
          type="text"
          value={draftValue}
        />
      </div>
      <span className="mt-1 text-[0.68rem] text-ivory/65">
        ${blackjackRules.minimumWagerAmount} minimum, ${blackjackRules.maximumWagerAmount} maximum.
        Applies to the next dealt hand.
      </span>
    </label>
  );
}
