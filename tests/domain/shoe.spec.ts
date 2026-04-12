import { describe, expect, test } from "vitest";
import { Shoe } from "@/domain/Shoe";
import { blackjackRules } from "@/domain/blackjackRules";
import { FixedRandomSource } from "@tests/helpers";

describe("shoe entity", () => {
  test("initializes with exactly 312 cards", () => {
    const shoe = Shoe.create(new FixedRandomSource([0.5]));

    expect(shoe.totalCards()).toBe(
      blackjackRules.deckCount * blackjackRules.cardsPerDeck,
    );
  });

  test("contains exactly six copies of each unique rank-suit card", () => {
    const shoe = new Shoe({ randomSource: new FixedRandomSource([0.5]) });
    const counts = shoe.snapshot().cards.reduce<Record<string, number>>((map, card) => {
      const key = `${card.rank}-${card.suit}`;
      map[key] = (map[key] ?? 0) + 1;
      return map;
    }, {});

    expect(Object.values(counts)).toHaveLength(52);
    expect(new Set(Object.values(counts))).toEqual(new Set([6]));
  });

  test("does not replace cards once drawn", () => {
    const shoe = new Shoe({ randomSource: new FixedRandomSource([0.5]) });
    const first = shoe.drawCard();
    const second = shoe.drawCard();

    expect(first.id).not.toBe(second.id);
    expect(shoe.remainingCards()).toBe(310);
  });

  test("shuffle changes the order of the shoe", () => {
    const shoe = new Shoe({ randomSource: new FixedRandomSource([0]) });
    const initialOrder = shoe.snapshot().cards.map((card) => card.id);

    shoe.shuffle();

    expect(shoe.snapshot().cards.map((card) => card.id)).not.toEqual(initialOrder);
  });

  test("places the cut card between 70% and 80% penetration", () => {
    const shoe = Shoe.create(new FixedRandomSource([0.5]));
    const cutCardIndex = shoe.getCutCardIndex();
    const penetration = cutCardIndex / shoe.totalCards();

    expect(penetration).toBeGreaterThanOrEqual(0.7);
    expect(penetration).toBeLessThanOrEqual(0.8);
  });

  test("reshuffle rebuilds a fresh full shoe", () => {
    const shoe = Shoe.create(new FixedRandomSource([0.5]));
    shoe.drawCard();
    shoe.drawCard();

    shoe.reshuffle();

    expect(shoe.totalCards()).toBe(312);
    expect(shoe.getDrawIndex()).toBe(0);
    expect(shoe.needsReshuffle()).toBe(false);
  });
});
