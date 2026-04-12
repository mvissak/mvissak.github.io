import { describe, expect, test } from "vitest";
import { deriveHandStatus, getAllowedActions } from "@/domain/round";
import { createCard } from "@tests/helpers";

describe("allowed actions", () => {
  test("allows hit, stand, double, and split on an opening pair", () => {
    const hand = {
      cards: [createCard("8"), createCard("8", "hearts")],
      bet: 25,
      hasDoubled: false,
      originatedFromSplit: false,
      status: "playing" as const,
    };

    expect(getAllowedActions(hand, 1)).toEqual({
      hit: true,
      stand: true,
      double: true,
      split: true,
    });
  });

  test("removes double and split after the hand already drew a card", () => {
    const cards = [createCard("5"), createCard("4", "hearts"), createCard("2", "clubs")];
    const hand = {
      cards,
      bet: 25,
      hasDoubled: false,
      originatedFromSplit: false,
      status: deriveHandStatus(cards, false),
    };

    expect(getAllowedActions(hand, 1)).toEqual({
      hit: true,
      stand: true,
      double: false,
      split: false,
    });
  });

  test("blocks all actions on a busted hand", () => {
    const cards = [createCard("10"), createCard("9", "hearts"), createCard("5", "clubs")];
    const hand = {
      cards,
      bet: 25,
      hasDoubled: false,
      originatedFromSplit: false,
      status: deriveHandStatus(cards, false),
    };

    expect(getAllowedActions(hand, 1)).toEqual({
      hit: false,
      stand: false,
      double: false,
      split: false,
    });
  });
});
