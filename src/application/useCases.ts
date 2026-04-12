import { BlackjackTrainer } from "@/application/BlackjackTrainer";
import type { PersistedTrainerState, TrainerState } from "@/application/trainerState";
import type { PlayerAction } from "@/domain/types";

export const startNewSession = (
  trainer: BlackjackTrainer,
  wagerAmount?: number,
): TrainerState => trainer.startNewSession(wagerAmount);

export const restoreSession = (
  trainer: BlackjackTrainer,
  snapshot: PersistedTrainerState,
): TrainerState => trainer.restore(snapshot);

export const startNextHand = (trainer: BlackjackTrainer, state: TrainerState): TrainerState =>
  trainer.startNextHand(state);

export const submitPlayerAction = (
  trainer: BlackjackTrainer,
  state: TrainerState,
  action: PlayerAction,
): TrainerState => trainer.submitAction(state, action);

export const dismissCorrection = (trainer: BlackjackTrainer, state: TrainerState): TrainerState =>
  trainer.dismissCorrection(state);

export const updateWagerAmount = (
  trainer: BlackjackTrainer,
  state: TrainerState,
  wagerAmount: number,
): TrainerState => trainer.updateWagerAmount(state, wagerAmount);
