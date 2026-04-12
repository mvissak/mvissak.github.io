import { blackjackRules } from "@/domain/blackjackRules";
import { Shoe } from "@/domain/Shoe";
import { getHandValue } from "@/domain/hand";
import {
  settleHand,
  deriveHandStatus,
  getAllowedActions,
  playDealerHand,
  shouldDealerPlay,
} from "@/domain/round";
import { getBasicStrategyDecision } from "@/domain/strategy";
import type { ShoeFactory } from "@/application/ports";
import type {
  PersistedTrainerState,
  PlayerHandState,
  RoundState,
  TrainerState,
} from "@/application/trainerState";
import { createEmptyStats } from "@/application/trainerState";
import type { Card, PlayerAction, RandomSource } from "@/domain/types";

interface BlackjackTrainerOptions {
  defaultWagerAmount?: number;
  randomSource: RandomSource;
  shoeFactory?: ShoeFactory;
}

const normalizeWagerAmount = (amount: number, fallbackAmount: number): number => {
  if (!Number.isFinite(amount)) {
    return fallbackAmount;
  }

  return Math.min(
    blackjackRules.maximumWagerAmount,
    Math.max(blackjackRules.minimumWagerAmount, Math.round(amount)),
  );
};

const createBaseState = (wagerAmount: number): TrainerState => ({
  phase: "ready",
  round: null,
  correction: null,
  stats: createEmptyStats(),
  bannerMessage: null,
  wagerAmount,
  nextHandSequence: 1,
  currentDecision: null,
});

export class BlackjackTrainer {
  private readonly randomSource: RandomSource;

  private readonly shoeFactory: ShoeFactory;

  private readonly defaultWagerAmount: number;

  private shoe: Shoe;

  constructor(options: BlackjackTrainerOptions) {
    this.randomSource = options.randomSource;
    this.shoeFactory = options.shoeFactory ?? ((randomSource) => Shoe.create(randomSource));
    this.defaultWagerAmount = normalizeWagerAmount(options.defaultWagerAmount ?? 25, 25);
    this.shoe = this.shoeFactory(this.randomSource);
  }

  startNewSession(wagerAmount = this.defaultWagerAmount): TrainerState {
    this.shoe = this.shoeFactory(this.randomSource);

    return this.dealRound(createBaseState(normalizeWagerAmount(wagerAmount, this.defaultWagerAmount)));
  }

  restore(snapshot: PersistedTrainerState): TrainerState {
    this.shoe = Shoe.fromSnapshot(snapshot.shoe, this.randomSource);

    return {
      ...snapshot.state,
      wagerAmount: normalizeWagerAmount(
        snapshot.state.wagerAmount ?? this.defaultWagerAmount,
        this.defaultWagerAmount,
      ),
    };
  }

  createSnapshot(state: TrainerState): PersistedTrainerState {
    return {
      state,
      shoe: this.shoe.snapshot(),
    };
  }

  dismissCorrection(state: TrainerState): TrainerState {
    return {
      ...state,
      correction: null,
    };
  }

  updateWagerAmount(state: TrainerState, wagerAmount: number): TrainerState {
    return {
      ...state,
      wagerAmount: normalizeWagerAmount(wagerAmount, state.wagerAmount),
    };
  }

  startNextHand(state: TrainerState): TrainerState {
    return this.dealRound({
      ...state,
      phase: "ready",
      round: null,
      correction: null,
      currentDecision: null,
      bannerMessage: state.bannerMessage,
    });
  }

  submitAction(state: TrainerState, action: PlayerAction): TrainerState {
    if (state.phase !== "playerTurn" || !state.round) {
      return state;
    }

    const activeHand = state.round.playerHands[state.round.activeHandIndex];
    const allowedActions = getAllowedActions(activeHand, state.round.playerHands.length);

    if (!allowedActions[action]) {
      return state;
    }

    const strategyDecision = getBasicStrategyDecision(
      activeHand.cards,
      state.round.dealerCards[0],
      allowedActions,
    );

    if (strategyDecision.action !== action) {
      return {
        ...state,
        correction: {
          incorrectAction: action,
          recommendedAction: strategyDecision.action,
          explanation: strategyDecision.explanation,
        },
        stats: {
          ...state.stats,
          mistakesMade: state.stats.mistakesMade + 1,
          currentStreak: 0,
        },
        currentDecision: state.currentDecision
          ? { ...state.currentDecision, hadMistake: true }
          : state.currentDecision,
      };
    }

    let nextState = this.recordCorrectDecision(state);
    const actionResult = this.applyAction(nextState, action);
    let nextRound = this.advanceRound(actionResult.round);
    nextState = {
      ...nextState,
      nextHandSequence: actionResult.nextHandSequence,
    };

    if (this.hasUnresolvedHands(nextRound)) {
      return {
        ...nextState,
        round: nextRound,
        correction: null,
        phase: "playerTurn",
        currentDecision: this.createDecisionTracker(nextRound),
      };
    }

    const dealerCards = shouldDealerPlay(nextRound.playerHands)
      ? playDealerHand(nextRound.dealerCards, this.shoe)
      : nextRound.dealerCards;
    const resolvedRound = this.resolveRound({
      ...nextRound,
      dealerCards,
      dealerHoleHidden: false,
    });

    const shouldReshuffle = this.shoe.needsReshuffle();

    if (shouldReshuffle) {
      this.shoe.reshuffle();
    }

    return {
      ...nextState,
      phase: "roundResolved",
      round: resolvedRound,
      correction: null,
      currentDecision: null,
      bannerMessage: shouldReshuffle ? "Shoe reshuffled for the next hand." : null,
      stats: {
        ...nextState.stats,
        totalHandsPlayed: nextState.stats.totalHandsPlayed + resolvedRound.playerHands.length,
        winnings:
          nextState.stats.winnings +
          resolvedRound.playerHands.reduce((total, hand) => total + hand.netResult, 0),
      },
    };
  }

  private dealRound(state: TrainerState): TrainerState {
    const playerFirst = this.shoe.drawCard();
    const dealerUpcard = this.shoe.drawCard();
    const playerSecond = this.shoe.drawCard();
    const dealerHole = this.shoe.drawCard();

    const playerHand = this.createPlayerHand(
      state.nextHandSequence,
      [playerFirst, playerSecond],
      state.wagerAmount,
    );
    const round: RoundState = {
      dealerCards: [dealerUpcard, dealerHole],
      dealerHoleHidden: true,
      playerHands: [playerHand],
      activeHandIndex: 0,
      resultSummary: null,
      cutCardReachedDuringRound: this.shoe.needsReshuffle(),
    };

    const playerValue = getHandValue(playerHand.cards);
    const dealerValue = getHandValue(round.dealerCards);

    if (playerValue.isBlackjack || dealerValue.isBlackjack) {
      const resolvedRound = this.resolveRound({
        ...round,
        dealerHoleHidden: false,
      });
      const shouldReshuffle = this.shoe.needsReshuffle();

      if (shouldReshuffle) {
        this.shoe.reshuffle();
      }

      return {
        ...state,
        phase: "roundResolved",
        round: resolvedRound,
        nextHandSequence: state.nextHandSequence + 1,
        bannerMessage: shouldReshuffle ? "Shoe reshuffled for the next hand." : state.bannerMessage,
        stats: {
          ...state.stats,
          totalHandsPlayed: state.stats.totalHandsPlayed + resolvedRound.playerHands.length,
          winnings:
            state.stats.winnings +
            resolvedRound.playerHands.reduce((total, hand) => total + hand.netResult, 0),
        },
      };
    }

    return {
      ...state,
      phase: "playerTurn",
      round,
      correction: null,
      bannerMessage: state.bannerMessage,
      nextHandSequence: state.nextHandSequence + 1,
      currentDecision: this.createDecisionTracker(round),
    };
  }

  private createPlayerHand(
    sequence: number,
    cards: Card[],
    betAmount: number,
    originatedFromSplit = false,
  ): PlayerHandState {
    return {
      id: `hand-${sequence}`,
      cards,
      bet: betAmount,
      hasDoubled: false,
      originatedFromSplit,
      status: deriveHandStatus(cards, originatedFromSplit),
      outcome: null,
      netResult: 0,
      summary: null,
    };
  }

  private createDecisionTracker(round: RoundState) {
    const activeHand = round.playerHands[round.activeHandIndex];
    const allowedActions = getAllowedActions(activeHand, round.playerHands.length);

    return {
      signature: JSON.stringify({
        dealer: round.dealerCards[0].rank,
        cards: activeHand.cards.map((card) => card.id),
        allowedActions,
      }),
      hadMistake: false,
    };
  }

  private recordCorrectDecision(state: TrainerState): TrainerState {
    const wasClean = state.currentDecision?.hadMistake === false;
    const nextStreak = wasClean ? state.stats.currentStreak + 1 : 0;

    return {
      ...state,
      stats: {
        ...state.stats,
        decisionPointsResolved: state.stats.decisionPointsResolved + 1,
        correctFirstTryDecisions:
          state.stats.correctFirstTryDecisions + (wasClean ? 1 : 0),
        currentStreak: nextStreak,
        bestStreak: Math.max(state.stats.bestStreak, nextStreak),
      },
    };
  }

  private applyAction(
    state: TrainerState,
    action: PlayerAction,
  ): { round: RoundState; nextHandSequence: number } {
    const round = state.round as RoundState;
    const playerHands = [...round.playerHands];
    const activeHand = { ...playerHands[round.activeHandIndex] };

    switch (action) {
      case "stand": {
        activeHand.status = deriveHandStatus(activeHand.cards, activeHand.originatedFromSplit, true);
        playerHands[round.activeHandIndex] = activeHand;
        return {
          round: {
            ...round,
            playerHands,
          },
          nextHandSequence: state.nextHandSequence,
        };
      }
      case "hit": {
        activeHand.cards = [...activeHand.cards, this.shoe.drawCard()];
        activeHand.status = deriveHandStatus(activeHand.cards, activeHand.originatedFromSplit);
        playerHands[round.activeHandIndex] = activeHand;
        return {
          round: {
            ...round,
            playerHands,
            cutCardReachedDuringRound:
              round.cutCardReachedDuringRound || this.shoe.needsReshuffle(),
          },
          nextHandSequence: state.nextHandSequence,
        };
      }
      case "double": {
        activeHand.bet *= 2;
        activeHand.hasDoubled = true;
        activeHand.cards = [...activeHand.cards, this.shoe.drawCard()];
        activeHand.status = deriveHandStatus(
          activeHand.cards,
          activeHand.originatedFromSplit,
          !getHandValue(activeHand.cards).isBust,
        );
        playerHands[round.activeHandIndex] = activeHand;
        return {
          round: {
            ...round,
            playerHands,
            cutCardReachedDuringRound:
              round.cutCardReachedDuringRound || this.shoe.needsReshuffle(),
          },
          nextHandSequence: state.nextHandSequence,
        };
      }
      case "split": {
        const [leftSeed, rightSeed] = activeHand.cards;
        const leftHand = this.createPlayerHand(
          state.nextHandSequence,
          [leftSeed, this.shoe.drawCard()],
          activeHand.bet,
          true,
        );
        const rightHand = this.createPlayerHand(
          state.nextHandSequence + 1,
          [rightSeed, this.shoe.drawCard()],
          activeHand.bet,
          true,
        );
        playerHands.splice(round.activeHandIndex, 1, leftHand, rightHand);

        return {
          round: {
            ...round,
            playerHands,
            cutCardReachedDuringRound:
              round.cutCardReachedDuringRound || this.shoe.needsReshuffle(),
          },
          nextHandSequence: state.nextHandSequence + 2,
        };
      }
    }
  }

  private advanceRound(round: RoundState): RoundState {
    const nextIndex = round.playerHands.findIndex((hand) => hand.status === "playing");

    return {
      ...round,
      activeHandIndex: nextIndex === -1 ? round.activeHandIndex : nextIndex,
    };
  }

  private hasUnresolvedHands(round: RoundState): boolean {
    return round.playerHands.some((hand) => hand.status === "playing");
  }

  private resolveRound(round: RoundState): RoundState {
    const dealerCards = round.dealerCards;
    const resolvedHands = round.playerHands.map((hand) => {
      const settled = settleHand(hand, dealerCards);

      return {
        ...hand,
        status: "resolved" as const,
        outcome: settled.result,
        netResult: settled.net,
        summary: settled.summary,
      };
    });

    const resultSummary = resolvedHands
      .map((hand) => `${hand.id}: ${hand.summary}`)
      .join(" ");

    return {
      ...round,
      dealerHoleHidden: false,
      playerHands: resolvedHands,
      resultSummary,
    };
  }
}
