import { getCountDirection } from "@/domain/cardCounting";
import type { CountDirection } from "@/domain/cardCounting";
import { hiLoIndices } from "@/domain/cardCountingReference";
import { blackjackRules } from "@/domain/blackjackRules";
import type { BlackjackPayout } from "@/domain/types";
import { formatRunningCount, formatTrueCount } from "@/presentation/view-models/buildTrainerViewModel";

export interface CountReferenceSection {
  id: CountDirection;
  title: string;
  meaning: string;
  betting: string;
  playing: string;
  isCurrent: boolean;
}

export interface TrainerViewCardCountingReference {
  currentCountLabel: string;
  currentTrueCountLabel: string;
  trainerPolicy: string;
  sections: CountReferenceSection[];
  trueCountFormula: string;
  trueCountExample: string;
  payoutNote: string;
  studyRows: Array<{ threshold: string; plays: string[] }>;
  sources: Array<{ label: string; href: string }>;
}

export const buildCardCountingReferenceViewModel = (
  runningCount: number,
  blackjackPayout: BlackjackPayout,
  trueCount: number | null = null,
): TrainerViewCardCountingReference => {
  const direction = getCountDirection(runningCount);
  const countLabel = formatRunningCount(runningCount);
  const sections: Array<Omit<CountReferenceSection, "isCurrent">> = [
    {
      id: "positive",
      title: "Positive count",
      meaning: "More low cards have left the shoe; the remaining cards are richer in tens and aces.",
      betting: "Use the true count and a planned bet spread before raising your next wager.",
      playing: "Basic strategy remains accepted. A qualifying Hi-Lo index also allows a supported stand, double, split, or insurance choice.",
    },
    {
      id: "neutral",
      title: "Zero count",
      meaning: "High and low card removals balance out; the count gives no signal to increase your bet.",
      betting: `Keep your baseline wager, starting at the $${blackjackRules.minimumWagerAmount} table minimum.`,
      playing: "Follow basic strategy, or use a supported index at zero. Decline insurance below true count +3.",
    },
    {
      id: "negative",
      title: "Negative count",
      meaning: "More high cards have left the shoe; the remaining cards are richer in low cards.",
      betting: "Keep the minimum or your baseline wager; in live play, sitting out unfavorable shoes is an option.",
      playing: "The chart remains accepted. Supported negative indices can also allow hitting specific hard totals; keep unrelated doubles and splits.",
    },
  ];
  const groupedPlays = new Map<number, string[]>();
  for (const index of hiLoIndices) {
    const play = index.kind === "insurance"
      ? "Insurance against an Ace."
      : index.kind === "pair"
        ? `Split ${index.rank},${index.rank} vs ${index.dealerUpcard}.`
        : `${index.action === "stand" ? "Stand" : "Double"} hard ${index.total} vs ${index.dealerUpcard}.`;
    const plays = groupedPlays.get(index.minimumTrueCount) ?? [];
    plays.push(play);
    groupedPlays.set(index.minimumTrueCount, plays);
  }

  return {
    currentCountLabel: `${countLabel} running count · ${direction}`,
    currentTrueCountLabel: `True count ${formatTrueCount(trueCount)}`,
    trainerPolicy: "Basic strategy remains accepted. Supported Hi-Lo exceptions are also accepted at their true-count indices. After each hand, choose a custom next bet or keep your base bet.",
    sections: sections.map((section) => ({ ...section, isCurrent: section.id === direction })),
    trueCountFormula: "True count = running count ÷ estimated decks remaining",
    trueCountExample: "Example: +6 running count with 3 decks remaining is a +2 true count. Both counts are displayed above; validation uses the unrounded true count.",
    payoutNote: blackjackPayout === "6:5"
      ? "This hand pays 6:5. The smaller blackjack payout increases the house edge compared with 3:2; a positive count alone does not establish a player advantage."
      : "This hand pays 3:2. Assess the true count and all table rules before choosing a betting spread.",
    studyRows: [...groupedPlays].sort(([left], [right]) => left - right).map(([threshold, plays]) => ({
      threshold: `≥ ${formatRunningCount(threshold)}`,
      plays,
    })),
    sources: [
      { label: "Hi-Lo and index reference", href: "https://wizardofodds.com/games/blackjack/card-counting/high-low/" },
      { label: "Count fundamentals", href: "https://wizardofodds.com/games/blackjack/card-counting/introduction/" },
      { label: "Payout and table rules", href: "https://wizardofodds.com/games/blackjack/rule-variations/" },
    ],
  };
};
