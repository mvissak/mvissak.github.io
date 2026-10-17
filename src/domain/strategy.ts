import { dealerUpcardOrder } from "@/domain/types";
import { blackjackRules } from "@/domain/blackjackRules";
import { getDealerUpcardRank, getHandProfile, getHandValue } from "@/domain/hand";
import { hiLoIndices } from "@/domain/cardCountingReference";
import type {
  AllowedActions,
  Card,
  DealerUpcardRank,
  PlayerAction,
  StrategyDecision,
  StrategyMatrixAction,
} from "@/domain/types";

export interface BasicStrategyReferenceRow {
  label: string;
  summary: string;
}

export interface BasicStrategyReferenceSection {
  title: string;
  rows: BasicStrategyReferenceRow[];
}

export interface BasicStrategyReference {
  assumptions: string[];
  sections: BasicStrategyReferenceSection[];
}

const hardStrategyTable = {
  "5": ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  "6": ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  "7": ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  "8": ["H", "H", "H", "H", "H", "H", "H", "H", "H", "H"],
  "9": ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
  "10": ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
  "11": ["D", "D", "D", "D", "D", "D", "D", "D", "D", "H"],
  "12": ["H", "H", "S", "S", "S", "H", "H", "H", "H", "H"],
  "13": ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  "14": ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  "15": ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  "16": ["S", "S", "S", "S", "S", "H", "H", "H", "H", "H"],
  "17": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  "18": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  "19": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  "20": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  "21": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
} as const satisfies Record<string, readonly StrategyMatrixAction[]>;

const softStrategyTable = {
  "A,2": ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
  "A,3": ["H", "H", "H", "D", "D", "H", "H", "H", "H", "H"],
  "A,4": ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
  "A,5": ["H", "H", "D", "D", "D", "H", "H", "H", "H", "H"],
  "A,6": ["H", "D", "D", "D", "D", "H", "H", "H", "H", "H"],
  "A,7": ["S", "Ds", "Ds", "Ds", "Ds", "S", "S", "H", "H", "H"],
  "A,8": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  "A,9": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
} as const satisfies Record<string, readonly StrategyMatrixAction[]>;

const pairStrategyTable = {
  "2,2": ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
  "3,3": ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
  "4,4": ["H", "H", "H", "P", "P", "H", "H", "H", "H", "H"],
  "5,5": ["D", "D", "D", "D", "D", "D", "D", "D", "H", "H"],
  "6,6": ["P", "P", "P", "P", "P", "H", "H", "H", "H", "H"],
  "7,7": ["P", "P", "P", "P", "P", "P", "H", "H", "H", "H"],
  "8,8": ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
  "9,9": ["P", "P", "P", "P", "P", "S", "P", "P", "S", "S"],
  "10,10": ["S", "S", "S", "S", "S", "S", "S", "S", "S", "S"],
  "A,A": ["P", "P", "P", "P", "P", "P", "P", "P", "P", "P"],
} as const satisfies Record<string, readonly StrategyMatrixAction[]>;

const strategyActionDescriptions: Record<StrategyMatrixAction, string> = {
  H: "hit",
  S: "stand",
  D: "double if allowed, otherwise hit",
  Ds: "double if allowed, otherwise stand",
  P: "split",
};

const resolveMatrixAction = (
  code: StrategyMatrixAction,
  allowedActions: AllowedActions,
): { action: PlayerAction; fallbackApplied: boolean } => {
  switch (code) {
    case "H":
      return { action: "hit", fallbackApplied: false };
    case "S":
      return { action: "stand", fallbackApplied: false };
    case "P":
      return { action: "split", fallbackApplied: false };
    case "D":
      return {
        action: allowedActions.double ? "double" : "hit",
        fallbackApplied: !allowedActions.double,
      };
    case "Ds":
      return {
        action: allowedActions.double ? "double" : "stand",
        fallbackApplied: !allowedActions.double,
      };
  }
};

const formatDealerUpcardList = (upcards: readonly DealerUpcardRank[]): string => {
  if (upcards.length === 1) {
    return upcards[0];
  }

  if (upcards.length === 2) {
    return `${upcards[0]} or ${upcards[1]}`;
  }

  return `${upcards.slice(0, -1).join(", ")}, or ${upcards[upcards.length - 1]}`;
};

const getStrategyRow = (rowKey: string): readonly StrategyMatrixAction[] => {
  if (rowKey === "soft-below-13") {
    return dealerUpcardOrder.map(() => "H");
  }

  if (rowKey in pairStrategyTable) {
    return pairStrategyTable[rowKey as keyof typeof pairStrategyTable];
  }

  if (rowKey in softStrategyTable) {
    return softStrategyTable[rowKey as keyof typeof softStrategyTable];
  }

  return hardStrategyTable[rowKey as keyof typeof hardStrategyTable];
};

const buildGenericRuleSummary = (handLabel: string, rowKey: string): string => {
  const segmentSummary = buildRuleSegmentSummary(rowKey);

  return `General rule: with ${handLabel}, ${segmentSummary}.`;
};

const buildRuleSegmentSummary = (rowKey: string): string => {
  const row = getStrategyRow(rowKey);
  const segments = row.reduce<
    Array<{ code: StrategyMatrixAction; upcards: DealerUpcardRank[] }>
  >((groups, code, index) => {
    const dealerUpcard = dealerUpcardOrder[index];
    const previousGroup = groups[groups.length - 1];

    if (previousGroup && previousGroup.code === code) {
      previousGroup.upcards.push(dealerUpcard);
      return groups;
    }

    groups.push({ code, upcards: [dealerUpcard] });
    return groups;
  }, []);

  const segmentSummary = segments
    .map(
      (segment) =>
        `${strategyActionDescriptions[segment.code]} against dealer upcards ${formatDealerUpcardList(segment.upcards)}`,
    )
    .join("; ");

  return segmentSummary;
};

const buildExplanation = (
  action: PlayerAction,
  handLabel: string,
  dealerUpcard: DealerUpcardRank,
  code: StrategyMatrixAction,
  rowKey: string,
  fallbackApplied: boolean,
): string => {
  const genericRule = buildGenericRuleSummary(handLabel, rowKey);

  if (fallbackApplied && code === "D") {
    return `Basic strategy says to hit ${handLabel} against a dealer ${dealerUpcard} because the chart rule here is double if allowed, otherwise hit, and doubling is not available in this state. ${genericRule}`;
  }

  if (fallbackApplied && code === "Ds") {
    return `Basic strategy says to stand on ${handLabel} against a dealer ${dealerUpcard} because the chart rule here is double if allowed, otherwise stand, and doubling is not available in this state. ${genericRule}`;
  }

  switch (action) {
    case "hit":
      return `Basic strategy says to hit ${handLabel} against a dealer ${dealerUpcard} because your hand is not strong enough to stand yet. ${genericRule}`;
    case "stand":
      return `Basic strategy says to stand on ${handLabel} against a dealer ${dealerUpcard} because your current total is already the higher-value position. ${genericRule}`;
    case "double":
      return `Basic strategy says to double ${handLabel} against a dealer ${dealerUpcard} because this is a strong one-card improvement spot with extra value. ${genericRule}`;
    case "split":
      return `Basic strategy says to split ${handLabel} against a dealer ${dealerUpcard} because two fresh hands outperform keeping this pair together. ${genericRule}`;
  }
};

export const getBasicStrategyDecision = (
  cards: Card[],
  dealerUpcardCard: Card,
  allowedActions: AllowedActions,
): StrategyDecision => {
  const dealerUpcard = getDealerUpcardRank(dealerUpcardCard);
  const handProfile = getHandProfile(cards, allowedActions.split);

  let rowKey = handProfile.label;

  if (handProfile.kind === "soft" && handProfile.total <= 12) {
    rowKey = "soft-below-13";
  }

  const code = getStrategyRow(rowKey)[dealerUpcardOrder.indexOf(dealerUpcard)];
  const resolution = resolveMatrixAction(code, allowedActions);

  return {
    action: resolution.action,
    code,
    rowKey,
    handKind: handProfile.kind,
    fallbackApplied: resolution.fallbackApplied,
    explanation: buildExplanation(
      resolution.action,
      handProfile.label,
      dealerUpcard,
      code,
      rowKey,
      resolution.fallbackApplied,
    ),
  };
};

const buildReferenceRows = (
  rows: Record<string, readonly StrategyMatrixAction[]>,
  labelFormatter: (rowKey: string) => string,
): BasicStrategyReferenceRow[] =>
  Object.keys(rows).map((rowKey) => ({
    label: labelFormatter(rowKey),
    summary: `${buildRuleSegmentSummary(rowKey)}.`,
  }));

export interface CountAwareStrategyDecision {
  basicStrategy: StrategyDecision;
  acceptedActions: PlayerAction[];
  countAction: PlayerAction | null;
  countExplanation: string | null;
  countRationale: string | null;
}

export const getCountAwareStrategyDecision = (
  cards: Card[],
  dealerCard: Card,
  allowedActions: AllowedActions,
  trueCount: number | null,
): CountAwareStrategyDecision => {
  const basicStrategy = getBasicStrategyDecision(cards, dealerCard, allowedActions);
  const baseline: CountAwareStrategyDecision = {
    basicStrategy,
    acceptedActions: [basicStrategy.action],
    countAction: null,
    countExplanation: null,
    countRationale: null,
  };
  if (trueCount === null || !Number.isFinite(trueCount)) return baseline;
  const profile = getHandProfile(cards, allowedActions.split);
  const value = getHandValue(cards);
  const upcard = getDealerUpcardRank(dealerCard);
  const index = hiLoIndices.find((candidate) =>
    candidate.dealerUpcard === upcard && (
      candidate.kind === "hard"
        ? profile.kind === "hard" && !value.isSoft && candidate.total === value.total
        : candidate.kind === "pair" && profile.kind === "pair" && candidate.rank === profile.pairRank
    ),
  );
  if (!index || index.kind === "insurance") return baseline;
  const countAction = trueCount >= index.minimumTrueCount
    ? index.action
    : index.kind === "hard" && index.action === "stand" ? "hit" : null;
  if (!countAction || !allowedActions[countAction] || countAction === basicStrategy.action) return baseline;
  const comparison = trueCount >= index.minimumTrueCount ? "at or above" : "below";
  return {
    basicStrategy,
    acceptedActions: [basicStrategy.action, countAction],
    countAction,
    countExplanation: `Hi-Lo favors ${countAction} on ${profile.label} vs ${upcard} when the true count is ${comparison} ${index.minimumTrueCount}.`,
    countRationale: countAction === "hit"
      ? "At this lower count, the shoe has relatively fewer ten-value cards that would bust this hard total. Taking another card is preferred."
      : countAction === "stand"
        ? "Standing avoids the risk of busting on another card. At this index, that is preferable to the chart's hit."
        : countAction === "double"
          ? "The richer supply of tens and aces improves the value of drawing one card with a doubled wager at this index."
          : "Against this weak dealer upcard, the high count makes two separately wagered hands preferable to keeping the pair together at this index.",
  };
};

export interface CountInsuranceGuidance {
  basicAction: "no";
  countAction: "yes";
  explanation: string;
  rationale: string;
}

export const getCountInsuranceGuidance = (trueCount: number | null): CountInsuranceGuidance | null => {
  const index = hiLoIndices.find((candidate) => candidate.kind === "insurance");
  if (trueCount === null || !Number.isFinite(trueCount) || !index || trueCount < index.minimumTrueCount) return null;
  return {
    basicAction: "no",
    countAction: "yes",
    explanation: `Hi-Lo favors buying insurance at a true count of ${index.minimumTrueCount} or higher.`,
    rationale: `Insurance pays ${blackjackRules.insurancePayout}:1 when the dealer's hole card is worth ten. At this index, the richer supply of ten-value cards makes the side bet preferable to declining it.`,
  };
};

export const isCountInsuranceAllowed = (trueCount: number | null): boolean => getCountInsuranceGuidance(trueCount) !== null;

export const getBasicStrategyReference = (): BasicStrategyReference => ({
  assumptions: [
    `This trainer grades decisions against a total-based ${blackjackRules.deckCount}-deck dealer-stands-on-soft-17 basic-strategy chart.`,
    "Composition-dependent deviations are not used. A multi-card hard or soft total is played the same way as the same total built from two cards unless the chart itself changes because doubling or splitting is no longer allowed.",
    "Dealer 10 means any ten-value upcard: 10, J, Q, or K.",
    "Splits are only offered on identical ranks. Mixed ten-value hands such as Q,10 are treated as hard totals, not as pairs.",
    "Rows marked double if allowed fall back to hit or stand exactly as written when doubling is unavailable.",
    "5,5 is treated as a hard 10. Basic strategy stands on 10,10; a supported true-count index can also allow splitting.",
    "Basic strategy remains accepted. Supported Hi-Lo exceptions are also accepted when their true-count threshold is met and the action is legal.",
    "Declining insurance remains accepted. Buying it is also accepted at a true count of +3 or higher, with a half-wager side bet paying 2:1 on dealer blackjack.",
  ],
  sections: [
    {
      title: "Hard Totals",
      rows: buildReferenceRows(hardStrategyTable, (rowKey) => `Hard ${rowKey}`),
    },
    {
      title: "Soft Totals",
      rows: [
        {
          label: "Soft totals below 13",
          summary: `${buildRuleSegmentSummary("soft-below-13")}.`,
        },
        ...buildReferenceRows(softStrategyTable, (rowKey) => `Soft ${rowKey}`),
      ],
    },
    {
      title: "Pairs",
      rows: buildReferenceRows(pairStrategyTable, (rowKey) => `Pair ${rowKey}`),
    },
  ],
});
