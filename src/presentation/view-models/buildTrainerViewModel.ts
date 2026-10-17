import { getHandValue } from "@/domain/hand";
import { blackjackRules } from "@/domain/blackjackRules";
import { getAllowedActions } from "@/domain/round";
import type { TrainerState } from "@/application/trainerState";
import type { Card, PlayerAction } from "@/domain/types";
import { buildBetChipStacks, type TrainerViewBetStack } from "@/presentation/view-models/betChips";

export interface TrainerViewCard extends Card {
  faceDown?: boolean;
}

export interface TrainerViewHand {
  id: string;
  title: string;
  subtitle?: string;
  totalLabel: string;
  badge?: string;
  betChipStacks?: TrainerViewBetStack[];
  detail?: string | null;
  cards: TrainerViewCard[];
  isActive: boolean;
}

export interface TrainerViewAction {
  id: PlayerAction;
  label: string;
  emphasis: "primary" | "secondary";
}

export interface TrainerViewMetric {
  label: string;
  value: string;
}

export interface TrainerViewCorrection {
  incorrectLabel: string;
  recommendedLabel: string;
  explanation: string;
}

export interface TrainerViewInsuranceOffer {
  amountLabel: string;
}

export interface TrainerViewModel {
  blackjackPayoutLabel: string;
  loading: boolean;
  headerSummary: string;
  bannerMessage: string | null;
  dealerHand: TrainerViewHand | null;
  playerHands: TrainerViewHand[];
  actions: TrainerViewAction[];
  metrics: TrainerViewMetric[];
  correction: TrainerViewCorrection | null;
  insuranceOffer: TrainerViewInsuranceOffer | null;
  roundResultAmountLabel: string | null;
}

export interface TrainerViewModelOptions {
  dealerVisibleCardCount?: number | null;
  revealDealerHoleCard?: boolean;
  suppressResolvedOutcome?: boolean;
}

const actionLabels: Record<PlayerAction, string> = {
  hit: "Hit",
  stand: "Stand",
  double: "Double",
  split: "Split",
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);

const formatAccuracy = (correct: number, total: number): string => {
  if (total === 0) {
    return "100%";
  }

  return `${Math.round((correct / total) * 100)}%`;
};

const formatRoundResultAmount = (value: number): string | null => {
  const absoluteValue = Math.abs(value);

  if (absoluteValue === 0) {
    return null;
  }

  const hasFractionalCents = Math.round(absoluteValue * 100) % 100 !== 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasFractionalCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(absoluteValue);
};

export const buildTrainerViewModel = (
  state: TrainerState | null,
  options: TrainerViewModelOptions = {},
): TrainerViewModel => {
  if (!state || !state.round) {
    return {
      blackjackPayoutLabel: state?.blackjackPayout ?? blackjackRules.defaultBlackjackPayout,
      loading: true,
      headerSummary: "Preparing the table.",
      bannerMessage: null,
      dealerHand: null,
      playerHands: [],
      actions: [],
      metrics: [],
      correction: null,
      insuranceOffer: null,
      roundResultAmountLabel: null,
    };
  }

  const round = state.round;
  const suppressResolvedOutcome =
    state.phase === "roundResolved" && options.suppressResolvedOutcome === true;
  const activeHand = round.playerHands[round.activeHandIndex];
  const allowedActions =
    state.phase === "playerTurn" ? getAllowedActions(activeHand, round.playerHands.length) : null;
  const dealerCardsForDisplay =
    state.phase === "roundResolved" && options.dealerVisibleCardCount
      ? round.dealerCards.slice(0, options.dealerVisibleCardCount)
      : round.dealerCards;
  const shouldHideDealerHoleCard =
    round.dealerHoleHidden && options.revealDealerHoleCard !== true;

  const dealerVisibleCards = dealerCardsForDisplay.map((card, index) => ({
    ...card,
    faceDown: shouldHideDealerHoleCard && index === 1,
  }));
  const dealerVisibleValue = shouldHideDealerHoleCard
    ? `Upcard ${round.dealerCards[0].rank}`
    : `Total ${getHandValue(dealerCardsForDisplay).total}`;
  const roundResultAmountLabel =
    state.phase === "roundResolved"
      ? formatRoundResultAmount(
          round.playerHands
            .filter((hand) => hand.outcome !== null)
            .reduce((sum, hand) => sum + hand.netResult, 0),
        )
      : null;

  return {
    blackjackPayoutLabel: round.blackjackPayout,
    loading: false,
    headerSummary:
      suppressResolvedOutcome
        ? "Dealer resolving..."
        : state.phase === "insuranceDecision"
          ? "Insurance decision pending."
        : state.phase === "roundResolved"
        ? round.resultSummary ?? "Hand complete."
        : "Choose the correct basic strategy move to continue.",
    bannerMessage: suppressResolvedOutcome ? null : state.bannerMessage,
    dealerHand: {
      id: "dealer",
      title: "Dealer",
      subtitle: undefined,
      totalLabel: dealerVisibleValue,
      cards: dealerVisibleCards,
      isActive: false,
      detail: undefined,
    },
    playerHands: round.playerHands.map((hand, index) => {
      const handValue = getHandValue(hand.cards);
      const badge =
        hand.outcome === null
          ? hand.status === "awaitingDeal"
            ? "Waiting"
            : hand.status === "playing"
            ? "Active"
            : hand.status === "stood"
              ? "Standing"
              : hand.status === "busted"
                ? "Busted"
                : hand.status === "blackjack"
                  ? "Blackjack"
                  : undefined
          : undefined;

      return {
        id: hand.id,
        title: round.playerHands.length > 1 ? `Player Hand ${index + 1}` : "Player",
        subtitle: undefined,
        totalLabel:
          hand.status === "awaitingDeal"
            ? "Awaiting split card"
            : `Total ${handValue.total}${handValue.isSoft ? " (soft)" : ""}`,
        badge,
        betChipStacks: buildBetChipStacks(hand.id, hand.bet, hand.hasDoubled),
        cards: hand.cards.map((card) => ({
          ...card,
          faceDown: false,
        })),
        isActive: state.phase === "playerTurn" && index === round.activeHandIndex,
        detail: state.phase === "roundResolved" || suppressResolvedOutcome ? null : hand.summary,
      };
    }),
    actions: allowedActions
      ? (Object.entries(allowedActions)
          .filter(([, allowed]) => allowed)
          .map(([action]) => {
            const actionId = action as PlayerAction;

            return {
              id: actionId,
              label: actionLabels[actionId],
              emphasis: actionId === "stand" ? "secondary" : "primary",
            };
          }) as TrainerViewAction[])
      : [],
    metrics: [
      { label: "Hands", value: String(state.stats.totalHandsPlayed) },
      {
        label: "First-Try Accuracy",
        value: formatAccuracy(
          state.stats.correctFirstTryDecisions,
          state.stats.decisionPointsResolved,
        ),
      },
      { label: "Mistakes", value: String(state.stats.mistakesMade) },
      { label: "Session Total", value: formatMoney(state.stats.winnings) },
      { label: "Current Streak", value: String(state.stats.currentStreak) },
      { label: "Best Streak", value: String(state.stats.bestStreak) },
    ],
    correction: state.correction
      ? {
          incorrectLabel:
            state.correction.incorrectLabel ??
            actionLabels[state.correction.incorrectAction as PlayerAction],
          recommendedLabel:
            state.correction.recommendedLabel ??
            actionLabels[state.correction.recommendedAction as PlayerAction],
          explanation: state.correction.explanation,
        }
      : null,
    insuranceOffer:
      state.phase === "insuranceDecision"
        ? {
            amountLabel: formatMoney((round.playerHands[0]?.bet ?? 0) * 0.5),
          }
        : null,
    roundResultAmountLabel,
  };
};
