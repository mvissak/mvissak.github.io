"use client";

import { useLayoutEffect, useMemo } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { recordExposedCards } from "@/application/cardCounting";
import type { TrainerState } from "@/application/trainerState";
import { getFaceUpCardIds } from "@/presentation/view-models/cardVisibility";
import type { CardVisibilityOptions } from "@/presentation/view-models/cardVisibility";

interface UseCardCountingOptions extends CardVisibilityOptions {
  state: TrainerState | null;
  setState: Dispatch<SetStateAction<TrainerState | null>>;
  dealerSequencePendingRef: RefObject<boolean>;
}

export function useCardCounting({
  state,
  setState,
  dealerSequencePendingRef,
  dealerVisibleCardCount,
  revealDealerHoleCard,
}: UseCardCountingOptions) {
  const faceUpCardIds = useMemo(() => state ? getFaceUpCardIds(state, {
    dealerVisibleCardCount,
    revealDealerHoleCard,
  }) : [], [state, dealerVisibleCardCount, revealDealerHoleCard]);

  useLayoutEffect(() => {
    // Dealer animation setup runs first. Wait for its visibility state to render
    // before recording exposures from an initially resolved/restored hand.
    if (!state || (dealerSequencePendingRef.current && dealerVisibleCardCount == null)) return;
    setState((current) => current ? recordExposedCards(current, faceUpCardIds) : current);
  }, [state, faceUpCardIds, setState, dealerSequencePendingRef, dealerVisibleCardCount]);
}
