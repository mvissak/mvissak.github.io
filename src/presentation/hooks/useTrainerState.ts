"use client";

import { useCallback, useRef, useState } from "react";
import type { TrainerState } from "@/application/trainerState";

type StateUpdate = TrainerState | null | ((current: TrainerState | null) => TrainerState | null);

export function useTrainerState() {
  const [state, renderState] = useState<TrainerState | null>(null);
  const currentStateRef = useRef<TrainerState | null>(null);
  const updateState = useCallback((update: StateUpdate) => {
    // Trainer transitions consume the mutable shoe. Run them once outside React's
    // replayable state updaters, retaining the latest state for batched events.
    const nextState = typeof update === "function" ? update(currentStateRef.current) : update;
    currentStateRef.current = nextState;
    renderState(nextState);
  }, []);
  return [state, updateState] as const;
}
