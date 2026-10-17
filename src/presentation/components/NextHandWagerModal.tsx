"use client";

import { useEffect, useState } from "react";
import type { NextWagerChoice } from "@/application/trainerState";
import { ControlButton } from "@/presentation/components/ControlButton";
import { ModalFrame } from "@/presentation/components/ModalFrame";
import { ShoeNotice } from "@/presentation/components/ShoeNotice";
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
    <ModalFrame titleId="next-wager-title">
      <p className="text-xs uppercase tracking-wide text-gold-muted">Next Hand</p>
      <h2 id="next-wager-title" className="mt-3 font-display text-3xl text-gold">Choose your next bet</h2>
      <div className="mt-4">
        {wager.shoeNotice ? <ShoeNotice notice={wager.shoeNotice} /> : <p className="text-sm leading-6 text-ivory/85">{wager.countLabel}</p>}
      </div>
      {wager.insuranceLabel ? <p className="mt-2 text-sm text-ivory/85">{wager.insuranceLabel}</p> : null}
      <label className="mt-5 block text-sm font-semibold text-gold" htmlFor="next-wager-amount">Custom bet amount</label>
      <input
        id="next-wager-amount"
        className="mt-2 w-full rounded-card border border-gold-muted/50 bg-felt-dark px-4 py-3 text-lg text-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold"
        type="number"
        inputMode="numeric"
        min={wager.minimum}
        max={wager.maximum}
        step={1}
        value={draft}
        onChange={(event) => setDraft(event.currentTarget.value)}
        aria-describedby={wager.error ? "next-wager-limits next-wager-error" : "next-wager-limits"}
        aria-invalid={wager.error ? true : undefined}
      />
      <p id="next-wager-limits" className="mt-2 text-xs text-ivory/65">{wager.limitsLabel}</p>
      {wager.error ? <p id="next-wager-error" role="alert" className="mt-3 text-sm text-danger">{wager.error}</p> : null}
      <div className="mt-6 grid gap-3 mobile:grid-cols-2">
        <ControlButton disabled={!wager.canIncrease} onClick={() => onChoose("increase", Number(draft))}>Increase bet</ControlButton>
        <ControlButton disabled={!wager.canDecrease} onClick={() => onChoose("decrease", Number(draft))}>Decrease bet</ControlButton>
        <ControlButton className="mobile:col-span-2" variant="primary" onClick={() => onChoose("keep")}>{wager.keepLabel}</ControlButton>
      </div>
    </ModalFrame>
  );
}
