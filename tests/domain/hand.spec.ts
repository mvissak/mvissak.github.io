import { describe, expect, test } from "vitest";
import { getHandValue, isPair } from "@/domain/hand";
import { createCard } from "@tests/helpers";

describe("hand evaluation", () => {
  test("calculates hard hand totals", () => {
    const value = getHandValue([createCard("10"), createCard("7", "hearts")]);

    expect(value.total).toBe(17);
    expect(value.isSoft).toBe(false);
    expect(value.isBust).toBe(false);
  });

  test("detects soft and hard ace behavior correctly", () => {
    const softValue = getHandValue([createCard("A"), createCard("6", "clubs")]);
    const hardValue = getHandValue([
      createCard("A", "diamonds"),
      createCard("6", "hearts"),
      createCard("10", "clubs"),
    ]);

    expect(softValue.total).toBe(17);
    expect(softValue.isSoft).toBe(true);
    expect(hardValue.total).toBe(17);
    expect(hardValue.isSoft).toBe(false);
  });

  test("detects pairs from two-card hands", () => {
    expect(isPair([createCard("8"), createCard("8", "hearts")])).toBe(true);
    expect(isPair([createCard("8"), createCard("9", "hearts")])).toBe(false);
    expect(isPair([createCard("Q"), createCard("Q", "hearts")])).toBe(true);
    expect(isPair([createCard("10"), createCard("Q", "hearts")])).toBe(false);
  });
});
