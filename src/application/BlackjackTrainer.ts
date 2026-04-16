import { blackjackRules } from "@/domain/blackjackRules";
import { Shoe } from "@/domain/Shoe";
import { getDealerUpcardRank, getHandValue } from "@/domain/hand";
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
import type { Card, InsuranceDecision, PlayerAction, RandomSource } from "@/domain/types";

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

const actionLabels: Record<PlayerAction, string> = {
  hit: "Hit",
  stand: "Stand",
  double: "Double",
  split: "Split",
};

const insuranceChoiceLabels: Record<InsuranceDecision, string> = {
  no: "No Insurance",
  yes: "Yes, Buy Insurance",
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
      return this.recordMistake(
        state,
        {
          incorrectAction: action,
          recommendedAction: strategyDecision.action,
          explanation: strategyDecision.explanation,
        },
        action,
      );
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

  submitInsuranceDecision(state: TrainerState, decision: InsuranceDecision): TrainerState {
    if (state.phase !== "insuranceDecision" || !state.round) {
      return state;
    }

    if (decision === "yes") {
      return this.recordMistake(
        state,
        {
          incorrectLabel: insuranceChoiceLabels.yes,
          recommendedLabel: insuranceChoiceLabels.no,
          explanation:
            "Insurance is a negative-expectation side bet. Basic strategy always declines it because the half-bet cost is not justified just because the dealer shows an ace.",
        },
        `insurance:${decision}`,
      );
    }

    const nextState = this.recordCorrectDecision({
      ...state,
      correction: null,
    });

    return this.resolveInsuranceDecision(nextState);
  }

  private dealRound(state: TrainerState): TrainerState {
    const playerFirst = this.shoe.drawCard();
    const dealerHole = this.shoe.drawCard();
    const playerSecond = this.shoe.drawCard();
    const dealerUpcard = this.shoe.drawCard();

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
    const dealerUpcardKind = getDealerUpcardRank(dealerUpcard);

    if (playerValue.isBlackjack && (dealerUpcardKind === "A" || dealerUpcardKind === "10")) {
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
        round: {
          ...resolvedRound,
          dealerHoleHidden: true,
        },
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

    if (playerValue.isBlackjack) {
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

    if (dealerUpcardKind === "A") {
      return {
        ...state,
        phase: "insuranceDecision",
        round,
        correction: null,
        bannerMessage: state.bannerMessage,
        nextHandSequence: state.nextHandSequence + 1,
        currentDecision: this.createInsuranceDecisionTracker(round),
      };
    }

    if (dealerUpcardKind === "10" && dealerValue.isBlackjack && !playerValue.isBlackjack) {
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

    if (dealerValue.isBlackjack) {
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
      mistakeKeys: [],
    };
  }

  private createInsuranceDecisionTracker(round: RoundState) {
    return {
      signature: JSON.stringify({
        dealer: round.dealerCards[0].rank,
        insurance: true,
        cards: round.playerHands[0]?.cards.map((card) => card.id) ?? [],
      }),
      hadMistake: false,
      mistakeKeys: [],
    };
  }

  private recordMistake(
    state: TrainerState,
    correction: TrainerState["correction"],
    mistakeKey: string,
  ): TrainerState {
    const currentDecision = state.currentDecision;
    const alreadyRecorded = currentDecision?.mistakeKeys.includes(mistakeKey) ?? false;

    return {
      ...state,
      correction,
      stats: {
        ...state.stats,
        mistakesMade: alreadyRecorded ? state.stats.mistakesMade : state.stats.mistakesMade + 1,
        currentStreak: 0,
      },
      currentDecision: currentDecision
        ? {
            ...currentDecision,
            hadMistake: true,
            mistakeKeys: alreadyRecorded
              ? currentDecision.mistakeKeys
              : [...currentDecision.mistakeKeys, mistakeKey],
          }
        : currentDecision,
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
          [rightSeed],
          activeHand.bet,
          true,
        );
        rightHand.status = "awaitingDeal";
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

    if (nextIndex !== -1) {
      return {
        ...round,
        activeHandIndex: nextIndex,
      };
    }

    const awaitingDealIndex = round.playerHands.findIndex((hand) => hand.status === "awaitingDeal");

    if (awaitingDealIndex !== -1) {
      const playerHands = [...round.playerHands];
      const nextHand = { ...playerHands[awaitingDealIndex] };

      nextHand.cards = [...nextHand.cards, this.shoe.drawCard()];
      nextHand.status = deriveHandStatus(nextHand.cards, nextHand.originatedFromSplit);
      playerHands[awaitingDealIndex] = nextHand;

      return {
        ...round,
        activeHandIndex: awaitingDealIndex,
        playerHands,
        cutCardReachedDuringRound: round.cutCardReachedDuringRound || this.shoe.needsReshuffle(),
      };
    }

    return {
      ...round,
      activeHandIndex: round.activeHandIndex,
    };
  }

  private hasUnresolvedHands(round: RoundState): boolean {
    return round.playerHands.some((hand) => hand.status === "playing");
  }

  private resolveInsuranceDecision(state: TrainerState): TrainerState {
    const round = state.round as RoundState;
    const playerValue = getHandValue(round.playerHands[0].cards);
    const dealerValue = getHandValue(round.dealerCards);

    if (!dealerValue.isBlackjack && !playerValue.isBlackjack) {
      return {
        ...state,
        phase: "playerTurn",
        round,
        correction: null,
        currentDecision: this.createDecisionTracker(round),
      };
    }

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
      correction: null,
      currentDecision: null,
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
