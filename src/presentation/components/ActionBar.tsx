"use client";

import type { PlayerAction } from "@/domain/types";
import { ControlButton } from "@/presentation/components/ControlButton";
import { NextHandCountdownButton } from "@/presentation/components/NextHandCountdownButton";
import type { TrainerViewAction } from "@/presentation/view-models/buildTrainerViewModel";

interface ActionBarProps {
  actions: TrainerViewAction[];
  canAdvanceToNextHand: boolean;
  countdownProgressPercent: number;
  countdownSecondsRemaining: number;
  onCashOut: () => void;
  onAction: (action: PlayerAction) => void;
  onNextHand: () => void;
  roundResolved: boolean;
}

export function ActionBar({
  actions,
  canAdvanceToNextHand,
  countdownProgressPercent,
  countdownSecondsRemaining,
  onCashOut,
  onAction,
  onNextHand,
  roundResolved,
}: ActionBarProps) {
  const isDealerResolving = roundResolved && !canAdvanceToNextHand;
  const isAwaitingNextHand = roundResolved && canAdvanceToNextHand;
  const title = isAwaitingNextHand
    ? "Hand complete"
    : isDealerResolving
      ? "Dealer resolving"
      : "Choose an action";

  return (
    <section className="table-panel px-4 py-4 tablet:px-5">
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <p className="font-display text-lg tracking-[0.2em] text-gold">{title}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {isAwaitingNextHand ? (
            <>
              <ControlButton variant="secondary" onClick={onCashOut}>
                Cash Out
              </ControlButton>
              <NextHandCountdownButton
                countdownProgressPercent={countdownProgressPercent}
                isEnabled={canAdvanceToNextHand}
                onClick={onNextHand}
                secondsRemaining={countdownSecondsRemaining}
              />
            </>
          ) : (
            actions.map((action) => (
              <ControlButton
                key={action.id}
                variant="secondary"
                onClick={() => onAction(action.id)}
              >
                {action.label}
              </ControlButton>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
