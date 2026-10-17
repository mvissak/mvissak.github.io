import { describe, expect, test } from "vitest";
import { countCards, getCountDirection, getHiLoValue } from "@/domain/cardCounting";
import { createCard } from "@tests/helpers";

describe("Hi-Lo card counting", () => {
  test.each([
    [4, "positive"], [0, "neutral"], [-4, "negative"],
  ] as const)("classifies a count of %s as %s", (count, direction) => {
    expect(getCountDirection(count)).toBe(direction);
  });
  test.each([
    ["2", 1], ["3", 1], ["4", 1], ["5", 1], ["6", 1],
    ["7", 0], ["8", 0], ["9", 0],
    ["10", -1], ["J", -1], ["Q", -1], ["K", -1], ["A", -1],
  ] as const)("counts %s as %s", (rank, value) => {
    expect(getHiLoValue(rank)).toBe(value);
  });

  test("counts each physical card once, including different copies of the same rank", () => {
    const lowCard = createCard("2");
    const otherLowCard = createCard("2");
    const highCard = createCard("K");

    expect(countCards([lowCard, lowCard, otherLowCard, highCard, highCard])).toBe(1);
    expect(countCards([])).toBe(0);
  });
});
