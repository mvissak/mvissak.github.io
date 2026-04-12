"use client";

import { useEffect, useRef, useState } from "react";
import type { RandomSource } from "@/domain/types";
import { drinkServiceConfig } from "@/presentation/config/drinkService";

export type DrinkOrderChoice =
  | "heineken"
  | "bottledWater"
  | "oldFashioned"
  | "tequilaSodaWithLime";

export interface WaitressReaction {
  description: string;
  tone: "disappointed" | "neutral";
  title: string;
}

interface UseDrinkServiceInterruptionsOptions {
  initialDelayMs?: number;
  isBlocked: boolean;
  maximumIntervalMs?: number;
  minimumIntervalMs?: number;
  randomSource: RandomSource;
  responseTimeoutMs?: number;
  sessionKey: number;
}

const buildRandomCadence = (
  randomSource: RandomSource,
  minimumIntervalMs: number,
  maximumIntervalMs: number,
): number => {
  if (maximumIntervalMs <= minimumIntervalMs) {
    return minimumIntervalMs;
  }

  return Math.round(
    minimumIntervalMs + randomSource.next() * (maximumIntervalMs - minimumIntervalMs),
  );
};

export function useDrinkServiceInterruptions({
  initialDelayMs = drinkServiceConfig.firstOfferDelayMs,
  isBlocked,
  maximumIntervalMs = drinkServiceConfig.maximumCadenceMs,
  minimumIntervalMs = drinkServiceConfig.minimumCadenceMs,
  randomSource,
  responseTimeoutMs = drinkServiceConfig.responseTimeoutMs,
  sessionKey,
}: UseDrinkServiceInterruptionsOptions) {
  const blockedRef = useRef(isBlocked);
  const scheduleTimerRef = useRef<number | null>(null);
  const responseTimerRef = useRef<number | null>(null);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [offerSecondsRemaining, setOfferSecondsRemaining] = useState(0);
  const [pendingOffer, setPendingOffer] = useState(false);
  const [reaction, setReaction] = useState<WaitressReaction | null>(null);

  useEffect(() => {
    blockedRef.current = isBlocked;
  }, [isBlocked]);

  const clearScheduledOffer = () => {
    if (scheduleTimerRef.current !== null) {
      window.clearTimeout(scheduleTimerRef.current);
      scheduleTimerRef.current = null;
    }
  };

  const clearOfferTimeout = () => {
    if (responseTimerRef.current !== null) {
      window.clearTimeout(responseTimerRef.current);
      responseTimerRef.current = null;
    }

    setOfferSecondsRemaining(0);
  };

  const openTimeoutReaction = () => {
    setIsOfferOpen(false);
    setReaction({
      description:
        "You were too late. The waitress walked away, and the whole table registered the hesitation.",
      tone: "disappointed",
      title: "Too slow.",
    });
  };

  const openOffer = () => {
    clearOfferTimeout();
    setPendingOffer(false);
    setReaction(null);
    setIsOfferOpen(true);
    setOfferSecondsRemaining(Math.max(0, Math.ceil(responseTimeoutMs / 1_000)));
    responseTimerRef.current = window.setTimeout(() => {
      clearOfferTimeout();
      openTimeoutReaction();
    }, responseTimeoutMs);
  };

  const scheduleOffer = (delayMs: number) => {
    clearScheduledOffer();
    scheduleTimerRef.current = window.setTimeout(() => {
      scheduleTimerRef.current = null;

      if (blockedRef.current) {
        setPendingOffer(true);
        return;
      }

      openOffer();
    }, delayMs);
  };

  const scheduleRandomOffer = () => {
    scheduleOffer(buildRandomCadence(randomSource, minimumIntervalMs, maximumIntervalMs));
  };

  const resetInterruptions = () => {
    clearScheduledOffer();
    clearOfferTimeout();
    setIsOfferOpen(false);
    setPendingOffer(false);
    setReaction(null);
  };

  useEffect(() => {
    if (sessionKey === 0) {
      resetInterruptions();
      return;
    }

    resetInterruptions();
    scheduleOffer(initialDelayMs);

    return () => {
      resetInterruptions();
    };
  }, [initialDelayMs, maximumIntervalMs, minimumIntervalMs, randomSource, responseTimeoutMs, sessionKey]);

  useEffect(() => {
    if (!isOfferOpen) {
      return;
    }

    const countdownIntervalId = window.setInterval(() => {
      setOfferSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1_000);

    return () => {
      window.clearInterval(countdownIntervalId);
    };
  }, [isOfferOpen]);

  useEffect(() => {
    if (!pendingOffer || isBlocked || isOfferOpen || reaction) {
      return;
    }

    openOffer();
  }, [isBlocked, isOfferOpen, pendingOffer, reaction, responseTimeoutMs]);

  const chooseDrink = (choice: DrinkOrderChoice) => {
    if (!isOfferOpen) {
      return;
    }

    clearOfferTimeout();
    setIsOfferOpen(false);

    if (choice === "bottledWater") {
      setReaction({
        description:
          "Wrong answer. The table thinks you are uncool, and the vibe takes a measurable hit.",
        tone: "disappointed",
        title: "Bottled water?",
      });
      return;
    }

    setReaction({
      description:
        "She says it will be right over, but with bets this small you are nowhere near the top of the service list. Realistically, there is a decent chance that drink never makes it back to the table.",
      tone: "neutral",
      title: "Cheers! Good luck with that.",
    });
  };

  const dismissReaction = () => {
    setReaction(null);
    scheduleRandomOffer();
  };

  return {
    chooseDrink,
    dismissReaction,
    isInterrupting: isOfferOpen || reaction !== null,
    isOfferOpen,
    offerSecondsRemaining,
    reaction,
  };
}
