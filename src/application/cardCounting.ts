import { countCards, getTrueCount } from "@/domain/cardCounting";
import type { PersistedTrainerState, RoundState, TrainerState } from "@/application/trainerState";

const getRoundCards = (round: Pick<RoundState, "playerHands" | "dealerCards">) => [
  ...round.playerHands.flatMap((hand) => hand.cards),
  ...round.dealerCards,
];

export const getDecisionTrueCount = (state: TrainerState): number | null => {
  const round = state.round;
  if (!round) return null;
  const faceUpIds = [
    ...round.playerHands.flatMap((hand) => hand.cards.map((card) => card.id)),
    round.dealerCards[0].id,
  ];
  return getTrueCount(getRunningCount(state, faceUpIds), round.shoeCardsRemaining);
};

export const getDisplayedTrueCount = (state: TrainerState, faceUpIds: ReadonlyArray<string>): number | null => {
  if (!state.round) return null;
  const seenIds = new Set([...state.roundExposedCardIds, ...faceUpIds]);
  const unshownDraws = state.round.dealerCards.slice(2).filter((card) => !seenIds.has(card.id)).length;
  return getTrueCount(getRunningCount(state, faceUpIds), state.round.shoeCardsRemaining + unshownDraws);
};

export const getRunningCount = (
  state: TrainerState,
  faceUpCardIds: ReadonlyArray<string>,
): number => {
  const exposedIds = new Set([...state.roundExposedCardIds, ...faceUpCardIds]);
  const exposedCards = state.round
    ? getRoundCards(state.round).filter((card) => exposedIds.has(card.id))
    : [];

  return state.runningCountBeforeRound + countCards(exposedCards);
};

export const recordExposedCards = (
  state: TrainerState,
  faceUpCardIds: ReadonlyArray<string>,
): TrainerState => {
  if (!state.round) return state;
  const roundIds = new Set(getRoundCards(state.round).map((card) => card.id));
  const recordedIds = new Set(state.roundExposedCardIds);
  const newIds = [...new Set(faceUpCardIds)]
    .filter((id) => roundIds.has(id) && !recordedIds.has(id));

  return newIds.length === 0 ? state : {
    ...state,
    roundExposedCardIds: [...state.roundExposedCardIds, ...newIds],
  };
};

export const getCountBeforeNextRound = (state: TrainerState): number => {
  const round = state.round;
  if (!round) {
    return state.runningCountBeforeRound;
  }

  // The old shoe's final count stays visible through the dealer reveal sequence.
  if (state.phase === "roundResolved" && round.cutCardReachedDuringRound) {
    return 0;
  }

  const roundCards = state.phase === "roundResolved"
    ? getRoundCards(round)
    : [
        ...round.playerHands.flatMap((hand) => hand.cards),
        ...round.dealerCards.filter((_, index) => index !== 1 || !round.dealerHoleHidden),
      ];

  return getRunningCount(state, roundCards.map((card) => card.id));
};

export const restoreCountBeforeRound = (snapshot: PersistedTrainerState): number => {
  const savedCount = snapshot.state.runningCountBeforeRound;
  if (typeof savedCount === "number" && Number.isSafeInteger(savedCount)) {
    return savedCount;
  }

  // Older snapshots have the shoe history but no running count. Prior rounds'
  // cards were exposed; the current round is counted separately as it is shown.
  const round = snapshot.state.round;
  const currentCardIds = new Set(round ? getRoundCards(round).map((card) => card.id) : []);
  return countCards(snapshot.shoe.cards
    .slice(0, snapshot.shoe.drawIndex)
    .filter((card) => !currentCardIds.has(card.id)));
};
