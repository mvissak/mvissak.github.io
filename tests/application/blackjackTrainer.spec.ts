import { describe, expect, test } from "vitest";
import { createCard, createTrainerWithCards } from "@tests/helpers";

describe("blackjack trainer flow", () => {
  test("deals cards in player-dealer-player-dealer order with the hole card hidden", () => {
    const trainer = createTrainerWithCards([
      createCard("9"),
      createCard("6", "clubs"),
      createCard("7", "hearts"),
      createCard("K", "diamonds"),
    ]);

    const state = trainer.startNewSession();

    expect(state.round?.playerHands[0].cards.map((card) => card.rank)).toEqual(["9", "7"]);
    expect(state.round?.dealerCards.map((card) => card.rank)).toEqual(["6", "K"]);
    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(state.phase).toBe("playerTurn");
  });

  test("pays 150% on a natural blackjack", () => {
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
    expect(state.round?.playerHands[0].netResult).toBe(60);
    expect(state.stats.winnings).toBe(60);
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

  test("declining insurance resolves dealer blackjack when the hole card is ten-valued", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("A", "clubs"),
      createCard("7", "hearts"),
      createCard("K", "diamonds"),
    ]);

    const initialState = trainer.startNewSession();
    const state = trainer.submitInsuranceDecision(initialState, "no");

    expect(state.phase).toBe("roundResolved");
    expect(state.round?.dealerHoleHidden).toBe(false);
    expect(state.round?.dealerCards.map((card) => card.rank)).toEqual(["A", "K"]);
    expect(state.round?.playerHands[0].outcome).toBe("loss");
    expect(state.round?.playerHands[0].netResult).toBe(-25);
    expect(state.stats.winnings).toBe(-25);
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

  test("does not reveal a ten-upcard dealer blackjack before player actions begin", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("10", "clubs"),
      createCard("7", "hearts"),
      createCard("A", "diamonds"),
    ]);

    const state = trainer.startNewSession();

    expect(state.phase).toBe("playerTurn");
    expect(state.round?.dealerHoleHidden).toBe(true);
    expect(state.round?.dealerCards.map((card) => card.rank)).toEqual(["10", "A"]);
  });

  test("reveals ten-upcard dealer blackjack only after the hand resolves", () => {
    const trainer = createTrainerWithCards([
      createCard("10"),
      createCard("10", "clubs"),
      createCard("7", "hearts"),
      createCard("A", "diamonds"),
    ]);

    const initialState = trainer.startNewSession();
    const resolvedState = trainer.submitAction(initialState, "stand");

    expect(resolvedState.phase).toBe("roundResolved");
    expect(resolvedState.round?.dealerHoleHidden).toBe(false);
    expect(resolvedState.round?.playerHands[0].summary).toBe("Dealer blackjack.");
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
    const secondHand = trainer.startNextHand(firstResult);
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
    const nextHandState = trainer.startNextHand(resolvedState);

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
    const nextHandState = trainer.startNextHand(resolvedState);

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
    const nextHandState = trainer.startNextHand(resolvedState);

    expect(updatedState.wagerAmount).toBe(1_000);
    expect(nextHandState.round?.playerHands[0].bet).toBe(1_000);
  });
});
