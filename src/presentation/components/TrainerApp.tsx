"use client";

import { ActionBar } from "@/presentation/components/ActionBar";
import { BlackjackTrainer } from "@/application/BlackjackTrainer";
import type { RandomSource } from "@/domain/types";
import { CashOutModal } from "@/presentation/components/CashOutModal";
import { CardCountingReferencePanel } from "@/presentation/components/CardCountingReferencePanel";
import { DecisionNotice } from "@/presentation/components/DecisionNotice";
import { NextHandWagerModal } from "@/presentation/components/NextHandWagerModal";
import { buildNextWagerViewModel } from "@/presentation/view-models/buildNextWagerViewModel";
import { ConfirmationModal } from "@/presentation/components/ConfirmationModal";
import { CorrectionModal } from "@/presentation/components/CorrectionModal";
import { HandArea } from "@/presentation/components/HandArea";
import { HeaderBar } from "@/presentation/components/HeaderBar";
import { InsuranceOfferModal } from "@/presentation/components/InsuranceOfferModal";
import { RoundResultOverlay } from "@/presentation/components/RoundResultOverlay";
import { StatsPanel } from "@/presentation/components/StatsPanel";
import { StrategyReferencePanel } from "@/presentation/components/StrategyReferencePanel";
import { TableSurface } from "@/presentation/components/TableSurface";
import { WaitressDrinkModal } from "@/presentation/components/WaitressDrinkModal";
import { WaitressReactionModal } from "@/presentation/components/WaitressReactionModal";
import { useTrainerController } from "@/presentation/hooks/useTrainerController";
import { buildStrategyReferenceViewModel } from "@/presentation/view-models/buildStrategyReferenceViewModel";
import { buildCardCountingReferenceViewModel } from "@/presentation/view-models/buildCardCountingReferenceViewModel";
import { buildTrainerViewModel } from "@/presentation/view-models/buildTrainerViewModel";

interface TrainerAppProps {
  trainer?: BlackjackTrainer;
  autoAdvanceDelayMs?: number;
  blackjackReactionDelayMs?: number;
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
  blackjackReactionDelayMs,
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
    blackjackReactionDelayMs,
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
    revealDealerHoleCard: controller.revealDealerHoleCard,
    suppressResolvedOutcome: controller.suppressResolvedOutcome,
  });
  const strategyReference = buildStrategyReferenceViewModel();
  const countReference = buildCardCountingReferenceViewModel(
    viewModel.runningCount,
    controller.state?.round?.blackjackPayout ?? controller.blackjackPayout,
    viewModel.trueCount,
  );
  const motionEnabled = true;
  const nextWager = buildNextWagerViewModel(controller.state, viewModel.trueCount);

  return (
    <TableSurface>
      <RoundResultOverlay
        amountLabel={viewModel.roundResultAmountLabel}
        reaction={controller.roundReaction}
      />

      <HeaderBar
        blackjackPayout={controller.blackjackPayout}
        blackjackPayoutLabel={viewModel.blackjackPayoutLabel}
        onBlackjackPayoutChange={controller.updateBlackjackPayout}
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

      <DecisionNotice message={viewModel.decisionNotice} />
      <ActionBar
        actions={viewModel.actions}
        canAdvanceToNextHand={controller.canAdvanceToNextHand}
        countdownProgressPercent={controller.countdownProgressPercent}
        countdownSecondsRemaining={controller.countdownSecondsRemaining}
        onCashOut={controller.openCashOut}
        onAction={controller.takeAction}
        onNextHand={controller.nextHand}
        resultReactionActive={controller.resultReactionActive}
        roundResolved={controller.state?.phase === "roundResolved"}
        wagerPromptActive={controller.nextWagerPromptOpen}
      />

      <StatsPanel metrics={viewModel.metrics} />
      <CardCountingReferencePanel reference={countReference} />
      <StrategyReferencePanel reference={strategyReference} />

      <CashOutModal
        cashOut={controller.cashOutMessage}
        isOpen={controller.isCashOutOpen}
        onDismiss={controller.closeCashOut}
      />
      <NextHandWagerModal isOpen={controller.nextWagerPromptOpen} wager={nextWager} onChoose={controller.chooseNextWager} />
      <InsuranceOfferModal
        insuranceAmountLabel={viewModel.insuranceOffer?.amountLabel ?? "$0.00"}
        trueCountLabel={viewModel.insuranceOffer?.trueCountLabel ?? "—"}
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
