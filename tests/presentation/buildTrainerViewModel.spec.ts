import { describe, expect, test } from "vitest";
import { buildTrainerViewModel } from "@/presentation/view-models/buildTrainerViewModel";
import { createCard } from "@tests/helpers";
import type { TrainerState } from "@/application/trainerState";

describe("buildTrainerViewModel", () => {
  test("renders doubled bets as two equal betting stacks instead of one combined chip total", () => {
    const state: TrainerState = {
      phase: "roundResolved",
      round: {
        dealerCards: [createCard("6"), createCard("10", "clubs")],
        dealerHoleHidden: false,
        playerHands: [
          {
            id: "hand-1",
            cards: [createCard("5", "hearts"), createCard("6", "diamonds"), createCard("10", "spades")],
            bet: 50,
            hasDoubled: true,
            originatedFromSplit: false,
            status: "resolved",
            outcome: "win",
            netResult: 50,
            summary: "21 beats dealer 16.",
          },
        ],
        activeHandIndex: 0,
        resultSummary: "hand-1: 21 beats dealer 16.",
        cutCardReachedDuringRound: false,
      },
      correction: null,
      stats: {
        totalHandsPlayed: 1,
        correctFirstTryDecisions: 1,
        decisionPointsResolved: 1,
        mistakesMade: 0,
        winnings: 50,
        currentStreak: 1,
        bestStreak: 1,
      },
      bannerMessage: null,
      wagerAmount: 25,
      nextHandSequence: 2,
      currentDecision: null,
    };

    const viewModel = buildTrainerViewModel(state);

    expect(viewModel.playerHands[0].betChipStacks?.map((stack) => stack.denominations)).toEqual([
      [25],
      [25],
    ]);
    expect(viewModel.playerHands[0].detail).toBeNull();
    expect(viewModel.roundResultAmountLabel).toBe("$50");
  });

  test("suppresses resolved outcomes and extra dealer cards while the dealer reveal sequence is in progress", () => {
    const state: TrainerState = {
      phase: "roundResolved",
      round: {
        dealerCards: [
          createCard("6"),
          createCard("10", "clubs"),
          createCard("5", "hearts"),
        ],
        dealerHoleHidden: false,
        playerHands: [
          {
            id: "hand-1",
            cards: [createCard("10", "hearts"), createCard("9", "diamonds")],
            bet: 25,
            hasDoubled: false,
            originatedFromSplit: false,
            status: "resolved",
            outcome: "loss",
            netResult: -25,
            summary: "Dealer 21 beats 19.",
          },
        ],
        activeHandIndex: 0,
        resultSummary: "Dealer 21 beats 19.",
        cutCardReachedDuringRound: false,
      },
      correction: null,
      stats: {
        totalHandsPlayed: 1,
        correctFirstTryDecisions: 1,
        decisionPointsResolved: 1,
        mistakesMade: 0,
        winnings: -25,
        currentStreak: 1,
        bestStreak: 1,
      },
      bannerMessage: null,
      wagerAmount: 25,
      nextHandSequence: 2,
      currentDecision: null,
    };

    const viewModel = buildTrainerViewModel(state, {
      dealerVisibleCardCount: 2,
      suppressResolvedOutcome: true,
    });

    expect(viewModel.headerSummary).toBe("Dealer resolving...");
    expect(viewModel.dealerHand?.cards).toHaveLength(2);
    expect(viewModel.playerHands[0].detail).toBeNull();
    expect(viewModel.roundResultAmountLabel).toBe("$25");
  });

  test("drops trailing .00 from three-digit whole-dollar round results", () => {
    const state: TrainerState = {
      phase: "roundResolved",
      round: {
        dealerCards: [createCard("6"), createCard("10", "clubs")],
        dealerHoleHidden: false,
        playerHands: [
          {
            id: "hand-1",
            cards: [createCard("10", "hearts"), createCard("10", "diamonds")],
            bet: 100,
            hasDoubled: false,
            originatedFromSplit: false,
            status: "resolved",
            outcome: "win",
            netResult: 100,
            summary: "20 beats dealer 16.",
          },
        ],
        activeHandIndex: 0,
        resultSummary: "hand-1: 20 beats dealer 16.",
        cutCardReachedDuringRound: false,
      },
      correction: null,
      stats: {
        totalHandsPlayed: 1,
        correctFirstTryDecisions: 1,
        decisionPointsResolved: 1,
        mistakesMade: 0,
        winnings: 100,
        currentStreak: 1,
        bestStreak: 1,
      },
      bannerMessage: null,
      wagerAmount: 100,
      nextHandSequence: 2,
      currentDecision: null,
    };

    const viewModel = buildTrainerViewModel(state);

    expect(viewModel.roundResultAmountLabel).toBe("$100");
  });
});
