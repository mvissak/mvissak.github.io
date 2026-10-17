import type { Card, Rank } from "@/domain/types";
import { blackjackRules } from "@/domain/blackjackRules";

export const getTrueCount = (runningCount: number, cardsRemaining: number): number | null =>
  cardsRemaining > 0 ? runningCount / (cardsRemaining / blackjackRules.cardsPerDeck) : null;

export type CountDirection = "positive" | "neutral" | "negative";

export const getCountDirection = (count: number): CountDirection =>
  count > 0 ? "positive" : count < 0 ? "negative" : "neutral";

const hiLoValues: Readonly<Record<Rank, -1 | 0 | 1>> = {
  "2": 1,
  "3": 1,
  "4": 1,
  "5": 1,
  "6": 1,
  "7": 0,
  "8": 0,
  "9": 0,
  "10": -1,
  J: -1,
  Q: -1,
  K: -1,
  A: -1,
};

export const getHiLoValue = (rank: Rank): -1 | 0 | 1 => hiLoValues[rank];

export const countCards = (cards: ReadonlyArray<Card>): number => {
  const countedIds = new Set<string>();
  let count = 0;

  for (const card of cards) {
    if (!countedIds.has(card.id)) {
      countedIds.add(card.id);
      count += getHiLoValue(card.rank);
    }
  }

  return count;
};
