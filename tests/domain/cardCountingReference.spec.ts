import { describe, expect, test } from "vitest";
import { hiLoIndices } from "@/domain/cardCountingReference";

describe("Hi-Lo educational indices", () => {
  test.each([
    { total: 16, dealer: "10", minimum: 0, action: "stand" },
    { total: 12, dealer: "2", minimum: 3, action: "stand" },
    { total: 15, dealer: "10", minimum: 4, action: "stand" },
    { total: 16, dealer: "9", minimum: 5, action: "stand" },
    { total: 10, dealer: "A", minimum: 4, action: "double" },
    { total: 9, dealer: "7", minimum: 3, action: "double" },
  ] as const)("keeps hard $total vs $dealer at true count $minimum", ({ total, dealer, minimum, action }) => {
    expect(hiLoIndices.find((index) =>
      index.kind === "hard" && index.total === total && index.dealerUpcard === dealer,
    )).toMatchObject({ minimumTrueCount: minimum, action });
  });

  test("uses verified insurance and ten-pair study thresholds", () => {
    expect(hiLoIndices.find((index) => index.kind === "insurance"))
      .toMatchObject({ minimumTrueCount: 3, dealerUpcard: "A" });
    expect(hiLoIndices.find((index) => index.kind === "pair" && index.dealerUpcard === "6"))
      .toMatchObject({ minimumTrueCount: 4, action: "split" });
    expect(hiLoIndices.find((index) => index.kind === "pair" && index.dealerUpcard === "5"))
      .toMatchObject({ minimumTrueCount: 5, action: "split" });
  });
});
