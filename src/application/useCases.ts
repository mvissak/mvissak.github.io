import { BlackjackTrainer } from "@/application/BlackjackTrainer";
import type { NextWagerChoice, PersistedTrainerState, TrainerState } from "@/application/trainerState";
import { confirmNextWager } from "@/application/wagerDecision";
import type { BlackjackPayout, InsuranceDecision, PlayerAction } from "@/domain/types";

export const startNewSession = (
  trainer: BlackjackTrainer,
  wagerAmount?: number,
  blackjackPayout?: BlackjackPayout,
): TrainerState => trainer.startNewSession(wagerAmount, blackjackPayout);

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

export const submitInsuranceChoice = (
  trainer: BlackjackTrainer,
  state: TrainerState,
  decision: InsuranceDecision,
): TrainerState => trainer.submitInsuranceDecision(state, decision);

export const updateBlackjackPayout = (
  trainer: BlackjackTrainer,
  state: TrainerState,
  blackjackPayout: BlackjackPayout,
): TrainerState => trainer.updateBlackjackPayout(state, blackjackPayout);

export const submitNextWagerChoice = (state: TrainerState, choice: NextWagerChoice, amount?: number): TrainerState =>
  confirmNextWager(state, choice, amount);
