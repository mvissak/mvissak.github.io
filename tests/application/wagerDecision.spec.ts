import { describe, expect, test } from "vitest";
import { confirmNextWager } from "@/application/wagerDecision";
import { createCard, createTrainerWithCards } from "@tests/helpers";

const createCompletedRound = (baseBet = 100) => {
  const trainer = createTrainerWithCards([
    createCard("10"), createCard("7"), createCard("Q"), createCard("10"),
    createCard("9"), createCard("10"), createCard("9"), createCard("7"),
  ], 8, baseBet, true);
  return { trainer, state: trainer.submitAction(trainer.startNewSession(), "stand") };
};

describe("post-hand custom wager decision", () => {
  test.each([
    { choice: "increase", amount: 137, expected: 137 },
    { choice: "increase", amount: 1000, expected: 1000 },
    { choice: "decrease", amount: 25, expected: 25 },
    { choice: "keep", amount: undefined, expected: 100 },
  ] as const)("applies $choice to $expected for the next hand only", ({ choice, amount, expected }) => {
    const { trainer, state } = createCompletedRound();
    expect(state.nextWagerDecision?.baseWager).toBe(100);
    expect(trainer.startNextHand(state)).toBe(state);
    expect(trainer.createSnapshot(state).shoe.drawIndex).toBe(4);
    const confirmed = confirmNextWager(state, choice, amount);
    expect(confirmed.nextWagerDecision).toBeNull();
    expect(confirmed.wagerAmount).toBe(expected);
    expect(confirmed.round).toBe(state.round);
    expect(confirmed.round?.playerHands[0].bet).toBe(100);
    expect(confirmNextWager(confirmed, "keep")).toBe(confirmed);
    const next = trainer.startNextHand(confirmed);
    expect(next.round?.playerHands[0].bet).toBe(expected);
  });

  test.each([
    { choice: "increase", amount: 1001 },
    { choice: "increase", amount: 100 },
    { choice: "increase", amount: 99 },
    { choice: "decrease", amount: 24 },
    { choice: "decrease", amount: 100 },
    { choice: "decrease", amount: 101 },
    { choice: "increase", amount: 100.5 },
    { choice: "increase", amount: NaN },
    { choice: "increase", amount: Infinity },
  ] as const)("rejects invalid $choice amount $amount without advancing", ({ choice, amount }) => {
    const { trainer, state } = createCompletedRound();
    const rejected = confirmNextWager(state, choice, amount);
    expect(rejected.nextWagerDecision?.error).toBeTruthy();
    expect(rejected.wagerAmount).toBe(100);
    expect(trainer.startNextHand(rejected)).toBe(rejected);
  });

  test("restores a pending decision after reload and adds it for a legacy completed round", () => {
    const { trainer, state } = createCompletedRound();
    const snapshot = trainer.createSnapshot(state);
    expect(trainer.restore(snapshot).nextWagerDecision?.baseWager).toBe(100);
    const { nextWagerDecision, ...legacyState } = snapshot.state;
    expect(nextWagerDecision).not.toBeNull();
    const legacy = trainer.restore({ ...snapshot, state: legacyState });
    expect(legacy.nextWagerDecision?.baseWager).toBe(100);
    expect(trainer.startNextHand(legacy)).toBe(legacy);
  });
});
