import type { BlackjackPayout } from "@/domain/types";

export const blackjackPayouts: Readonly<Record<BlackjackPayout, number>> = {
  "6:5": 6 / 5,
  "3:2": 3 / 2,
};

export const isBlackjackPayout = (value: unknown): value is BlackjackPayout =>
  value === "6:5" || value === "3:2";

export const blackjackRules = {
  deckCount: 6,
  cardsPerDeck: 52,
  cutCardPenetration: {
    min: 0.7,
    max: 0.8,
  },
  defaultBlackjackPayout: "6:5",
  minimumWagerAmount: 25,
  maximumWagerAmount: 1000,
  dealerStandsOnSoft17: true,
  doubleOnAnyTwoCards: true,
  doubleAfterSplit: true,
  noSurrender: true,
  insuranceWagerFraction: 0.5,
  insurancePayout: 2,
  maxHandsPerRound: 4,
} as const;
