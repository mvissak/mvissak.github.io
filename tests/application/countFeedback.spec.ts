import { describe, expect, test } from "vitest";
import { getDecisionTrueCount } from "@/application/cardCounting";
import { createCard, createTrainerWithCards } from "@tests/helpers";

const createOpportunity = () => {
  const trainer = createTrainerWithCards([
    createCard("10"), createCard("7"), createCard("6"), createCard("10"), createCard("2"),
  ], 200, undefined, true);
  return { trainer, state: { ...trainer.startNewSession(), runningCountBeforeRound: 8 } };
};

describe("count learning feedback", () => {
  test.each(["hit", "stand"] as const)("pauses a qualifying %s choice with the original count and no cards or stats consumed", (action) => {
    const { trainer, state } = createOpportunity();
    const pending = trainer.submitAction(state, action);
    expect(pending.countFeedback).toMatchObject({
      kind: "action", chosenAction: action, basicAction: "hit", preferredAction: "stand", trueCount: getDecisionTrueCount(state),
    });
    expect(pending.countFeedback?.rationale).toContain("risk of busting");
    expect(pending.round).toBe(state.round);
    expect(pending.stats).toBe(state.stats);
    expect(trainer.createSnapshot(pending).shoe.drawIndex).toBe(4);
    expect(trainer.submitAction(pending, "double")).toBe(pending);
    expect(trainer.startNextHand(pending)).toBe(pending);
    expect(trainer.submitInsuranceDecision(pending, "yes")).toBe(pending);
  });

  test("lets a chart choice switch to the count play and records one correct decision", () => {
    const { trainer, state } = createOpportunity();
    const pending = trainer.submitAction(state, "hit");
    const accepted = trainer.confirmCountFeedback(pending, "preferred");
    expect(accepted.phase).toBe("roundResolved");
    expect(accepted.countFeedback).toBeNull();
    expect(accepted.stats.mistakesMade).toBe(0);
    expect(accepted.stats.correctFirstTryDecisions).toBe(1);
    expect(accepted.stats.decisionPointsResolved).toBe(1);
    expect(accepted.decisionNotice).toContain("Count play accepted");
    expect(trainer.createSnapshot(accepted).shoe.drawIndex).toBe(4);
    expect(trainer.confirmCountFeedback(accepted, "preferred")).toBe(accepted);
  });

  test("lets the player keep basic strategy without a penalty or duplicate draw", () => {
    const { trainer, state } = createOpportunity();
    const accepted = trainer.confirmCountFeedback(trainer.submitAction(state, "hit"), "original");
    expect(accepted.phase).toBe("playerTurn");
    expect(accepted.round?.playerHands[0].cards.map((card) => card.rank)).toEqual(["10", "6", "2"]);
    expect(accepted.stats.mistakesMade).toBe(0);
    expect(accepted.stats.correctFirstTryDecisions).toBe(1);
    expect(accepted.decisionNotice).toContain("Basic strategy accepted");
    expect(trainer.createSnapshot(accepted).shoe.drawIndex).toBe(5);
    expect(trainer.confirmCountFeedback(accepted, "original")).toBe(accepted);
  });

  test("restores a pending lesson and treats older snapshots as having no lesson", () => {
    const { trainer, state } = createOpportunity();
    const pending = trainer.submitAction(state, "stand");
    const snapshot = trainer.createSnapshot(pending);
    const restored = trainer.restore(snapshot);
    expect(restored.countFeedback).toEqual(pending.countFeedback);
    expect(trainer.confirmCountFeedback(restored, "original").stats.decisionPointsResolved).toBe(1);
    const { countFeedback, ...legacyState } = snapshot.state;
    expect(countFeedback).toBeTruthy();
    expect(trainer.restore({ ...snapshot, state: legacyState }).countFeedback).toBeNull();
  });

  test("teaches a negative-count hit against the chart's stand", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("7"), createCard("2"), createCard("4"), createCard("6"),
    ], 200, undefined, true);
    const state = { ...trainer.startNewSession(), runningCountBeforeRound: -3 };
    const pending = trainer.submitAction(state, "stand");
    expect(pending.countFeedback).toMatchObject({ basicAction: "stand", preferredAction: "hit" });
    expect(pending.countFeedback?.rationale).toContain("fewer ten-value cards");
    expect(trainer.confirmCountFeedback(pending, "preferred").round?.playerHands[0].cards).toHaveLength(3);
  });

  test.each([
    { player: ["4", "5"] as const, dealer: "2" as const, action: "double" as const },
    { player: ["10", "10"] as const, dealer: "6" as const, action: "split" as const },
  ])("confirms an indexed $action exactly once", ({ player, dealer, action }) => {
    const trainer = createTrainerWithCards([
      createCard(player[0]), createCard("10"), createCard(player[1]), createCard(dealer), createCard("3"), createCard("2"),
    ], 200, undefined, true);
    const state = { ...trainer.startNewSession(), runningCountBeforeRound: 30 };
    const pending = trainer.submitAction(state, action);
    expect(pending.countFeedback?.preferredAction).toBe(action);
    expect(trainer.createSnapshot(pending).shoe.drawIndex).toBe(4);
    const accepted = trainer.confirmCountFeedback(pending, "original");
    expect(accepted.stats.decisionPointsResolved).toBe(1);
    expect(accepted.stats.mistakesMade).toBe(0);
    expect(accepted.round?.playerHands).toHaveLength(action === "split" ? 2 : 1);
    expect(accepted.round?.playerHands[0].hasDoubled).toBe(action === "double");
    expect(trainer.confirmCountFeedback(accepted, "original")).toBe(accepted);
  });

  test("allows a declined insurance choice to switch before the peek and side bet", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("K"), createCard("10"), createCard("A"),
    ], 200, undefined, true);
    const state = { ...trainer.startNewSession(), runningCountBeforeRound: 21 };
    const pending = trainer.submitInsuranceDecision(state, "no");
    expect(pending.countFeedback).toMatchObject({ kind: "insurance", chosenAction: "no", preferredAction: "yes" });
    expect(pending.round?.dealerHoleHidden).toBe(true);
    expect(pending.stats.winnings).toBe(0);
    expect(pending.round?.insuranceBet).toBe(0);
    const accepted = trainer.confirmCountFeedback(pending, "preferred");
    expect(accepted.round?.insuranceBet).toBe(12.5);
    expect(accepted.round?.insuranceNetResult).toBe(25);
    expect(accepted.stats.winnings).toBe(0);
    expect(accepted.stats.decisionPointsResolved).toBe(1);
  });
});
