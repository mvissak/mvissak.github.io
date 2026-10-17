import type { DealerUpcardRank, PlayerAction } from "@/domain/types";

type HiLoIndex = {
  minimumTrueCount: number;
  dealerUpcard: DealerUpcardRank;
} & (
  | { kind: "hard"; total: number; action: "stand" | "double" }
  | { kind: "pair"; rank: "10"; action: Extract<PlayerAction, "split"> }
  | { kind: "insurance"; action: "insurance" }
);

// Selected Hi-Lo indices from Schlesinger's Illustrious 18, reproduced in
// https://wizardofodds.com/games/blackjack/card-counting/high-low/ .
// These indices are shared by the reference guide and count-aware validation.
export const hiLoIndices: ReadonlyArray<HiLoIndex> = [
  { minimumTrueCount: 0, kind: "hard", total: 16, dealerUpcard: "10", action: "stand" },
  { minimumTrueCount: 1, kind: "hard", total: 9, dealerUpcard: "2", action: "double" },
  { minimumTrueCount: 1, kind: "hard", total: 11, dealerUpcard: "A", action: "double" },
  { minimumTrueCount: 2, kind: "hard", total: 12, dealerUpcard: "3", action: "stand" },
  { minimumTrueCount: 3, kind: "hard", total: 12, dealerUpcard: "2", action: "stand" },
  { minimumTrueCount: 3, kind: "hard", total: 9, dealerUpcard: "7", action: "double" },
  { minimumTrueCount: 3, kind: "insurance", dealerUpcard: "A", action: "insurance" },
  { minimumTrueCount: 4, kind: "hard", total: 15, dealerUpcard: "10", action: "stand" },
  { minimumTrueCount: 4, kind: "hard", total: 10, dealerUpcard: "10", action: "double" },
  { minimumTrueCount: 4, kind: "hard", total: 10, dealerUpcard: "A", action: "double" },
  { minimumTrueCount: 4, kind: "pair", rank: "10", dealerUpcard: "6", action: "split" },
  { minimumTrueCount: 5, kind: "hard", total: 16, dealerUpcard: "9", action: "stand" },
  { minimumTrueCount: 5, kind: "pair", rank: "10", dealerUpcard: "5", action: "split" },
  { minimumTrueCount: -1, kind: "hard", total: 13, dealerUpcard: "2", action: "stand" },
  { minimumTrueCount: 0, kind: "hard", total: 12, dealerUpcard: "4", action: "stand" },
  { minimumTrueCount: -2, kind: "hard", total: 12, dealerUpcard: "5", action: "stand" },
  { minimumTrueCount: -1, kind: "hard", total: 12, dealerUpcard: "6", action: "stand" },
  { minimumTrueCount: -2, kind: "hard", total: 13, dealerUpcard: "3", action: "stand" },
];
