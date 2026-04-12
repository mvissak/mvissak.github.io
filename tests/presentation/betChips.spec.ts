import { describe, expect, test } from "vitest";
import { buildBetChipStacks } from "@/presentation/view-models/betChips";

describe("buildBetChipStacks", () => {
  test("breaks a bet into descending chip denominations with larger chips at the bottom", () => {
    const stacks = buildBetChipStacks("hand-1", 30, false);

    expect(stacks).toHaveLength(1);
    expect(stacks[0].denominations).toEqual([25, 5]);
  });

  test("creates two matching chip stacks when a hand has doubled", () => {
    const stacks = buildBetChipStacks("hand-1", 60, true);

    expect(stacks.map((stack) => stack.denominations)).toEqual([
      [25, 5],
      [25, 5],
    ]);
  });

  test("uses higher-value chips when the wager matches a larger denomination", () => {
    const stacks = buildBetChipStacks("hand-1", 1000, false);

    expect(stacks).toHaveLength(1);
    expect(stacks[0].denominations).toEqual([1000]);
  });

  test("supports the larger catalog denominations for future table variants", () => {
    const stacks = buildBetChipStacks("hand-1", 5000, false);

    expect(stacks).toHaveLength(1);
    expect(stacks[0].denominations).toEqual([5000]);
  });
});
