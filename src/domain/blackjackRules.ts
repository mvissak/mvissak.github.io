export const blackjackRules = {
  deckCount: 6,
  cardsPerDeck: 52,
  cutCardPenetration: {
    min: 0.7,
    max: 0.8,
  },
  blackjackPayout: 1.5,
  minimumWagerAmount: 25,
  maximumWagerAmount: 1000,
  dealerStandsOnSoft17: true,
  doubleOnAnyTwoCards: true,
  doubleAfterSplit: true,
  noSurrender: true,
  maxHandsPerRound: 4,
} as const;
