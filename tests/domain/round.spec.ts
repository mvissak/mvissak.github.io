import { describe, expect, test } from "vitest";
import { deriveHandStatus, getAllowedActions, settleHand, shouldDealerPlay } from "@/domain/round";
import type { PlayerRoundHand } from "@/domain/round";
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

  test("does not allow split on mixed ten-value cards", () => {
    const hand = {
      cards: [createCard("10"), createCard("Q", "hearts")],
      bet: 25,
      hasDoubled: false,
      originatedFromSplit: false,
      status: "playing" as const,
    };

    expect(getAllowedActions(hand, 1)).toEqual({
      hit: true,
      stand: true,
      double: true,
      split: false,
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

  test("skips dealer play when every player hand is busted", () => {
    expect(
      shouldDealerPlay([
        { cards: [createCard("10"), createCard("9", "hearts"), createCard("5", "clubs")] },
        { cards: [createCard("8"), createCard("9", "diamonds"), createCard("6", "spades")] },
      ]),
    ).toBe(false);
  });

  test("requires dealer play when at least one player hand survives", () => {
    expect(
      shouldDealerPlay([
        { cards: [createCard("10"), createCard("9", "hearts"), createCard("5", "clubs")] },
        { cards: [createCard("10"), createCard("7", "diamonds")] },
      ]),
    ).toBe(true);
  });
});

describe("blackjack payouts", () => {
  test.each([
    { payout: "6:5", bet: 25, net: 30 },
    { payout: "3:2", bet: 25, net: 37.5 },
    { payout: "6:5", bet: 41, net: 49.2 },
    { payout: "3:2", bet: 41, net: 61.5 },
  ] as const)("pays $net on a $bet natural at $payout", ({ payout, bet, net }) => {
    const hand: PlayerRoundHand = {
      cards: [createCard("A"), createCard("K")],
      bet,
      hasDoubled: false,
      originatedFromSplit: false,
      status: "blackjack",
    };

    expect(settleHand(hand, [createCard("10"), createCard("9")], payout)).toEqual({
      result: "blackjack",
      net,
      summary: `Blackjack pays ${payout}.`,
    });
  });

  test.each(["6:5", "3:2"] as const)("preserves pushes and even-money split wins at %s", (payout) => {
    const hand: PlayerRoundHand = {
      cards: [createCard("A"), createCard("K")],
      bet: 25,
      hasDoubled: false,
      originatedFromSplit: false,
      status: "blackjack",
    };

    expect(settleHand(hand, [createCard("A"), createCard("Q")], payout).net).toBe(0);
    expect(settleHand(
      { ...hand, originatedFromSplit: true, status: "stood" },
      [createCard("10"), createCard("9")],
      payout,
    )).toMatchObject({ result: "win", net: 25 });
    expect(settleHand(
      { ...hand, cards: [createCard("7"), createCard("7"), createCard("7")], status: "stood" },
      [createCard("10"), createCard("9")],
      payout,
    )).toMatchObject({ result: "win", net: 25 });
  });
});
