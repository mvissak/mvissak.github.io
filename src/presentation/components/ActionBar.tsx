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
  resultReactionActive: boolean;
  roundResolved: boolean;
  wagerPromptActive: boolean;
}

export function ActionBar({
  actions,
  canAdvanceToNextHand,
  countdownProgressPercent,
  countdownSecondsRemaining,
  onCashOut,
  onAction,
  onNextHand,
  resultReactionActive,
  roundResolved,
  wagerPromptActive,
}: ActionBarProps) {
  const isDealerResolving = roundResolved && !canAdvanceToNextHand && !resultReactionActive;
  const isResultShowing = roundResolved && resultReactionActive;
  const isAwaitingNextHand = roundResolved && canAdvanceToNextHand;
  const title = wagerPromptActive ? "Choose next bet" : isAwaitingNextHand
    ? "Hand complete"
    : isResultShowing
      ? "Result showing"
    : isDealerResolving
      ? "Dealer resolving"
      : "Choose an action";

  return (
    <section
      className="action-bar table-panel fixed inset-x-4 z-40 px-4 py-4 shadow-panel backdrop-blur-md tablet:inset-x-6 desktop:static desktop:z-auto desktop:px-4 desktop:py-4 desktop:shadow-none desktop:backdrop-blur-sm"
      data-testid="action-bar"
    >
      <div className="flex flex-col gap-4 tablet:flex-row tablet:items-center tablet:justify-between">
        <div>
          <p className="font-display text-lg tracking-[0.2em] text-gold">{title}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mobile:flex mobile:flex-wrap">
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
