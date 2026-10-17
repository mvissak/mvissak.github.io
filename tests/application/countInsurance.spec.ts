import { describe, expect, test } from "vitest";
import { getDecisionTrueCount } from "@/application/cardCounting";
import { createCard, createTrainerWithCards } from "@tests/helpers";

describe("count-based insurance", () => {
  test.each(["K", "9"] as const)("settles insurance with a %s hole card using only the pre-peek count", (holeCard) => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard(holeCard), createCard("10"), createCard("A"),
    ], 4, undefined, true);
    const initial = { ...trainer.startNewSession(), runningCountBeforeRound: 21 };
    expect(getDecisionTrueCount(initial)).toBeCloseTo(18 / (308 / 52));
    const lesson = trainer.submitInsuranceDecision(initial, "yes");
    expect(lesson.phase).toBe("insuranceDecision");
    expect(lesson.round?.insuranceBet).toBe(0);
    const insured = trainer.confirmCountFeedback(lesson, "original");
    expect(insured.correction).toBeNull();
    expect(insured.stats.mistakesMade).toBe(0);
    expect(insured.decisionNotice).toContain("Hi-Lo favors buying insurance");
    expect(insured.round?.insuranceBet).toBe(12.5);
    if (holeCard === "K") {
      expect(insured.phase).toBe("roundResolved");
      expect(insured.round?.insuranceNetResult).toBe(25);
      expect(insured.stats.winnings).toBe(0);
    } else {
      expect(insured.phase).toBe("playerTurn");
      expect(insured.round?.dealerHoleHidden).toBe(true);
      const resolved = trainer.submitAction(insured, "stand");
      expect(resolved.round?.insuranceNetResult).toBe(-12.5);
      expect(resolved.stats.winnings).toBe(-12.5);
    }
  });

  test("declining insurance remains accepted even when the count qualifies", () => {
    const trainer = createTrainerWithCards([createCard("10"), createCard("K"), createCard("10"), createCard("A")], 4, undefined, true);
    const state = { ...trainer.startNewSession(), runningCountBeforeRound: 21 };
    const lesson = trainer.submitInsuranceDecision(state, "no");
    expect(lesson.countFeedback?.preferredAction).toBe("yes");
    const declined = trainer.confirmCountFeedback(lesson, "original");
    expect(declined.correction).toBeNull();
    expect(declined.round?.insuranceBet).toBe(0);
    expect(declined.round?.insuranceNetResult).toBe(0);
    expect(declined.stats.winnings).toBe(-25);
  });
});
