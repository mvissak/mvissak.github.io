import { describe, expect, test } from "vitest";
import { getBasicStrategyDecision } from "@/domain/strategy";
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
      createCard("2", "clubs"),
      { hit: true, stand: true, double: false, split: false },
    );

    expect(decision.code).toBe("Ds");
    expect(decision.action).toBe("stand");
    expect(decision.fallbackApplied).toBe(true);
    expect(decision.explanation).toContain(
      "double if allowed, otherwise stand against dealer upcards 2, 3, 4, 5, or 6",
    );
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

  test("includes the broader row rule in the explanation text", () => {
    const decision = getBasicStrategyDecision(
      [createCard("A"), createCard("7", "hearts")],
      createCard("3", "clubs"),
      fullActions,
    );

    expect(decision.explanation).toContain(
      "General rule: with A,7, double if allowed, otherwise stand against dealer upcards 2, 3, 4, 5, or 6; stand against dealer upcards 7 or 8; hit against dealer upcards 9, 10, or A.",
    );
  });
});
