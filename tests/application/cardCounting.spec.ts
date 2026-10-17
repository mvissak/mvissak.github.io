import { describe, expect, test } from "vitest";
import { getRunningCount, recordExposedCards } from "@/application/cardCounting";
import type { TrainerState } from "@/application/trainerState";
import { dealNextHand, createCard, createTrainerWithCards } from "@tests/helpers";

const faceUpIds = (state: TrainerState) => [
  ...(state.round?.playerHands.flatMap((hand) => hand.cards.map((card) => card.id)) ?? []),
  ...(state.round?.dealerCards
    .filter((_, index) => index !== 1 || !state.round?.dealerHoleHidden)
    .map((card) => card.id) ?? []),
];

const createMultiRoundTrainer = () => createTrainerWithCards([
  createCard("2"), createCard("A"), createCard("3"), createCard("6"),
  createCard("4"), createCard("9"),
  createCard("10"), createCard("9"), createCard("10"), createCard("9"),
  createCard("5"), createCard("6"),
], 12, undefined, true);

const completeFirstRound = (trainer: ReturnType<typeof createMultiRoundTrainer>) => {
  const state = trainer.startNewSession();
  const afterHit = trainer.submitAction(state, "hit");
  const afterSecondHit = trainer.submitAction(afterHit, "hit");
  return trainer.submitAction(afterSecondHit, "stand");
};

describe("session running count", () => {
  test("accepts an indexed stand against 10 at a qualifying count", () => {
    const trainer = createTrainerWithCards([
      createCard("2"), createCard("7"), createCard("2"), createCard("10"),
      createCard("3"), createCard("3"), createCard("6"),
      createCard("9"), createCard("9"), createCard("9"),
    ], 10, undefined, true);
    let state = trainer.startNewSession();
    state = trainer.submitAction(state, "hit");
    state = trainer.submitAction(state, "hit");
    state = trainer.submitAction(state, "hit");
    expect(getRunningCount(state, faceUpIds(state))).toBe(4);
    const corrected = trainer.submitAction(state, "stand");
    expect(corrected.phase).toBe("roundResolved");
    expect(corrected.correction).toBeNull();
    expect(corrected.stats.mistakesMade).toBe(0);
    expect(corrected.decisionNotice).toContain("Count play accepted");
  });
  test("counts exposed cards without using the hidden hole card or repeating exposures", () => {
    const trainer = createMultiRoundTrainer();
    const state = trainer.startNewSession();
    const ids = faceUpIds(state);

    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(getRunningCount(state, ids)).toBe(3);
    expect(getRunningCount(state, [...ids, ...ids, "not-in-this-round"])).toBe(3);
    const wrongChoice = trainer.submitAction(state, "stand");
    expect(wrongChoice.correction).not.toBeNull();
    expect(getRunningCount(wrongChoice, faceUpIds(wrongChoice))).toBe(3);
    const changedBet = trainer.updateWagerAmount(wrongChoice, 40);
    const changedPayout = trainer.updateBlackjackPayout(changedBet, "3:2");
    expect(getRunningCount(changedPayout, faceUpIds(changedPayout))).toBe(3);

    const afterHit = trainer.submitAction(changedPayout, "hit");
    expect(getRunningCount(afterHit, faceUpIds(afterHit))).toBe(4);
    const afterSecondHit = trainer.submitAction(afterHit, "hit");
    expect(getRunningCount(afterSecondHit, faceUpIds(afterSecondHit))).toBe(4);
    const resolved = trainer.submitAction(afterSecondHit, "stand");
    expect(getRunningCount(resolved, faceUpIds(resolved))).toBe(3);
    expect(getRunningCount(resolved, faceUpIds(afterSecondHit))).toBe(4);
  });

  test("keeps the count across rounds and resets it for a new session", () => {
    const trainer = createMultiRoundTrainer();
    const resolved = completeFirstRound(trainer);
    expect(getRunningCount(resolved, faceUpIds(resolved))).toBe(3);
    const nextHand = dealNextHand(trainer, resolved);

    expect(nextHand.runningCountBeforeRound).toBe(3);
    expect(getRunningCount(nextHand, faceUpIds(nextHand))).toBe(1);
    const newSession = trainer.startNewSession();
    expect(newSession.runningCountBeforeRound).toBe(0);
    expect(getRunningCount(newSession, faceUpIds(newSession))).toBe(3);
  });

  test("counts split seeds once and includes subsequent split and double cards", () => {
    const trainer = createTrainerWithCards([
      createCard("8"), createCard("10"), createCard("8"), createCard("6"),
      createCard("2"), createCard("10"), createCard("3"), createCard("10"),
      createCard("5"), createCard("9"), createCard("9"),
    ], 11, undefined, true);
    const state = trainer.startNewSession();
    expect(getRunningCount(state, faceUpIds(state))).toBe(1);
    const split = trainer.submitAction(state, "split");
    expect(getRunningCount(split, faceUpIds(split))).toBe(2);
    const afterDouble = trainer.submitAction(split, "double");
    expect(afterDouble.round?.activeHandIndex).toBe(1);
    expect(getRunningCount(afterDouble, faceUpIds(afterDouble))).toBe(2);
    const resolved = trainer.submitAction(afterDouble, "double");
    expect(resolved.phase).toBe("roundResolved");
    expect(getRunningCount(resolved, faceUpIds(resolved))).toBe(1);
  });

  test("restores the count without adding the current round twice", () => {
    const trainer = createMultiRoundTrainer();
    const nextHand = dealNextHand(trainer, completeFirstRound(trainer));
    const restored = trainer.restore(trainer.createSnapshot(nextHand));

    expect(restored.runningCountBeforeRound).toBe(3);
    expect(getRunningCount(restored, faceUpIds(restored))).toBe(1);
  });

  test("remembers previously exposed cards across reloads and ignores repeated exposure events", () => {
    const trainer = createMultiRoundTrainer();
    const resolved = completeFirstRound(trainer);
    const ids = faceUpIds(resolved);
    const recorded = recordExposedCards(resolved, [...ids, ...ids, "not-in-this-round"]);

    expect(recorded.roundExposedCardIds).toHaveLength(6);
    expect(recordExposedCards(recorded, ids)).toBe(recorded);
    const restored = trainer.restore(trainer.createSnapshot(recorded));
    expect(getRunningCount(restored, [])).toBe(3);
    expect(getRunningCount(restored, ids)).toBe(3);
    const nextHand = dealNextHand(trainer, restored);
    expect(nextHand.roundExposedCardIds).toEqual([]);
    expect(getRunningCount(nextHand, faceUpIds(nextHand))).toBe(1);
  });

  test("reconstructs the count of prior rounds from a legacy snapshot's shoe", () => {
    const trainer = createMultiRoundTrainer();
    const nextHand = dealNextHand(trainer, completeFirstRound(trainer));
    const snapshot = trainer.createSnapshot(nextHand);
    const { runningCountBeforeRound, ...legacyState } = snapshot.state;
    expect(runningCountBeforeRound).toBe(3);
    const restored = trainer.restore({ ...snapshot, state: legacyState });

    expect(restored.runningCountBeforeRound).toBe(3);
    expect(getRunningCount(restored, faceUpIds(restored))).toBe(1);
  });

  test("keeps the final count through resolution, then resets when dealing from a reshuffled shoe", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("2"), createCard("10"), createCard("5"),
      createCard("10"),
    ], 5, undefined, true);
    const state = trainer.startNewSession();
    expect(state.round?.cutCardReachedDuringRound).toBe(false);
    expect(trainer.createSnapshot(state).shoe.drawIndex).toBe(4);
    const resolved = trainer.submitAction(state, "stand");

    expect(resolved.phase).toBe("roundResolved");
    expect(resolved.round?.cutCardReachedDuringRound).toBe(true);
    expect(getRunningCount(resolved, faceUpIds(resolved))).toBe(-1);
    expect(trainer.createSnapshot(resolved).shoe.drawIndex).toBe(0);
    const nextHand = dealNextHand(trainer, resolved);
    expect(nextHand.runningCountBeforeRound).toBe(0);
    expect(getRunningCount(nextHand, [])).toBe(0);
  });
});
