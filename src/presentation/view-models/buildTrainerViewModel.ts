import { getHandValue } from "@/domain/hand";
import { getAllowedActions } from "@/domain/round";
import type { TrainerState } from "@/application/trainerState";
import type { Card, PlayerAction, RoundResult } from "@/domain/types";
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
  badgeTone?: TrainerViewOutcomeTone;
  betChipStacks?: TrainerViewBetStack[];
  detail?: string | null;
  cards: TrainerViewCard[];
  isActive: boolean;
  outcomeCallout?: TrainerViewOutcomeCallout | null;
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

export type TrainerViewOutcomeTone = "default" | "success" | "danger" | "push" | "blackjack";

export interface TrainerViewOutcomeCallout {
  amountLabel?: string;
  detail?: string | null;
  eyebrow?: string;
  headline: string;
  tone: TrainerViewOutcomeTone;
}

export interface TrainerViewModel {
  loading: boolean;
  headerSummary: string;
  bannerMessage: string | null;
  roundOutcome: TrainerViewOutcomeCallout | null;
  dealerHand: TrainerViewHand | null;
  playerHands: TrainerViewHand[];
  actions: TrainerViewAction[];
  metrics: TrainerViewMetric[];
  correction: TrainerViewCorrection | null;
  insuranceOffer: TrainerViewInsuranceOffer | null;
}

export interface TrainerViewModelOptions {
  dealerVisibleCardCount?: number | null;
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

const formatMoneyDelta = (value: number): string => {
  if (value > 0) {
    return `+${formatMoney(value)}`;
  }

  if (value < 0) {
    return `-${formatMoney(Math.abs(value))}`;
  }

  return formatMoney(0);
};

const getOutcomeTone = (outcome: RoundResult): TrainerViewOutcomeTone => {
  switch (outcome) {
    case "win":
      return "success";
    case "loss":
      return "danger";
    case "push":
      return "push";
    case "blackjack":
      return "blackjack";
  }
};

const getOutcomeHeadline = (outcome: RoundResult): string => {
  switch (outcome) {
    case "win":
      return "Win";
    case "loss":
      return "Loss";
    case "push":
      return "Push";
    case "blackjack":
      return "Blackjack";
  }
};

const buildHandOutcomeCallout = (
  outcome: RoundResult,
  netResult: number,
  summary: string | null,
): TrainerViewOutcomeCallout => ({
  amountLabel: formatMoneyDelta(netResult),
  detail: summary,
  headline: getOutcomeHeadline(outcome),
  tone: getOutcomeTone(outcome),
});

const pluralize = (count: number, singular: string, plural: string): string =>
  `${count} ${count === 1 ? singular : plural}`;

const buildRoundOutcome = (state: TrainerState): TrainerViewOutcomeCallout | null => {
  if (state.phase !== "roundResolved" || !state.round) {
    return null;
  }

  const resolvedHands = state.round.playerHands.filter((hand) => hand.outcome !== null);

  if (resolvedHands.length === 0) {
    return null;
  }

  if (resolvedHands.length === 1) {
    const hand = resolvedHands[0];

    return {
      ...buildHandOutcomeCallout(hand.outcome as RoundResult, hand.netResult, state.bannerMessage),
      eyebrow: "Round Result",
    };
  }

  const totalNet = resolvedHands.reduce((sum, hand) => sum + hand.netResult, 0);
  const counts = resolvedHands.reduce(
    (accumulator, hand) => {
      const outcome = hand.outcome as RoundResult;
      accumulator[outcome] += 1;
      return accumulator;
    },
    { blackjack: 0, loss: 0, push: 0, win: 0 },
  );
  const detailParts = [
    counts.blackjack > 0 ? pluralize(counts.blackjack, "blackjack", "blackjacks") : null,
    counts.win > 0 ? pluralize(counts.win, "win", "wins") : null,
    counts.loss > 0 ? pluralize(counts.loss, "loss", "losses") : null,
    counts.push > 0 ? pluralize(counts.push, "push", "pushes") : null,
    state.bannerMessage,
  ].filter(Boolean);

  return {
    amountLabel: formatMoneyDelta(totalNet),
    detail: detailParts.join(" • "),
    eyebrow: "Round Result",
    headline: totalNet > 0 ? "Round Win" : totalNet < 0 ? "Round Loss" : "Round Push",
    tone: totalNet > 0 ? "success" : totalNet < 0 ? "danger" : "push",
  };
};

export const buildTrainerViewModel = (
  state: TrainerState | null,
  options: TrainerViewModelOptions = {},
): TrainerViewModel => {
  if (!state || !state.round) {
    return {
      loading: true,
      headerSummary: "Preparing the table.",
      bannerMessage: null,
      roundOutcome: null,
      dealerHand: null,
      playerHands: [],
      actions: [],
      metrics: [],
      correction: null,
      insuranceOffer: null,
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

  const dealerVisibleCards = dealerCardsForDisplay.map((card, index) => ({
    ...card,
    faceDown: round.dealerHoleHidden && index === 1,
  }));
  const dealerVisibleValue = round.dealerHoleHidden
    ? `Upcard ${round.dealerCards[0].rank}`
    : `Total ${getHandValue(dealerCardsForDisplay).total}`;

  return {
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
    roundOutcome: suppressResolvedOutcome ? null : buildRoundOutcome(state),
    dealerHand: {
      id: "dealer",
      title: "Dealer",
      subtitle: round.dealerHoleHidden
        ? undefined
        : suppressResolvedOutcome
          ? "Hole card is revealing before dealer draws continue."
          : "Dealer hand resolved.",
      totalLabel: dealerVisibleValue,
      cards: dealerVisibleCards,
      isActive: false,
      detail: undefined,
    },
    playerHands: round.playerHands.map((hand, index) => {
      const handValue = getHandValue(hand.cards);
      const outcomeCallout =
        hand.outcome !== null && !suppressResolvedOutcome
          ? buildHandOutcomeCallout(hand.outcome, hand.netResult, hand.summary)
          : null;
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
        badgeTone:
          hand.status === "playing" || hand.status === "awaitingDeal" ? "default" : undefined,
        betChipStacks: buildBetChipStacks(hand.id, hand.bet, hand.hasDoubled),
        cards: hand.cards.map((card) => ({
          ...card,
          faceDown: false,
        })),
        isActive: state.phase === "playerTurn" && index === round.activeHandIndex,
        detail: suppressResolvedOutcome ? null : outcomeCallout ? null : hand.summary,
        outcomeCallout,
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
  };
};
