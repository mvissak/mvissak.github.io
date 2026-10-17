import type { TrainerState } from "@/application/trainerState";
import { getNextWagerOptions } from "@/application/wagerDecision";
import { formatTrueCount } from "@/presentation/view-models/buildTrainerViewModel";
import { buildShoeNoticeViewModel } from "@/presentation/view-models/buildShoeNoticeViewModel";

export const buildNextWagerViewModel = (state: TrainerState | null, trueCount: number | null) => {
  if (!state?.nextWagerDecision) return null;
  const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  const options = getNextWagerOptions(state);
  const shoeNotice = buildShoeNoticeViewModel(state);
  return {
    ...options,
    baseWager: state.nextWagerDecision.baseWager,
    keepLabel: `Keep ${money(state.nextWagerDecision.baseWager)}`,
    limitsLabel: `Enter a custom whole-dollar amount from ${money(options.minimum)} to ${money(options.maximum)}.`,
    countLabel: shoeNotice?.message ?? `True count ${formatTrueCount(trueCount)} before the next hand.`,
    shoeNotice,
    error: state.nextWagerDecision.error,
    insuranceLabel: state.round && state.round.insuranceBet > 0
      ? `Insurance net: ${money(state.round.insuranceNetResult)} (included in your session total).`
      : null,
  };
};

export type TrainerViewNextWager = NonNullable<ReturnType<typeof buildNextWagerViewModel>>;
