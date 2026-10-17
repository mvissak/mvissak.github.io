import { describe, expect, test } from "vitest";
import { dealNextHand, createCard, createTrainerWithCards } from "@tests/helpers";

describe("blackjack trainer flow", () => {
  test("deals cards in player-hole-player-upcard order with the hole card hidden", () => {
    const trainer = createTrainerWithCards([
      createCard("9"),
      createCard("6", "clubs"),
      createCard("7", "hearts"),
      createCard("K", "diamonds"),
    ], undefined, undefined, true);

    const state = trainer.startNewSession();

    expect(state.round?.playerHands[0].cards.map((card) => card.rank)).toEqual(["9", "7"]);
    expect(state.round?.dealerCards.map((card) => card.rank)).toEqual(["K", "6"]);
    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(state.phase).toBe("playerTurn");
  });

  test("defaults to 6:5 and pays 120% on a natural blackjack", () => {
    const trainer = createTrainerWithCards(
      [
        createCard("A"),
        createCard("9", "clubs"),
        createCard("K", "hearts"),
        createCard("7", "diamonds"),
      ],
      3,
      40,
    );

    const state = trainer.startNewSession();

    expect(state.phase).toBe("roundResolved");
    expect(state.round?.playerHands[0].outcome).toBe("blackjack");
    expect(state.blackjackPayout).toBe("6:5");
    expect(state.round?.blackjackPayout).toBe("6:5");
    expect(state.round?.playerHands[0].netResult).toBe(48);
    expect(state.round?.playerHands[0].summary).toBe("Blackjack pays 6:5.");
    expect(state.stats.winnings).toBe(48);
  });

  test("skips insurance and keeps the dealer hole hidden when the player opens with blackjack against an ace", () => {
    const trainer = createTrainerWithCards([
      createCard("A"),
      createCard("A", "clubs"),
      createCard("K", "hearts"),
      createCard("9", "diamonds"),
    ]);

    const state = trainer.startNewSession();

    expect(state.phase).toBe("roundResolved");
    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(state.round?.playerHands[0].outcome).toBe("blackjack");
    expect(state.round?.playerHands[0].netResult).toBe(30);
  });

  test("pushes when both player and dealer have blackjack under an ace upcard", () => {
    const trainer = createTrainerWithCards([
      createCard("A"),
      createCard("A", "clubs"),
      createCard("K", "hearts"),
      createCard("10", "diamonds"),
    ]);

    const state = trainer.startNewSession();

    expect(state.phase).toBe("roundResolved");
    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(state.round?.playerHands[0].outcome).toBe("push");
    expect(state.round?.playerHands[0].netResult).toBe(0);
  });

  test("pushes when both player and dealer have blackjack under a ten-value upcard", () => {
    const trainer = createTrainerWithCards([
      createCard("A"),
      createCard("K", "clubs"),
      createCard("10", "hearts"),
      createCard("A", "diamonds"),
    ]);

    const state = trainer.startNewSession();

    expect(state.phase).toBe("roundResolved");
    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(state.round?.playerHands[0].outcome).toBe("push");
    expect(state.round?.playerHands[0].netResult).toBe(0);
  });

  test("prompts for insurance before resolving an ace-upcard dealer blackjack", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("A", "clubs"),
      createCard("7", "hearts"),
      createCard("K", "diamonds"),
    ]);

    const state = trainer.startNewSession();

    expect(state.phase).toBe("insuranceDecision");
    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(state.round?.dealerCards.map((card) => card.rank)).toEqual(["A", "K"]);
  });

  test("explains that buying insurance is the wrong training choice", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("A", "clubs"),
      createCard("7", "hearts"),
      createCard("9", "diamonds"),
    ]);

    const initialState = trainer.startNewSession();
    const correctedState = trainer.submitInsuranceDecision(initialState, "yes");

    expect(correctedState.phase).toBe("insuranceDecision");
    expect(correctedState.correction?.recommendedLabel).toBe("No Insurance");
    expect(correctedState.stats.mistakesMade).toBe(1);
  });

  test("counts repeating the same wrong insurance choice only once", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("A", "clubs"),
      createCard("7", "hearts"),
      createCard("9", "diamonds"),
    ]);

    const initialState = trainer.startNewSession();
    const firstWrongState = trainer.submitInsuranceDecision(initialState, "yes");
    const repeatedWrongState = trainer.submitInsuranceDecision(firstWrongState, "yes");

    expect(firstWrongState.stats.mistakesMade).toBe(1);
    expect(repeatedWrongState.stats.mistakesMade).toBe(1);
    expect(repeatedWrongState.correction?.recommendedLabel).toBe("No Insurance");
  });

  test.each(["10", "J", "Q", "K"] as const)("checks an ace upcard for blackjack with a %s hole card before player actions", (holeCard) => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("A", "clubs"),
      createCard("10", "hearts"),
      createCard(holeCard, "diamonds"),
      createCard("5"),
      createCard("6"),
    ], 6);

    const initialState = trainer.startNewSession();
    for (const action of ["hit", "stand", "double", "split"] as const) {
      expect(trainer.submitAction(initialState, action)).toBe(initialState);
    }
    const state = trainer.submitInsuranceDecision(initialState, "no");

    expect(state.phase).toBe("roundResolved");
    expect(state.round?.dealerHoleHidden).toBe(false);
    expect(state.round?.dealerCards.map((card) => card.rank)).toEqual(["A", holeCard]);
    expect(state.round?.playerHands[0].outcome).toBe("loss");
    expect(state.round?.playerHands[0].netResult).toBe(-25);
    expect(state.stats.winnings).toBe(-25);
    expect(state.stats.totalHandsPlayed).toBe(1);
    expect(state.stats.decisionPointsResolved).toBe(1);
    expect(state.currentDecision).toBeNull();
    for (const action of ["hit", "stand", "double", "split"] as const) {
      expect(trainer.submitAction(state, action)).toBe(state);
    }
    expect(trainer.createSnapshot(state).shoe.drawIndex).toBe(4);
  });

  test("declining insurance returns to normal play when the dealer does not have blackjack", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("A", "clubs"),
      createCard("7", "hearts"),
      createCard("9", "diamonds"),
    ]);

    const initialState = trainer.startNewSession();
    const state = trainer.submitInsuranceDecision(initialState, "no");

    expect(state.phase).toBe("playerTurn");
    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(state.round?.dealerCards.map((card) => card.rank)).toEqual(["A", "9"]);
  });

  test.each(["10", "J", "Q", "K"] as const)("resolves dealer blackjack under a %s upcard before player actions", (upcard) => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard(upcard, "clubs"),
      createCard("10", "hearts"),
      createCard("A", "diamonds"),
      createCard("5"),
      createCard("6"),
    ], 6);

    const state = trainer.startNewSession();

    expect(state.phase).toBe("roundResolved");
    expect(state.round?.dealerHoleHidden).toBe(false);
    expect(state.round?.dealerCards.map((card) => card.rank)).toEqual([upcard, "A"]);
    expect(state.round?.playerHands[0]).toMatchObject({
      status: "resolved",
      outcome: "loss",
      bet: 25,
      netResult: -25,
      summary: "Dealer blackjack.",
    });
    expect(state.stats.totalHandsPlayed).toBe(1);
    expect(state.stats.winnings).toBe(-25);
    expect(state.stats.decisionPointsResolved).toBe(0);
    expect(state.stats.mistakesMade).toBe(0);
    expect(state.currentDecision).toBeNull();
    expect(state.correction).toBeNull();
    expect(state.nextHandSequence).toBe(2);
    expect(trainer.createSnapshot(state).shoe.drawIndex).toBe(4);

    for (const action of ["hit", "stand", "double", "split"] as const) {
      expect(trainer.submitAction(state, action)).toBe(state);
    }
    expect(trainer.createSnapshot(state).shoe.drawIndex).toBe(4);
  });

  test.each(["10", "J", "Q", "K"] as const)("keeps normal player actions when a %s upcard is not blackjack", (upcard) => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard(upcard, "clubs"),
      createCard("10", "hearts"),
      createCard("9", "diamonds"),
    ]);

    const state = trainer.startNewSession();

    expect(state.phase).toBe("playerTurn");
    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(state.currentDecision).not.toBeNull();
    expect(trainer.submitAction(state, "stand").round?.playerHands[0].outcome).toBe("win");
  });

  test("reshuffles after an opening dealer blackjack reaches the cut card", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("10", "clubs"),
      createCard("10", "hearts"),
      createCard("A", "diamonds"),
    ], 4);

    const state = trainer.startNewSession();

    expect(state.phase).toBe("roundResolved");
    expect(state.round?.cutCardReachedDuringRound).toBe(true);
    expect(state.bannerMessage).toBe("Shoe reshuffled for the next hand.");
    expect(trainer.createSnapshot(state).shoe.drawIndex).toBe(0);
    expect(trainer.createSnapshot(state).shoe.cards).toHaveLength(312);
  });

  test("blocks the hand and shows corrective feedback on a wrong action", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("10", "clubs"),
      createCard("6", "hearts"),
      createCard("7", "diamonds"),
    ]);

    const initialState = trainer.startNewSession();
    const nextState = trainer.submitAction(initialState, "stand");

    expect(nextState.phase).toBe("playerTurn");
    expect(nextState.correction?.recommendedAction).toBe("hit");
    expect(nextState.round?.playerHands[0].cards).toEqual(initialState.round?.playerHands[0].cards);
    expect(nextState.stats.mistakesMade).toBe(1);
  });

  test("counts a repeated wrong choice on the same decision only once", () => {
    const trainer = createTrainerWithCards([
      createCard("2"),
      createCard("10", "clubs"),
      createCard("3", "hearts"),
      createCard("6", "diamonds"),
    ]);

    const initialState = trainer.startNewSession();
    const firstWrongState = trainer.submitAction(initialState, "stand");
    const repeatedWrongState = trainer.submitAction(firstWrongState, "stand");

    expect(firstWrongState.stats.mistakesMade).toBe(1);
    expect(repeatedWrongState.stats.mistakesMade).toBe(1);
    expect(repeatedWrongState.correction?.recommendedAction).toBe("hit");
  });

  test("counts a new wrong choice after the hand state changes as a new mistake", () => {
    const trainer = createTrainerWithCards([
      createCard("2"),
      createCard("10", "clubs"),
      createCard("3", "hearts"),
      createCard("6", "diamonds"),
      createCard("2", "spades"),
    ]);

    const initialState = trainer.startNewSession();
    const firstWrongState = trainer.submitAction(initialState, "stand");
    const afterCorrectHit = trainer.submitAction(firstWrongState, "hit");
    const secondWrongState = trainer.submitAction(afterCorrectHit, "stand");

    expect(afterCorrectHit.phase).toBe("playerTurn");
    expect(afterCorrectHit.round?.playerHands[0].cards.map((card) => card.rank)).toEqual(["2", "3", "2"]);
    expect(secondWrongState.stats.mistakesMade).toBe(2);
    expect(secondWrongState.correction?.recommendedAction).toBe("hit");
  });

  test("tracks winnings and losses across multiple hands", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
      createCard("10", "hearts"),
      createCard("10", "diamonds"),
      createCard("7", "clubs"),
      createCard("Q", "clubs"),
    ]);

    const firstHand = trainer.startNewSession();
    const firstResult = trainer.submitAction(firstHand, "stand");
    const secondHand = dealNextHand(trainer, firstResult);
    const secondResult = trainer.submitAction(secondHand, "stand");

    expect(firstResult.stats.winnings).toBe(25);
    expect(secondResult.stats.winnings).toBe(0);
    expect(secondResult.stats.totalHandsPlayed).toBe(2);
  });

  test("reveals the dealer hole card but does not draw after the player busts", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("2", "hearts"),
      createCard("6", "diamonds"),
      createCard("K", "spades"),
    ]);

    const initialState = trainer.startNewSession();
    const resolvedState = trainer.submitAction(initialState, "hit");

    expect(resolvedState.phase).toBe("roundResolved");
    expect(resolvedState.round?.dealerHoleHidden).toBe(false);
    expect(resolvedState.round?.dealerCards.map((card) => card.rank)).toEqual(["7", "6"]);
    expect(resolvedState.round?.playerHands[0].summary).toBe("Bust for 22.");
  });

  test("reshuffles only after the cut card is reached and the hand ends", () => {
    const trainer = createTrainerWithCards(
      [
        createCard("10"),
        createCard("6", "clubs"),
        createCard("7", "hearts"),
        createCard("A", "diamonds"),
      ],
      4,
    );

    const inProgress = trainer.startNewSession();
    const beforeResolutionSnapshot = trainer.createSnapshot(inProgress);
    const resolved = trainer.submitAction(inProgress, "stand");
    const afterResolutionSnapshot = trainer.createSnapshot(resolved);

    expect(beforeResolutionSnapshot.shoe.drawIndex).toBe(4);
    expect(resolved.bannerMessage).toContain("reshuffled");
    expect(afterResolutionSnapshot.shoe.drawIndex).toBe(0);
    expect(afterResolutionSnapshot.shoe.cards).toHaveLength(312);
  });

  test("deals every waiting resplit hand even when preceding hands automatically stand on 21", () => {
    const trainer = createTrainerWithCards([
      createCard("A"), createCard("10"), createCard("A"), createCard("6"),
      createCard("A"), createCard("10"), createCard("10"), createCard("9"), createCard("2"),
    ], 200, undefined, true);
    const split = trainer.submitAction(trainer.startNewSession(), "split");
    const resplit = trainer.submitAction(split, "split");
    expect(resplit.phase).toBe("playerTurn");
    expect(resplit.round?.activeHandIndex).toBe(2);
    expect(resplit.round?.playerHands.map((hand) => hand.status)).toEqual(["stood", "stood", "playing"]);
    expect(resplit.round?.playerHands[2].cards.map((card) => card.rank)).toEqual(["A", "9"]);
    expect(resplit.round?.dealerCards).toHaveLength(2);
    expect(resplit.stats.totalHandsPlayed).toBe(0);
    const finished = trainer.submitAction(resplit, "stand");
    expect(finished.phase).toBe("roundResolved");
    expect(finished.stats.totalHandsPlayed).toBe(3);
  });

  test("clears a previous shoe reshuffle notice when a later round finishes normally", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("9"), createCard("10"), createCard("10"),
    ], 200, undefined, true);
    const state = { ...trainer.startNewSession(), bannerMessage: "Shoe reshuffled for the next hand." };
    expect(trainer.submitAction(state, "stand").bannerMessage).toBeNull();
  });

  test("split leaves the second hand waiting for its first card until the first hand is resolved", () => {
    const trainer = createTrainerWithCards([
      createCard("8"),
      createCard("6", "clubs"),
      createCard("8", "hearts"),
      createCard("10", "diamonds"),
      createCard("3", "clubs"),
      createCard("2", "hearts"),
    ]);

    const initialState = trainer.startNewSession();
    const splitState = trainer.submitAction(initialState, "split");

    expect(splitState.round?.playerHands).toHaveLength(2);
    expect(splitState.round?.playerHands[0].cards.map((card) => card.rank)).toEqual(["8", "3"]);
    expect(splitState.round?.playerHands[1].cards.map((card) => card.rank)).toEqual(["8"]);
    expect(splitState.round?.playerHands[1].status).toBe("awaitingDeal");
    expect(splitState.phase).toBe("playerTurn");
  });

  test("deals the second split hand only after the first split hand finishes", () => {
    const trainer = createTrainerWithCards([
      createCard("8"),
      createCard("6", "clubs"),
      createCard("8", "hearts"),
      createCard("10", "diamonds"),
      createCard("K", "spades"),
      createCard("2", "hearts"),
    ]);

    const initialState = trainer.startNewSession();
    const splitState = trainer.submitAction(initialState, "split");
    const afterFirstHand = trainer.submitAction(splitState, "stand");

    expect(afterFirstHand.phase).toBe("playerTurn");
    expect(afterFirstHand.round?.activeHandIndex).toBe(1);
    expect(afterFirstHand.round?.playerHands[0].cards.map((card) => card.rank)).toEqual(["8", "K"]);
    expect(afterFirstHand.round?.playerHands[0].status).toBe("stood");
    expect(afterFirstHand.round?.playerHands[1].cards.map((card) => card.rank)).toEqual(["8", "2"]);
    expect(afterFirstHand.round?.playerHands[1].status).toBe("playing");
  });

  test.each([
    { initial: "6:5", next: "3:2", net: 37.5 },
    { initial: "3:2", next: "6:5", net: 30 },
  ] as const)("changes payout from $initial to $next only for the next dealt hand", ({ initial, next, net }) => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("9"), createCard("10"), createCard("10"),
      createCard("A"), createCard("9"), createCard("K"), createCard("6"),
      createCard("5"), createCard("6"),
    ], 10, undefined, true);
    const state = trainer.startNewSession(25, initial);
    const updated = trainer.updateBlackjackPayout(state, next);

    expect(updated.blackjackPayout).toBe(next);
    expect(updated.round).toBe(state.round);
    expect(updated.round?.blackjackPayout).toBe(initial);
    expect(updated.stats).toBe(state.stats);
    const resolved = trainer.submitAction(updated, "stand");
    expect(resolved.round?.blackjackPayout).toBe(initial);
    expect(resolved.stats.winnings).toBe(25);

    const nextHand = dealNextHand(trainer, resolved);
    expect(nextHand.round?.blackjackPayout).toBe(next);
    expect(nextHand.round?.playerHands[0].netResult).toBe(net);
    expect(nextHand.round?.playerHands[0].summary).toBe(`Blackjack pays ${next}.`);
    expect(nextHand.stats.winnings).toBe(25 + net);
  });

  test("changing payout after a natural does not change its settled winnings", () => {
    const trainer = createTrainerWithCards([
      createCard("A"), createCard("9"), createCard("K"), createCard("6"),
      createCard("A"), createCard("9"), createCard("K"), createCard("6"),
      createCard("5"), createCard("6"),
    ], 10, undefined, true);
    const state = trainer.startNewSession();
    const updated = trainer.updateBlackjackPayout(state, "3:2");

    expect(updated.round).toBe(state.round);
    expect(updated.round?.playerHands[0].netResult).toBe(30);
    expect(updated.stats.winnings).toBe(30);
    const nextHand = dealNextHand(trainer, updated);
    expect(nextHand.round?.playerHands[0].netResult).toBe(37.5);
    expect(nextHand.stats.winnings).toBe(67.5);
  });

  test("restores both the selected payout and the payout locked to the current round", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("9"), createCard("10"), createCard("10"),
      createCard("A"), createCard("9"), createCard("K"), createCard("6"),
      createCard("5"), createCard("6"),
    ], 10, undefined, true);
    const state = trainer.startNewSession(25, "3:2");
    const updated = trainer.updateBlackjackPayout(state, "6:5");
    const restored = trainer.restore(trainer.createSnapshot(updated));

    expect(restored.blackjackPayout).toBe("6:5");
    expect(restored.round?.blackjackPayout).toBe("3:2");
    const nextHand = dealNextHand(trainer, trainer.submitAction(restored, "stand"));
    expect(nextHand.round?.playerHands[0].netResult).toBe(30);
  });

  test("restores legacy rounds at 3:2 while defaulting future hands to 6:5", () => {
    const trainer = createTrainerWithCards([
      createCard("10"), createCard("9"), createCard("10"), createCard("10"),
      createCard("A"), createCard("9"), createCard("K"), createCard("6"),
      createCard("5"), createCard("6"),
    ], 10, undefined, true);
    const snapshot = trainer.createSnapshot(trainer.startNewSession());
    const { blackjackPayout: selectedPayout, round, ...legacyState } = snapshot.state;
    expect(selectedPayout).toBe("6:5");
    if (!round) throw new Error("Expected a dealt round.");
    const { blackjackPayout: roundPayout, ...legacyRound } = round;
    expect(roundPayout).toBe("6:5");
    const restored = trainer.restore({
      ...snapshot,
      state: { ...legacyState, round: legacyRound },
    });

    expect(restored.blackjackPayout).toBe("6:5");
    expect(restored.round?.blackjackPayout).toBe("3:2");
    const nextHand = dealNextHand(trainer, trainer.submitAction(restored, "stand"));
    expect(nextHand.round?.playerHands[0].netResult).toBe(30);
  });

  test("uses the configured wager amount for future hands", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
      createCard("9", "clubs"),
      createCard("6", "diamonds"),
      createCard("7", "spades"),
      createCard("K", "hearts"),
    ]);

    const initialState = trainer.startNewSession();
    const updatedState = trainer.updateWagerAmount(initialState, 40);
    const resolvedState = trainer.submitAction(updatedState, "stand");
    const nextHandState = dealNextHand(trainer, resolvedState);

    expect(updatedState.wagerAmount).toBe(40);
    expect(updatedState.round?.playerHands[0].bet).toBe(25);
    expect(nextHandState.round?.playerHands[0].bet).toBe(40);
  });

  test("enforces the $25 minimum wager for future hands", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
      createCard("9", "clubs"),
      createCard("6", "diamonds"),
      createCard("7", "spades"),
      createCard("K", "hearts"),
    ]);

    const initialState = trainer.startNewSession();
    const updatedState = trainer.updateWagerAmount(initialState, 10);
    const resolvedState = trainer.submitAction(updatedState, "stand");
    const nextHandState = dealNextHand(trainer, resolvedState);

    expect(updatedState.wagerAmount).toBe(25);
    expect(nextHandState.round?.playerHands[0].bet).toBe(25);
  });

  test("enforces the $1000 maximum wager for future hands", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("7", "clubs"),
      createCard("Q", "hearts"),
      createCard("Q", "diamonds"),
      createCard("9", "clubs"),
      createCard("6", "diamonds"),
      createCard("7", "spades"),
      createCard("K", "hearts"),
    ]);

    const initialState = trainer.startNewSession();
    const updatedState = trainer.updateWagerAmount(initialState, 5_000);
    const resolvedState = trainer.submitAction(updatedState, "stand");
    const nextHandState = dealNextHand(trainer, resolvedState);

    expect(updatedState.wagerAmount).toBe(1_000);
    expect(nextHandState.round?.playerHands[0].bet).toBe(1_000);
  });
});
