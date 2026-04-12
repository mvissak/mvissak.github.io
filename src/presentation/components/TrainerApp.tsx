"use client";

import { ActionBar } from "@/presentation/components/ActionBar";
import { BlackjackTrainer } from "@/application/BlackjackTrainer";
import type { RandomSource } from "@/domain/types";
import { CashOutModal } from "@/presentation/components/CashOutModal";
import { ConfirmationModal } from "@/presentation/components/ConfirmationModal";
import { CorrectionModal } from "@/presentation/components/CorrectionModal";
import { DealerBlackjackOverlay } from "@/presentation/components/DealerBlackjackOverlay";
import { HandArea } from "@/presentation/components/HandArea";
import { HeaderBar } from "@/presentation/components/HeaderBar";
import { InsuranceOfferModal } from "@/presentation/components/InsuranceOfferModal";
import { StatsPanel } from "@/presentation/components/StatsPanel";
import { TableSurface } from "@/presentation/components/TableSurface";
import { WaitressDrinkModal } from "@/presentation/components/WaitressDrinkModal";
import { WaitressReactionModal } from "@/presentation/components/WaitressReactionModal";
import { WinCelebrationOverlay } from "@/presentation/components/WinCelebrationOverlay";
import { useTrainerController } from "@/presentation/hooks/useTrainerController";
import { buildTrainerViewModel } from "@/presentation/view-models/buildTrainerViewModel";

interface TrainerAppProps {
  trainer?: BlackjackTrainer;
  autoAdvanceDelayMs?: number;
  dealerRevealDelayMs?: number;
  dealerDrawIntervalMs?: number;
  drinkOfferInitialDelayMs?: number;
  drinkOfferMaximumIntervalMs?: number;
  drinkOfferMinimumIntervalMs?: number;
  drinkOfferRandomSource?: RandomSource;
  drinkOfferResponseTimeoutMs?: number;
  winCelebrationDurationMs?: number;
}

export function TrainerApp({
  trainer,
  autoAdvanceDelayMs,
  dealerRevealDelayMs,
  dealerDrawIntervalMs,
  drinkOfferInitialDelayMs,
  drinkOfferMaximumIntervalMs,
  drinkOfferMinimumIntervalMs,
  drinkOfferRandomSource,
  drinkOfferResponseTimeoutMs,
  winCelebrationDurationMs,
}: TrainerAppProps) {
  const controller = useTrainerController({
    trainer,
    autoAdvanceDelayMs,
    dealerRevealDelayMs,
    dealerDrawIntervalMs,
    drinkOfferInitialDelayMs,
    drinkOfferMaximumIntervalMs,
    drinkOfferMinimumIntervalMs,
    drinkOfferRandomSource,
    drinkOfferResponseTimeoutMs,
    winCelebrationDurationMs,
  });
  const viewModel = buildTrainerViewModel(controller.state, {
    dealerVisibleCardCount: controller.dealerVisibleCardCount,
    suppressResolvedOutcome: controller.suppressResolvedOutcome,
  });
  const motionEnabled = true;

  return (
    <TableSurface>
      <DealerBlackjackOverlay active={controller.dealerBlackjackReactionActive} />
      <WinCelebrationOverlay active={controller.winCelebrationActive} />

      <HeaderBar
        onNewSession={controller.requestResetSession}
        onWagerAmountChange={controller.updateWagerAmount}
        wagerAmount={controller.wagerAmount}
      />

      {viewModel.dealerHand ? <HandArea hand={viewModel.dealerHand} motionEnabled={motionEnabled} /> : null}

      <section className="grid gap-4">
        {viewModel.playerHands.map((hand) => (
          <HandArea key={hand.id} hand={hand} motionEnabled={motionEnabled} />
        ))}
      </section>

      <ActionBar
        actions={viewModel.actions}
        canAdvanceToNextHand={controller.canAdvanceToNextHand}
        countdownProgressPercent={controller.countdownProgressPercent}
        countdownSecondsRemaining={controller.countdownSecondsRemaining}
        onCashOut={controller.openCashOut}
        onAction={controller.takeAction}
        onNextHand={controller.nextHand}
        roundResolved={controller.state?.phase === "roundResolved"}
      />

      <StatsPanel metrics={viewModel.metrics} />

      <CashOutModal
        cashOut={controller.cashOutMessage}
        isOpen={controller.isCashOutOpen}
        onDismiss={controller.closeCashOut}
      />
      <InsuranceOfferModal
        insuranceAmountLabel={viewModel.insuranceOffer?.amountLabel ?? "$0.00"}
        isOpen={controller.insuranceDecisionActive === true}
        onChooseNo={() => controller.chooseInsurance("no")}
        onChooseYes={() => controller.chooseInsurance("yes")}
      />
      <WaitressDrinkModal
        countdownSecondsRemaining={controller.drinkOfferSecondsRemaining}
        isOpen={controller.isDrinkOfferOpen}
        onSelect={controller.orderDrink}
      />
      <WaitressReactionModal
        onDismiss={controller.dismissDrinkReaction}
        reaction={controller.waitressReaction}
      />
      <ConfirmationModal
        cancelLabel="Keep Playing"
        confirmLabel="Start New Session"
        description="This resets the current hand, session stats, and shoe progress. Use it when you want a completely fresh table."
        isOpen={controller.isResetSessionConfirmationOpen}
        onCancel={controller.cancelResetSession}
        onConfirm={controller.confirmResetSession}
        title="Start a new session?"
      />
      <CorrectionModal correction={viewModel.correction} onDismiss={controller.closeCorrection} />
    </TableSurface>
  );
}
