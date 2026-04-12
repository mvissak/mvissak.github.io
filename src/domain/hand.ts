import type {
  Card,
  DealerUpcardRank,
  HandValue,
  Rank,
  StrategyKind,
} from "@/domain/types";

export type PairRank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "A";

export interface HandProfile {
  kind: StrategyKind;
  total: number;
  label: string;
  pairRank: PairRank | null;
}

const tenValueRanks: readonly Rank[] = ["10", "J", "Q", "K"];

export const getCardNumericValue = (rank: Rank): number => {
  if (rank === "A") {
    return 1;
  }

  if (tenValueRanks.includes(rank)) {
    return 10;
  }

  return Number(rank);
};

export const getDealerUpcardRank = (card: Card): DealerUpcardRank => {
  if (card.rank === "A") {
    return "A";
  }

  if (tenValueRanks.includes(card.rank)) {
    return "10";
  }

  return card.rank as DealerUpcardRank;
};

export const getPairRank = (cards: Card[]): PairRank | null => {
  if (cards.length !== 2) {
    return null;
  }

  const [firstCard, secondCard] = cards;
  const firstRank = firstCard.rank === "A" ? "A" : String(getCardNumericValue(firstCard.rank));
  const secondRank = secondCard.rank === "A" ? "A" : String(getCardNumericValue(secondCard.rank));

  return firstRank === secondRank ? (firstRank as PairRank) : null;
};

export const isPair = (cards: Card[]): boolean => getPairRank(cards) !== null;

export const getHandValue = (cards: Card[]): HandValue => {
  const aceCount = cards.filter((card) => card.rank === "A").length;
  const hardTotal = cards.reduce((total, card) => total + getCardNumericValue(card.rank), 0);
  const softCandidate = aceCount > 0 ? hardTotal + 10 : null;
  const isSoft = softCandidate !== null && softCandidate <= 21;
  const total = isSoft ? (softCandidate as number) : hardTotal;

  return {
    total,
    hardTotal,
    softTotal: softCandidate,
    isSoft,
    isBust: total > 21,
    isBlackjack: cards.length === 2 && total === 21,
  };
};

export const getHandProfile = (cards: Card[], splitAvailable: boolean): HandProfile => {
  const handValue = getHandValue(cards);
  const pairRank = splitAvailable ? getPairRank(cards) : null;

  if (pairRank && pairRank !== "5") {
    return {
      kind: "pair",
      total: handValue.total,
      label: `${pairRank},${pairRank}`,
      pairRank,
    };
  }

  if (handValue.isSoft && handValue.total >= 13 && handValue.total <= 20) {
    return {
      kind: "soft",
      total: handValue.total,
      label: `A,${handValue.total - 11}`,
      pairRank: null,
    };
  }

  return {
    kind: "hard",
    total: handValue.total,
    label: String(handValue.total),
    pairRank,
  };
};

export const formatCardLabel = (card: Card): string => {
  const suitSymbols: Record<Card["suit"], string> = {
    clubs: "C",
    diamonds: "D",
    hearts: "H",
    spades: "S",
  };

  return `${card.rank}${suitSymbols[card.suit]}`;
};
