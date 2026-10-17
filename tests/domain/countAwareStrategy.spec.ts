import { describe, expect, test } from "vitest";
import { getTrueCount } from "@/domain/cardCounting";
import { deriveHandStatus, getAllowedActions } from "@/domain/round";
import { getCountAwareStrategyDecision, getCountInsuranceGuidance, isCountInsuranceAllowed } from "@/domain/strategy";
import type { Rank } from "@/domain/types";
import { createCard } from "@tests/helpers";

const decision = (ranks: ReadonlyArray<Rank>, dealer: Rank, trueCount: number | null, totalHands = 1) => {
  const cards = ranks.map((rank) => createCard(rank));
  const hand = { cards, bet: 25, hasDoubled: false, originatedFromSplit: false, status: deriveHandStatus(cards, false) };
  return getCountAwareStrategyDecision(cards, createCard(dealer), getAllowedActions(hand, totalHands), trueCount);
};

describe("count-aware strategy", () => {
  test("normalizes by remaining decks and handles an exhausted shoe", () => {
    expect(getTrueCount(6, 156)).toBe(2);
    expect(getTrueCount(-6, 156)).toBe(-2);
    expect(getTrueCount(6, 0)).toBeNull();
  });

  test.each([
    { cards: ["10", "6"], dealer: "10", count: 0, actions: ["hit", "stand"] },
    { cards: ["10", "6"], dealer: "10", count: -0.01, actions: ["hit"] },
    { cards: ["4", "5"], dealer: "2", count: 1, actions: ["hit", "double"] },
    { cards: ["4", "5"], dealer: "2", count: 0.99, actions: ["hit"] },
    { cards: ["10", "2"], dealer: "2", count: 3, actions: ["hit", "stand"] },
    { cards: ["10", "2"], dealer: "2", count: 2.999, actions: ["hit"] },
    { cards: ["10", "5"], dealer: "10", count: 4, actions: ["hit", "stand"] },
    { cards: ["10", "2"], dealer: "5", count: -2, actions: ["stand"] },
    { cards: ["10", "2"], dealer: "5", count: -2.01, actions: ["stand", "hit"] },
    { cards: ["10", "3"], dealer: "2", count: -1.01, actions: ["stand", "hit"] },
    { cards: ["10", "10"], dealer: "6", count: 4, actions: ["stand", "split"] },
    { cards: ["5", "5"], dealer: "A", count: 4, actions: ["hit", "double"] },
  ] as const)("accepts $actions for $cards vs $dealer at true count $count", ({ cards, dealer, count, actions }) => {
    expect(decision(cards, dealer, count).acceptedActions).toEqual(actions);
  });

  test("preserves pair precedence, soft-hand rules, and action eligibility", () => {
    expect(decision(["6", "6"], "2", 3).acceptedActions).toEqual(["split"]);
    expect(decision(["8", "8"], "10", 5).acceptedActions).toEqual(["split"]);
    expect(decision(["A", "7"], "10", 20).acceptedActions).toEqual(["hit"]);
    expect(decision(["A", "A"], "3", 20, 4).acceptedActions).toEqual(["hit"]);
    expect(decision(["2", "3", "4"], "2", 5).acceptedActions).toEqual(["hit"]);
    expect(decision(["10", "10"], "6", 5, 4).acceptedActions).toEqual(["stand"]);
    expect(decision(["10", "Q"], "6", 5).acceptedActions).toEqual(["stand"]);
  });

  test("gates insurance at an unrounded true count of +3", () => {
    expect(isCountInsuranceAllowed(null)).toBe(false);
    expect(isCountInsuranceAllowed(2.999)).toBe(false);
    expect(isCountInsuranceAllowed(3)).toBe(true);
    expect(isCountInsuranceAllowed(5)).toBe(true);
    expect(getCountInsuranceGuidance(2.999)).toBeNull();
    expect(getCountInsuranceGuidance(3)?.explanation).toContain("3 or higher");
    expect(getCountInsuranceGuidance(3)?.rationale).toContain("hole card is worth ten");
  });

  test("explains why the supported count play differs from the chart", () => {
    const stand = decision(["10", "6"], "10", 1);
    expect(stand.countExplanation).toContain("at or above 0");
    expect(stand.countRationale).toContain("risk of busting");
    const hit = decision(["10", "2"], "4", -1);
    expect(hit.countExplanation).toContain("below 0");
    expect(hit.countRationale).toContain("fewer ten-value cards");
    expect(decision(["4", "5"], "2", 2).countRationale).toContain("doubled wager");
    expect(decision(["10", "10"], "6", 5).countRationale).toContain("separately wagered hands");
    expect(decision(["10", "6"], "10", -1).countRationale).toBeNull();
  });
});
