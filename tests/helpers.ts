import { BlackjackTrainer } from "@/application/BlackjackTrainer";
import { confirmNextWager } from "@/application/wagerDecision";
import type { TrainerState } from "@/application/trainerState";
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

export const dealNextHand = (trainer: BlackjackTrainer, state: TrainerState): TrainerState =>
  trainer.startNextHand(confirmNextWager(state, "keep"));

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
  cardsAreInShoeOrder = false,
): BlackjackTrainer =>
  new BlackjackTrainer({
    defaultWagerAmount,
    randomSource: new FixedRandomSource([0.5]),
    shoeFactory: (randomSource) => {
      const orderedCards = cardsAreInShoeOrder || cards.length < 4
        ? cards
        : [cards[0], cards[3], cards[2], cards[1], ...cards.slice(4)];
      // Keep realistic remaining-deck estimates while prescribing the first draws.
      const remainingCards = new Shoe({ randomSource }).snapshot().cards;
      for (const card of orderedCards) {
        const index = remainingCards.findIndex((candidate) => candidate.rank === card.rank && candidate.suit === card.suit);
        if (index !== -1) remainingCards.splice(index, 1);
      }
      return Shoe.fromOrderedCards([...orderedCards, ...remainingCards], randomSource, cutCardIndex);
    },
  });
