import {
  decomposeBetAmountToChips,
  type ChipDenomination,
} from "@/presentation/theme/casinoChips";

export interface TrainerViewBetStack {
  denominations: ChipDenomination[];
  id: string;
  totalLabel: string;
}

const formatBetLabel = (value: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const buildBetChipStacks = (
  handId: string,
  totalBetAmount: number,
  hasDoubled: boolean,
): TrainerViewBetStack[] => {
  const stackBetAmount = hasDoubled ? totalBetAmount / 2 : totalBetAmount;
  const stackDenominations = decomposeBetAmountToChips(stackBetAmount);
  const stackCount = hasDoubled ? 2 : 1;

  return Array.from({ length: stackCount }, (_, index) => ({
    denominations: stackDenominations,
    id: `${handId}-bet-stack-${index + 1}`,
    totalLabel: formatBetLabel(stackBetAmount),
  }));
};
