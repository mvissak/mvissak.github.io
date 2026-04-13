import { describe, expect, test } from "vitest";
import { getBasicStrategyDecision, getBasicStrategyReference } from "@/domain/strategy";
import { createCard } from "@tests/helpers";

const fullActions = {
  hit: true,
  stand: true,
  double: true,
  split: true,
} as const;

describe("basic strategy engine", () => {
  test("resolves representative hard, soft, and pair hands", () => {
    const hardDecision = getBasicStrategyDecision(
      [createCard("10"), createCard("6", "hearts")],
      createCard("6", "clubs"),
      fullActions,
    );
    const softDecision = getBasicStrategyDecision(
      [createCard("A"), createCard("7", "hearts")],
      createCard("3", "clubs"),
      fullActions,
    );
    const pairDecision = getBasicStrategyDecision(
      [createCard("8"), createCard("8", "hearts")],
      createCard("10", "clubs"),
      fullActions,
    );

    expect(hardDecision.action).toBe("stand");
    expect(softDecision.action).toBe("double");
    expect(pairDecision.action).toBe("split");
  });

  test("falls back from D to hit when doubling is unavailable", () => {
    const decision = getBasicStrategyDecision(
      [createCard("4"), createCard("5", "hearts")],
      createCard("3", "clubs"),
      { hit: true, stand: true, double: false, split: false },
    );

    expect(decision.code).toBe("D");
    expect(decision.action).toBe("hit");
    expect(decision.fallbackApplied).toBe(true);
  });

  test("falls back from Ds to stand when doubling is unavailable", () => {
    const decision = getBasicStrategyDecision(
      [createCard("A"), createCard("7", "hearts")],
      createCard("3", "clubs"),
      { hit: true, stand: true, double: false, split: false },
    );

    expect(decision.code).toBe("Ds");
    expect(decision.action).toBe("stand");
    expect(decision.fallbackApplied).toBe(true);
    expect(decision.explanation).toContain(
      "double if allowed, otherwise stand against dealer upcards 3, 4, 5, or 6",
    );
  });

  test("stands on A,7 against dealer 2 even when doubling is available", () => {
    const decision = getBasicStrategyDecision(
      [createCard("A"), createCard("7", "hearts")],
      createCard("2", "clubs"),
      fullActions,
    );

    expect(decision.code).toBe("S");
    expect(decision.action).toBe("stand");
    expect(decision.fallbackApplied).toBe(false);
  });

  test("treats 5,5 as hard 10 instead of a split pair", () => {
    const decision = getBasicStrategyDecision(
      [createCard("5"), createCard("5", "hearts")],
      createCard("6", "clubs"),
      fullActions,
    );

    expect(decision.handKind).toBe("hard");
    expect(decision.action).toBe("double");
  });

  test("always stands on 10,10, A,8, and A,9", () => {
    const tenPair = getBasicStrategyDecision(
      [createCard("10"), createCard("K", "hearts")],
      createCard("6", "clubs"),
      fullActions,
    );
    const softNineteen = getBasicStrategyDecision(
      [createCard("A"), createCard("8", "hearts")],
      createCard("A", "clubs"),
      fullActions,
    );
    const softTwenty = getBasicStrategyDecision(
      [createCard("A"), createCard("9", "hearts")],
      createCard("10", "clubs"),
      fullActions,
    );

    expect(tenPair.action).toBe("stand");
    expect(softNineteen.action).toBe("stand");
    expect(softTwenty.action).toBe("stand");
  });

  test("treats mixed ten-value opening hands as hard totals, not splittable pairs", () => {
    const decision = getBasicStrategyDecision(
      [createCard("10"), createCard("Q", "hearts")],
      createCard("7", "clubs"),
      { hit: true, stand: true, double: true, split: false },
    );

    expect(decision.handKind).toBe("hard");
    expect(decision.action).toBe("stand");
  });

  test("includes the broader row rule in the explanation text", () => {
    const decision = getBasicStrategyDecision(
      [createCard("A"), createCard("7", "hearts")],
      createCard("3", "clubs"),
      fullActions,
    );

    expect(decision.explanation).toContain(
      "General rule: with A,7, stand against dealer upcards 2; double if allowed, otherwise stand against dealer upcards 3, 4, 5, or 6; stand against dealer upcards 7 or 8; hit against dealer upcards 9, 10, or A.",
    );
  });

  test("builds a plain-English reference from the tracked total-based chart", () => {
    const reference = getBasicStrategyReference();
    const hardTotals = reference.sections.find((section) => section.title === "Hard Totals");
    const softTotals = reference.sections.find((section) => section.title === "Soft Totals");
    const pairs = reference.sections.find((section) => section.title === "Pairs");

    expect(reference.assumptions).toContain(
      "Composition-dependent deviations are not used. A multi-card hard or soft total is played the same way as the same total built from two cards unless the chart itself changes because doubling or splitting is no longer allowed.",
    );
    expect(reference.assumptions).toContain(
      "Splits are only offered on identical ranks. Mixed ten-value hands such as Q,10 are treated as hard totals, not as pairs.",
    );
    expect(hardTotals?.rows.find((row) => row.label === "Hard 16")?.summary).toBe(
      "stand against dealer upcards 2, 3, 4, 5, or 6; hit against dealer upcards 7, 8, 9, 10, or A.",
    );
    expect(softTotals?.rows.find((row) => row.label === "Soft A,7")?.summary).toBe(
      "stand against dealer upcards 2; double if allowed, otherwise stand against dealer upcards 3, 4, 5, or 6; stand against dealer upcards 7 or 8; hit against dealer upcards 9, 10, or A.",
    );
    expect(pairs?.rows.find((row) => row.label === "Pair 5,5")?.summary).toBe(
      "double if allowed, otherwise hit against dealer upcards 2, 3, 4, 5, 6, 7, 8, or 9; hit against dealer upcards 10 or A.",
    );
  });
});
