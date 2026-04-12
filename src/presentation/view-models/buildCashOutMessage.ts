export interface TrainerViewCashOut {
  description: string;
  headline: string;
  sessionTotalLabel: string;
  tone: "neutral" | "positive";
}

interface CashOutCelebration {
  description: string;
  minimumAmount: number;
}

const moneyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const celebrationTiers: CashOutCelebration[] = [
  {
    minimumAmount: 25,
    description:
      "enough for a victory diner breakfast with hash browns, bad coffee, and a wildly confident tip.",
  },
  {
    minimumAmount: 75,
    description:
      "enough for an aggressively overpriced airport sandwich and still a little left for bottled regret.",
  },
  {
    minimumAmount: 150,
    description:
      "enough for a suspicious karaoke machine and at least one immediate neighbor complaint.",
  },
  {
    minimumAmount: 300,
    description:
      "enough for a rolling army of novelty sunglasses and temporary control of a beach boardwalk.",
  },
  {
    minimumAmount: 600,
    description:
      "enough for a used smoke machine, a velvet blazer, and a deeply unnecessary personal rebrand.",
  },
  {
    minimumAmount: 1_000,
    description:
      "enough to buy a heroic quantity of gas-station snacks and still fund the dumbest road trip idea in the group chat.",
  },
];

const getPositiveDescription = (winnings: number): string => {
  const celebration =
    [...celebrationTiers]
      .reverse()
      .find((tier) => winnings >= tier.minimumAmount) ?? celebrationTiers[0];

  return `You leave the table up ${moneyFormatter.format(winnings)}. That is ${celebration.description}`;
};

export const buildCashOutMessage = (winnings: number): TrainerViewCashOut => {
  if (winnings > 0) {
    return {
      description: getPositiveDescription(winnings),
      headline: "Cash out approved. Nicely done.",
      sessionTotalLabel: moneyFormatter.format(winnings),
      tone: "positive",
    };
  }

  if (winnings < 0) {
    return {
      description: `You are down ${moneyFormatter.format(Math.abs(winnings))}, but this trainer runs on infinite bankroll. No cashier is alarmed and no one needs to call your bank.`,
      headline: "Cash out logged. Nothing dramatic happened.",
      sessionTotalLabel: `-${moneyFormatter.format(Math.abs(winnings))}`,
      tone: "neutral",
    };
  }

  return {
    description:
      "You are leaving flat. The imaginary cashier gives you a polite nod and absolutely no parade.",
    headline: "Cash out logged. You broke even.",
    sessionTotalLabel: moneyFormatter.format(0),
    tone: "neutral",
  };
};
