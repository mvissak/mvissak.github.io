import { blackjackRules } from "@/domain/blackjackRules";
import type { NextWagerChoice, TrainerState } from "@/application/trainerState";

export const normalizeWagerAmount = (amount: number, fallbackAmount: number): number =>
  Number.isFinite(amount)
    ? Math.min(blackjackRules.maximumWagerAmount, Math.max(blackjackRules.minimumWagerAmount, Math.round(amount)))
    : fallbackAmount;

export const getNextWagerOptions = (state: TrainerState) => ({
  minimum: blackjackRules.minimumWagerAmount,
  maximum: blackjackRules.maximumWagerAmount,
  canIncrease: !!state.nextWagerDecision && state.nextWagerDecision.baseWager < blackjackRules.maximumWagerAmount,
  canDecrease: !!state.nextWagerDecision && state.nextWagerDecision.baseWager > blackjackRules.minimumWagerAmount,
});

export const confirmNextWager = (
  state: TrainerState,
  choice: NextWagerChoice,
  amount?: number,
): TrainerState => {
  const pending = state.nextWagerDecision;
  if (!pending || state.phase !== "roundResolved") return state;
  const target = choice === "keep" ? pending.baseWager : amount;
  let error: string | null = null;
  if (target === undefined || !Number.isFinite(target) || !Number.isInteger(target) ||
      target < blackjackRules.minimumWagerAmount || target > blackjackRules.maximumWagerAmount) {
    error = `Enter a whole-dollar bet from $${blackjackRules.minimumWagerAmount} to $${blackjackRules.maximumWagerAmount}.`;
  } else if (choice === "increase" && target <= pending.baseWager) {
    error = "Enter an amount higher than your current base bet to increase it.";
  } else if (choice === "decrease" && target >= pending.baseWager) {
    error = "Enter an amount lower than your current base bet to decrease it.";
  }
  if (error || target === undefined) return {
    ...state,
    nextWagerDecision: { ...pending, error },
  };
  return { ...state, wagerAmount: target, nextWagerDecision: null };
};
