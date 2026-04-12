import { blackjackRules } from "@/domain/blackjackRules";
import type { Card, RandomSource, Rank, Suit } from "@/domain/types";
import { ranks, suits } from "@/domain/types";

export interface ShoeSnapshot {
  cards: Card[];
  drawIndex: number;
  cutCardIndex: number;
  cutCardReached: boolean;
}

interface ShoeOptions {
  randomSource: RandomSource;
  cards?: Card[];
  drawIndex?: number;
  cutCardIndex?: number;
  cutCardReached?: boolean;
}

const buildShoeCards = (): Card[] => {
  const cards: Card[] = [];

  for (let deckNumber = 0; deckNumber < blackjackRules.deckCount; deckNumber += 1) {
    for (const suit of suits) {
      for (const rank of ranks) {
        cards.push({
          id: `${deckNumber + 1}-${rank}-${suit}`,
          rank: rank as Rank,
          suit: suit as Suit,
        });
      }
    }
  }

  return cards;
};

export class Shoe {
  private cards: Card[];

  private drawIndex: number;

  private cutCardIndex: number;

  private cutCardReached: boolean;

  private readonly randomSource: RandomSource;

  constructor(options: ShoeOptions) {
    this.randomSource = options.randomSource;
    this.cards = options.cards ?? buildShoeCards();
    this.drawIndex = options.drawIndex ?? 0;
    this.cutCardIndex = options.cutCardIndex ?? this.randomCutCardIndex(this.cards.length);
    this.cutCardReached = options.cutCardReached ?? false;
  }

  static create(randomSource: RandomSource): Shoe {
    const shoe = new Shoe({ randomSource });
    shoe.shuffle();
    return shoe;
  }

  static fromSnapshot(snapshot: ShoeSnapshot, randomSource: RandomSource): Shoe {
    return new Shoe({
      randomSource,
      cards: snapshot.cards,
      drawIndex: snapshot.drawIndex,
      cutCardIndex: snapshot.cutCardIndex,
      cutCardReached: snapshot.cutCardReached,
    });
  }

  static fromOrderedCards(
    cards: Card[],
    randomSource: RandomSource,
    cutCardIndex = cards.length - 1,
  ): Shoe {
    return new Shoe({
      randomSource,
      cards: [...cards],
      drawIndex: 0,
      cutCardIndex,
      cutCardReached: false,
    });
  }

  drawCard(): Card {
    if (this.drawIndex >= this.cards.length) {
      throw new Error("The shoe is exhausted before a reshuffle could occur.");
    }

    const card = this.cards[this.drawIndex];
    this.drawIndex += 1;

    if (this.drawIndex >= this.cutCardIndex) {
      this.cutCardReached = true;
    }

    return card;
  }

  shuffle(): void {
    for (let index = this.cards.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(this.randomSource.next() * (index + 1));
      const nextCard = this.cards[swapIndex];
      this.cards[swapIndex] = this.cards[index];
      this.cards[index] = nextCard;
    }

    this.drawIndex = 0;
    this.cutCardIndex = this.randomCutCardIndex(this.cards.length);
    this.cutCardReached = false;
  }

  reshuffle(): void {
    this.cards = buildShoeCards();
    this.shuffle();
  }

  needsReshuffle(): boolean {
    return this.cutCardReached;
  }

  remainingCards(): number {
    return this.cards.length - this.drawIndex;
  }

  totalCards(): number {
    return this.cards.length;
  }

  getCutCardIndex(): number {
    return this.cutCardIndex;
  }

  getDrawIndex(): number {
    return this.drawIndex;
  }

  snapshot(): ShoeSnapshot {
    return {
      cards: [...this.cards],
      drawIndex: this.drawIndex,
      cutCardIndex: this.cutCardIndex,
      cutCardReached: this.cutCardReached,
    };
  }

  private randomCutCardIndex(totalCards: number): number {
    const minIndex = Math.ceil(totalCards * blackjackRules.cutCardPenetration.min);
    const maxIndex = Math.floor(totalCards * blackjackRules.cutCardPenetration.max);
    const span = maxIndex - minIndex + 1;

    return minIndex + Math.floor(this.randomSource.next() * span);
  }
}
