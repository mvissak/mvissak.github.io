"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BlackjackTrainer } from "@/application/BlackjackTrainer";
import {
  dismissCorrection,
  restoreSession,
  startNewSession,
  startNextHand,
  submitInsuranceChoice,
  submitPlayerAction,
  updateWagerAmount,
  updateBlackjackPayout,
} from "@/application/useCases";
import type { TrainerState } from "@/application/trainerState";
import { SessionStorageTrainerStore } from "@/infrastructure/SessionStorageTrainerStore";
import { MathRandomSource } from "@/infrastructure/random";
import type { TrainerStateStore } from "@/application/ports";
import type { BlackjackPayout, InsuranceDecision, PlayerAction, RandomSource } from "@/domain/types";
import { blackjackRules } from "@/domain/blackjackRules";
import { themeTokens } from "@/presentation/theme/tokens";
import {
  buildCashOutMessage,
  type TrainerViewCashOut,
} from "@/presentation/view-models/buildCashOutMessage";
import type { RoundReactionType } from "@/presentation/roundReaction";
import { useDrinkServiceInterruptions } from "@/presentation/hooks/useDrinkServiceInterruptions";

interface UseTrainerControllerOptions {
  trainer?: BlackjackTrainer;
  store?: TrainerStateStore;
  autoAdvanceDelayMs?: number;
  blackjackReactionDelayMs?: number;
  dealerRevealDelayMs?: number;
  dealerDrawIntervalMs?: number;
  drinkOfferInitialDelayMs?: number;
  drinkOfferMaximumIntervalMs?: number;
  drinkOfferMinimumIntervalMs?: number;
  drinkOfferRandomSource?: RandomSource;
  drinkOfferResponseTimeoutMs?: number;
  winCelebrationDurationMs?: number;
}

const parseDurationToMs = (value: string): number => {
  const numericPortion = Number.parseFloat(value);

  if (!Number.isFinite(numericPortion)) {
    return 0;
  }

  if (value.endsWith("ms")) {
    return numericPortion;
  }

  if (value.endsWith("s")) {
    return numericPortion * 1_000;
  }

  return numericPortion;
};

export function useTrainerController(options: UseTrainerControllerOptions = {}) {
  const trainerRef = useRef(options.trainer ?? new BlackjackTrainer({ randomSource: new MathRandomSource() }));
  const storeRef = useRef(options.store ?? new SessionStorageTrainerStore());
  const drinkOfferRandomSourceRef = useRef(options.drinkOfferRandomSource ?? new MathRandomSource());
  const initializedRef = useRef(false);
  const previousStateRef = useRef<TrainerState | null>(null);
  const autoAdvanceTimerRef = useRef<number | null>(null);
  const autoAdvanceIntervalRef = useRef<number | null>(null);
  const autoAdvanceDeadlineRef = useRef<number | null>(null);
  const dealerRevealTimerRef = useRef<number | null>(null);
  const dealerDrawTimerRef = useRef<number | null>(null);
  const dealerSequencePendingRef = useRef(false);
  const roundReactionDelayTimerRef = useRef<number | null>(null);
  const roundReactionTimerRef = useRef<number | null>(null);
  const reactedRoundSignatureRef = useRef<string | null>(null);
  const [state, setState] = useState<TrainerState | null>(null);
  const [cashOutMessage, setCashOutMessage] = useState<TrainerViewCashOut | null>(null);
  const [countdownMsRemaining, setCountdownMsRemaining] = useState(0);
  const [dealerVisibleCardCount, setDealerVisibleCardCount] = useState<number | null>(null);
  const [revealDealerHoleCard, setRevealDealerHoleCard] = useState(false);
  const [dealerRevealComplete, setDealerRevealComplete] = useState(true);
  const [isRoundReactionPending, setIsRoundReactionPending] = useState(false);
  const [isCashOutOpen, setIsCashOutOpen] = useState(false);
  const [isResetSessionConfirmationOpen, setIsResetSessionConfirmationOpen] = useState(false);
  const [roundReaction, setRoundReaction] = useState<RoundReactionType | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const autoAdvanceDelayMs = options.autoAdvanceDelayMs ?? 3_000;
  const blackjackReactionDelayMs = options.blackjackReactionDelayMs ?? 1_000;
  const dealerRevealDelayMs =
    options.dealerRevealDelayMs ?? parseDurationToMs(themeTokens.motion.flip);
  const dealerDrawIntervalMs =
    options.dealerDrawIntervalMs ?? parseDurationToMs(themeTokens.motion.slow);
  const winCelebrationDurationMs = options.winCelebrationDurationMs ?? 3_000;
  const drinkInterruptions = useDrinkServiceInterruptions({
    initialDelayMs: options.drinkOfferInitialDelayMs,
    isBlocked:
      !state ||
      state.phase === "insuranceDecision" ||
      state.correction !== null ||
      isCashOutOpen ||
      isResetSessionConfirmationOpen ||
      roundReaction !== null ||
      isRoundReactionPending ||
      !dealerRevealComplete,
    maximumIntervalMs: options.drinkOfferMaximumIntervalMs,
    minimumIntervalMs: options.drinkOfferMinimumIntervalMs,
    randomSource: drinkOfferRandomSourceRef.current,
    responseTimeoutMs: options.drinkOfferResponseTimeoutMs,
    sessionKey,
  });
  const isNextHandCountdownBlocked =
    drinkInterruptions.isInterrupting ||
    isCashOutOpen ||
    isResetSessionConfirmationOpen ||
    roundReaction !== null ||
    isRoundReactionPending;

  const clearAutoAdvanceCountdown = () => {
    if (autoAdvanceTimerRef.current !== null) {
      window.clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    if (autoAdvanceIntervalRef.current !== null) {
      window.clearInterval(autoAdvanceIntervalRef.current);
      autoAdvanceIntervalRef.current = null;
    }

    autoAdvanceDeadlineRef.current = null;
    setCountdownMsRemaining(0);
  };

  const clearDealerRevealSequence = () => {
    if (dealerRevealTimerRef.current !== null) {
      window.clearTimeout(dealerRevealTimerRef.current);
      dealerRevealTimerRef.current = null;
    }

    if (dealerDrawTimerRef.current !== null) {
      window.clearTimeout(dealerDrawTimerRef.current);
      dealerDrawTimerRef.current = null;
    }

    dealerSequencePendingRef.current = false;
    setDealerVisibleCardCount(null);
    setRevealDealerHoleCard(false);
    setDealerRevealComplete(true);
  };

  const clearRoundReaction = () => {
    if (roundReactionDelayTimerRef.current !== null) {
      window.clearTimeout(roundReactionDelayTimerRef.current);
      roundReactionDelayTimerRef.current = null;
    }

    if (roundReactionTimerRef.current !== null) {
      window.clearTimeout(roundReactionTimerRef.current);
      roundReactionTimerRef.current = null;
    }

    setIsRoundReactionPending(false);
    setRoundReaction(null);
  };

  const syncCountdownRemaining = () => {
    if (autoAdvanceDeadlineRef.current === null) {
      setCountdownMsRemaining(0);
      return;
    }

    const remaining = Math.max(0, autoAdvanceDeadlineRef.current - Date.now());
    setCountdownMsRemaining(remaining);

    if (remaining === 0 && autoAdvanceIntervalRef.current !== null) {
      window.clearInterval(autoAdvanceIntervalRef.current);
      autoAdvanceIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    const snapshot = storeRef.current.load();
    const initialState = snapshot
      ? restoreSession(trainerRef.current, snapshot)
      : startNewSession(trainerRef.current);

    initializedRef.current = true;
    setState(initialState);
    setSessionKey(1);
  }, []);

  useEffect(() => {
    if (!initializedRef.current || !state) {
      return;
    }

    storeRef.current.save(trainerRef.current.createSnapshot(state));
  }, [state]);

  useLayoutEffect(() => {
    if (!state || state.phase !== "roundResolved" || !state.round) {
      clearDealerRevealSequence();
      return;
    }

    const previousState = previousStateRef.current;
    const justResolved = previousState?.phase !== "roundResolved";
    const shouldFlipDealerHoleCard = state.round.dealerHoleHidden;
    const shouldAnimateDealerResolution =
      justResolved && (shouldFlipDealerHoleCard || state.round.dealerCards.length > 2);

    if (!shouldAnimateDealerResolution) {
      clearDealerRevealSequence();
      return;
    }

    clearDealerRevealSequence();
    dealerSequencePendingRef.current = true;
    setDealerVisibleCardCount(2);
    setRevealDealerHoleCard(false);
    setDealerRevealComplete(false);

    let nextVisibleCardCount = 2;
    const totalDealerCards = state.round.dealerCards.length;

    const revealNextDealerCard = () => {
      nextVisibleCardCount += 1;

      if (nextVisibleCardCount >= totalDealerCards) {
        dealerSequencePendingRef.current = false;
        setDealerVisibleCardCount(null);
        setDealerRevealComplete(true);
        dealerDrawTimerRef.current = null;
        return;
      }

      setDealerVisibleCardCount(nextVisibleCardCount);
      dealerDrawTimerRef.current = window.setTimeout(revealNextDealerCard, dealerDrawIntervalMs);
    };

    dealerRevealTimerRef.current = window.setTimeout(() => {
      if (shouldFlipDealerHoleCard) {
        setRevealDealerHoleCard(true);

        if (totalDealerCards <= 2) {
          dealerSequencePendingRef.current = false;
          setDealerVisibleCardCount(null);
          setDealerRevealComplete(true);
          dealerRevealTimerRef.current = null;
          return;
        }

        dealerDrawTimerRef.current = window.setTimeout(revealNextDealerCard, dealerDrawIntervalMs);
        dealerRevealTimerRef.current = null;
        return;
      }

      revealNextDealerCard();
      dealerRevealTimerRef.current = null;
    }, dealerRevealDelayMs);

    return () => {
      clearDealerRevealSequence();
    };
  }, [dealerDrawIntervalMs, dealerRevealDelayMs, state]);

  useEffect(() => {
    previousStateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (
      !state ||
      state.phase !== "roundResolved" ||
      !dealerRevealComplete ||
      !state.round ||
      dealerSequencePendingRef.current
    ) {
      return;
    }

    const roundSignature = JSON.stringify({
      hands: state.round.playerHands.map((hand) => ({
        id: hand.id,
        netResult: hand.netResult,
        outcome: hand.outcome,
      })),
      nextHandSequence: state.nextHandSequence,
    });

    if (reactedRoundSignatureRef.current === roundSignature) {
      return;
    }

    reactedRoundSignatureRef.current = roundSignature;
    const resolvedHands = state.round.playerHands.filter((hand) => hand.outcome !== null);
    const totalNet = resolvedHands.reduce((sum, hand) => sum + hand.netResult, 0);
    const hasDealerBlackjackLoss = resolvedHands.some(
      (hand) => hand.summary === "Dealer blackjack.",
    );
    const hasBlackjackWin = resolvedHands.some(
      (hand) => hand.outcome === "blackjack",
    );
    const reaction: RoundReactionType | null = hasDealerBlackjackLoss
      ? "dealerBlackjack"
      : hasBlackjackWin
        ? "blackjack"
        : totalNet > 0
          ? "victory"
          : totalNet < 0
            ? "loss"
            : "push";

    if (!reaction) {
      clearRoundReaction();
      return;
    }

    clearRoundReaction();

    const reactionDelayMs = reaction === "blackjack" ? blackjackReactionDelayMs : 0;

    const startReaction = () => {
      setIsRoundReactionPending(false);
      setRoundReaction(reaction);
      roundReactionTimerRef.current = window.setTimeout(() => {
        setRoundReaction(null);
        roundReactionTimerRef.current = null;
      }, winCelebrationDurationMs);
    };

    if (reactionDelayMs > 0) {
      setIsRoundReactionPending(true);
      roundReactionDelayTimerRef.current = window.setTimeout(() => {
        roundReactionDelayTimerRef.current = null;
        startReaction();
      }, reactionDelayMs);
      return;
    }

    startReaction();
  }, [blackjackReactionDelayMs, dealerRevealComplete, state, winCelebrationDurationMs]);

  useEffect(() => {
    if (
      !state ||
      state.phase !== "roundResolved" ||
      !dealerRevealComplete ||
      dealerSequencePendingRef.current ||
      isNextHandCountdownBlocked
    ) {
      clearAutoAdvanceCountdown();
      return;
    }

    clearAutoAdvanceCountdown();
    autoAdvanceDeadlineRef.current = Date.now() + autoAdvanceDelayMs;
    setCountdownMsRemaining(autoAdvanceDelayMs);
    autoAdvanceIntervalRef.current = window.setInterval(syncCountdownRemaining, 100);
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      clearAutoAdvanceCountdown();
      setState((currentState) =>
        currentState ? startNextHand(trainerRef.current, currentState) : currentState,
      );
    }, autoAdvanceDelayMs);

    return () => {
      clearAutoAdvanceCountdown();
    };
  }, [autoAdvanceDelayMs, dealerRevealComplete, isNextHandCountdownBlocked, state]);

  const confirmResetSession = () => {
    reactedRoundSignatureRef.current = null;
    clearDealerRevealSequence();
    clearAutoAdvanceCountdown();
    clearRoundReaction();
    setIsCashOutOpen(false);
    setCashOutMessage(null);
    setIsResetSessionConfirmationOpen(false);
    setState((currentState) =>
      startNewSession(trainerRef.current, currentState?.wagerAmount, currentState?.blackjackPayout),
    );
    setSessionKey((current) => current + 1);
  };

  const requestResetSession = () => {
    setIsResetSessionConfirmationOpen(true);
  };

  const cancelResetSession = () => {
    setIsResetSessionConfirmationOpen(false);
  };

  const openCashOut = () => {
    if (!state) {
      return;
    }

    reactedRoundSignatureRef.current = null;
    clearDealerRevealSequence();
    clearAutoAdvanceCountdown();
    clearRoundReaction();
    setIsResetSessionConfirmationOpen(false);
    setCashOutMessage(buildCashOutMessage(state.stats.winnings));
    setIsCashOutOpen(true);
    setState((currentState) =>
      startNewSession(trainerRef.current, currentState?.wagerAmount, currentState?.blackjackPayout),
    );
    setSessionKey((current) => current + 1);
  };

  const closeCashOut = () => {
    setIsCashOutOpen(false);
    setCashOutMessage(null);
  };

  const nextHand = () => {
    clearDealerRevealSequence();
    clearAutoAdvanceCountdown();
    clearRoundReaction();
    setIsCashOutOpen(false);
    setCashOutMessage(null);
    setState((currentState) =>
      currentState ? startNextHand(trainerRef.current, currentState) : currentState,
    );
  };

  const takeAction = (action: PlayerAction) => {
    setState((currentState) =>
      {
        if (!currentState) {
          return currentState;
        }

        const nextState = submitPlayerAction(trainerRef.current, currentState, action);

        if (
          nextState.phase === "roundResolved" &&
          nextState.round &&
          (nextState.round.dealerCards.length > 2 || nextState.round.dealerHoleHidden)
        ) {
          dealerSequencePendingRef.current = true;
          setDealerVisibleCardCount(2);
          setRevealDealerHoleCard(false);
          setDealerRevealComplete(false);
        }

        return nextState;
      },
    );
  };

  const chooseInsurance = (decision: InsuranceDecision) => {
    setState((currentState) =>
      currentState ? submitInsuranceChoice(trainerRef.current, currentState, decision) : currentState,
    );
  };

  const closeCorrection = () => {
    setState((currentState) =>
      currentState ? dismissCorrection(trainerRef.current, currentState) : currentState,
    );
  };

  const changeWagerAmount = (wagerAmount: number) => {
    setState((currentState) =>
      currentState ? updateWagerAmount(trainerRef.current, currentState, wagerAmount) : currentState,
    );
  };

  const changeBlackjackPayout = (blackjackPayout: BlackjackPayout) => {
    setState((currentState) =>
      currentState ? updateBlackjackPayout(trainerRef.current, currentState, blackjackPayout) : currentState,
    );
  };

  return {
    canAdvanceToNextHand:
      state?.phase === "roundResolved" &&
      dealerRevealComplete &&
      !dealerSequencePendingRef.current &&
      roundReaction === null,
    countdownProgressPercent:
      state?.phase === "roundResolved" &&
      dealerRevealComplete &&
      !dealerSequencePendingRef.current &&
      roundReaction === null &&
      autoAdvanceDelayMs > 0
        ? ((autoAdvanceDelayMs - countdownMsRemaining) / autoAdvanceDelayMs) * 100
        : 0,
    countdownSecondsRemaining:
      state?.phase === "roundResolved" &&
      dealerRevealComplete &&
      !dealerSequencePendingRef.current &&
      roundReaction === null
        ? Math.max(0, Math.ceil(countdownMsRemaining / 1000))
        : 0,
    cancelResetSession,
    cashOutMessage,
    closeCashOut,
    dismissDrinkReaction: drinkInterruptions.dismissReaction,
    dealerVisibleCardCount,
    drinkOfferSecondsRemaining: drinkInterruptions.offerSecondsRemaining,
    confirmResetSession,
    isCashOutOpen,
    isDrinkOfferOpen: drinkInterruptions.isOfferOpen,
    isResetSessionConfirmationOpen,
    isRoundReactionPending,
    openCashOut,
    orderDrink: drinkInterruptions.chooseDrink,
    requestResetSession,
    roundReaction,
    resultReactionActive: roundReaction !== null || isRoundReactionPending,
    revealDealerHoleCard,
    suppressResolvedOutcome:
      state?.phase === "roundResolved" &&
      (!dealerRevealComplete || dealerSequencePendingRef.current),
    waitressReaction: drinkInterruptions.reaction,
    insuranceDecisionActive: state?.phase === "insuranceDecision",
    nextHand,
    state,
    updateWagerAmount: changeWagerAmount,
    updateBlackjackPayout: changeBlackjackPayout,
    blackjackPayout: state?.blackjackPayout ?? blackjackRules.defaultBlackjackPayout,
    takeAction,
    chooseInsurance,
    closeCorrection,
    wagerAmount: state?.wagerAmount ?? 25,
  };
}
