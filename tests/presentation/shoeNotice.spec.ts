import { describe, expect, test } from "vitest";
import { buildShoeNoticeViewModel } from "@/presentation/view-models/buildShoeNoticeViewModel";
import { buildTrainerViewModel } from "@/presentation/view-models/buildTrainerViewModel";
import { createCard, createTrainerWithCards, dealNextHand } from "@tests/helpers";

describe("shoe notices", () => {
  test("does not announce a reshuffle for an ordinary round or a user-started session", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("9"), createCard("10"), createCard("10"),
    ], 200, undefined, true);
    const state = trainer.startNewSession();
    expect(buildShoeNoticeViewModel(null)).toBeNull();
    expect(buildShoeNoticeViewModel(state)).toBeNull();
    expect(buildShoeNoticeViewModel(trainer.submitAction(state, "stand"))).toBeNull();
  });

  test("distinguishes the next shoe's zero starting count from the current visible cards", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("9"), createCard("10"), createCard("10"),
    ], 4, undefined, true);
    const resolved = trainer.submitAction(trainer.startNewSession(), "stand");
    expect(buildShoeNoticeViewModel(resolved)).toEqual({
      title: "Shoe reshuffled",
      message: "A fresh 6-deck shoe is ready for the next hand. The running count will restart at 0 before the next deal.",
    });
    expect(buildTrainerViewModel(resolved, { suppressResolvedOutcome: true }).shoeNotice).toBeNull();
    const nextHand = dealNextHand(trainer, resolved);
    expect(nextHand.runningCountBeforeRound).toBe(0);
    expect(buildShoeNoticeViewModel(nextHand)?.title).toBe("New shoe in play");
    expect(buildShoeNoticeViewModel(nextHand)?.message).toContain("before this hand's face-up cards were counted");
    expect(buildShoeNoticeViewModel(trainer.restore(trainer.createSnapshot(nextHand)))).toEqual(buildShoeNoticeViewModel(nextHand));
  });
});
