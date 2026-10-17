"use client";

import { useEffect, useState } from "react";
import type { NextWagerChoice } from "@/application/trainerState";
import { ControlButton } from "@/presentation/components/ControlButton";
import { ViewportPortal } from "@/presentation/components/ViewportPortal";
import type { TrainerViewNextWager } from "@/presentation/view-models/buildNextWagerViewModel";

interface NextHandWagerModalProps {
  isOpen: boolean;
  wager: TrainerViewNextWager | null;
  onChoose: (choice: NextWagerChoice, amount?: number) => void;
}

export function NextHandWagerModal({ isOpen, wager, onChoose }: NextHandWagerModalProps) {
  const [draft, setDraft] = useState("");
  useEffect(() => {
    if (isOpen && wager) setDraft(String(wager.baseWager));
  }, [isOpen, wager?.baseWager]);
  if (!isOpen || !wager) return null;
  return (
    <ViewportPortal>
      <div className="fixed inset-0 z-50 grid place-items-center bg-overlay p-4" role="dialog" aria-modal="true" aria-labelledby="next-wager-title">
        <div className="table-panel max-h-full w-full max-w-xl overflow-y-auto px-6 py-6">
          <p className="text-xs uppercase tracking-wide text-gold-muted">Next Hand</p>
          <h2 id="next-wager-title" className="mt-3 font-display text-3xl text-gold">Choose your next bet</h2>
          <p className="mt-4 text-sm leading-6 text-ivory/85">{wager.countLabel}</p>
          {wager.insuranceLabel ? <p className="mt-2 text-sm text-ivory/85">{wager.insuranceLabel}</p> : null}
          <label className="mt-5 block text-sm font-semibold text-gold" htmlFor="next-wager-amount">Custom bet amount</label>
          <input
            id="next-wager-amount"
            className="mt-2 w-full rounded-card border border-gold-muted/50 bg-felt-dark px-4 py-3 text-lg text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
            type="number"
            autoFocus
            inputMode="numeric"
            min={wager.minimum}
            max={wager.maximum}
            step={1}
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
            aria-describedby="next-wager-limits"
          />
          <p id="next-wager-limits" className="mt-2 text-xs text-ivory/65">{wager.limitsLabel}</p>
          {wager.error ? <p role="alert" className="mt-3 text-sm text-danger">{wager.error}</p> : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <ControlButton disabled={!wager.canIncrease} onClick={() => onChoose("increase", Number(draft))}>Increase bet</ControlButton>
            <ControlButton disabled={!wager.canDecrease} onClick={() => onChoose("decrease", Number(draft))}>Decrease bet</ControlButton>
            <ControlButton variant="primary" onClick={() => onChoose("keep")}>{wager.keepLabel}</ControlButton>
          </div>
        </div>
      </div>
    </ViewportPortal>
  );
}
