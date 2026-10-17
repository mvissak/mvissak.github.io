import type { TrainerState } from "@/application/trainerState";
import type { Card } from "@/domain/types";

export interface CardVisibilityOptions {
  dealerVisibleCardCount?: number | null;
  revealDealerHoleCard?: boolean;
}

export const getDisplayedDealerCards = (
  state: TrainerState,
  options: CardVisibilityOptions = {},
): Array<Card & { faceDown: boolean }> => {
  const round = state.round;
  if (!round) return [];
  const cards = state.phase === "roundResolved" && options.dealerVisibleCardCount
    ? round.dealerCards.slice(0, options.dealerVisibleCardCount)
    : round.dealerCards;
  const hideHole = round.dealerHoleHidden && options.revealDealerHoleCard !== true;

  return cards.map((card, index) => ({ ...card, faceDown: hideHole && index === 1 }));
};

export const getFaceUpCardIds = (
  state: TrainerState,
  options: CardVisibilityOptions = {},
): string[] => [
  ...(state.round?.playerHands.flatMap((hand) => hand.cards.map((card) => card.id)) ?? []),
  ...getDisplayedDealerCards(state, options).filter((card) => !card.faceDown).map((card) => card.id),
];
