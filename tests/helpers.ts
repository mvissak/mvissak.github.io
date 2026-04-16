import { BlackjackTrainer } from "@/application/BlackjackTrainer";
import { Shoe } from "@/domain/Shoe";
import type { Card, RandomSource, Rank, Suit } from "@/domain/types";

export class FixedRandomSource implements RandomSource {
  private index = 0;

  constructor(private readonly values: number[] = [0.5]) {}

  next(): number {
    const current =
      this.values[this.index] ?? this.values[this.values.length - 1] ?? 0.5;
    this.index += 1;
    return current;
  }
}

let cardSequence = 1;

export const createCard = (
  rank: Rank,
  suit: Suit = "spades",
  label?: string,
): Card => ({
  id: label ?? `test-${cardSequence++}-${rank}-${suit}`,
  rank,
  suit,
});

export const createTrainerWithCards = (
  cards: Card[],
  cutCardIndex = cards.length - 1,
  defaultWagerAmount?: number,
): BlackjackTrainer =>
  new BlackjackTrainer({
    defaultWagerAmount,
    randomSource: new FixedRandomSource([0.5]),
    shoeFactory: (randomSource) => Shoe.fromOrderedCards(cards, randomSource, cutCardIndex),
  });
