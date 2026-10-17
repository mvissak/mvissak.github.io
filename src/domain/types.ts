export const ranks = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
] as const;

export const suits = ["clubs", "diamonds", "hearts", "spades"] as const;

export const playerActions = ["hit", "stand", "double", "split"] as const;

export const dealerUpcardOrder = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "A"] as const;

export type Rank = (typeof ranks)[number];
export type Suit = (typeof suits)[number];
export type PlayerAction = (typeof playerActions)[number];
export type InsuranceDecision = "yes" | "no";
export type BlackjackPayout = "6:5" | "3:2";
export type DealerUpcardRank = (typeof dealerUpcardOrder)[number];
export type StrategyMatrixAction = "H" | "S" | "D" | "Ds" | "P";
export type GamePhase = "ready" | "insuranceDecision" | "playerTurn" | "dealerTurn" | "roundResolved";
export type HandStatus = "awaitingDeal" | "playing" | "stood" | "busted" | "blackjack" | "resolved";
export type RoundResult = "win" | "loss" | "push" | "blackjack";
export type StrategyKind = "hard" | "soft" | "pair";

export interface Card {
  id: string;
  rank: Rank;
  suit: Suit;
}

export interface AllowedActions {
  hit: boolean;
  stand: boolean;
  double: boolean;
  split: boolean;
}

export interface HandValue {
  total: number;
  hardTotal: number;
  softTotal: number | null;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
}

export interface RandomSource {
  next(): number;
}

export interface StrategyDecision {
  action: PlayerAction;
  code: StrategyMatrixAction;
  rowKey: string;
  handKind: StrategyKind;
  fallbackApplied: boolean;
  explanation: string;
}

export interface SettledHand {
  result: RoundResult;
  net: number;
  summary: string;
}
