import type { ShoeSnapshot } from "@/domain/Shoe";
import type {
  Card,
  BlackjackPayout,
  GamePhase,
  HandStatus,
  InsuranceDecision,
  PlayerAction,
  RoundResult,
} from "@/domain/types";

export interface TrainingCorrection {
  incorrectAction?: PlayerAction;
  recommendedAction?: PlayerAction;
  incorrectLabel?: string;
  recommendedLabel?: string;
  explanation: string;
}

export interface SessionStats {
  totalHandsPlayed: number;
  correctFirstTryDecisions: number;
  decisionPointsResolved: number;
  mistakesMade: number;
  winnings: number;
  currentStreak: number;
  bestStreak: number;
}

export interface PlayerHandState {
  id: string;
  cards: Card[];
  bet: number;
  hasDoubled: boolean;
  originatedFromSplit: boolean;
  status: HandStatus;
  outcome: RoundResult | null;
  netResult: number;
  summary: string | null;
}

export interface RoundState {
  blackjackPayout: BlackjackPayout;
  dealerCards: Card[];
  dealerHoleHidden: boolean;
  playerHands: PlayerHandState[];
  activeHandIndex: number;
  resultSummary: string | null;
  cutCardReachedDuringRound: boolean;
  shoeCardsRemaining: number;
  insuranceBet: number;
  insuranceNetResult: number;
}

export interface DecisionTracker {
  signature: string;
  hadMistake: boolean;
  mistakeKeys: string[];
}

interface CountFeedbackContext {
  trueCount: number;
  explanation: string;
  rationale: string;
}

export type TrainingCountFeedback = CountFeedbackContext & (
  | { kind: "action"; chosenAction: PlayerAction; basicAction: PlayerAction; preferredAction: PlayerAction }
  | { kind: "insurance"; chosenAction: InsuranceDecision; basicAction: "no"; preferredAction: "yes" }
);

export type CountFeedbackChoice = "preferred" | "original";

export interface TrainerState {
  phase: GamePhase;
  round: RoundState | null;
  correction: TrainingCorrection | null;
  stats: SessionStats;
  bannerMessage: string | null;
  wagerAmount: number;
  blackjackPayout: BlackjackPayout;
  nextHandSequence: number;
  runningCountBeforeRound: number;
  roundExposedCardIds: string[];
  currentDecision: DecisionTracker | null;
  decisionNotice: string | null;
  countFeedback: TrainingCountFeedback | null;
  nextWagerDecision: { baseWager: number; error: string | null } | null;
}

export type NextWagerChoice = "increase" | "decrease" | "keep";

type PersistedRoundState = Omit<RoundState, "blackjackPayout" | "shoeCardsRemaining" | "insuranceBet" | "insuranceNetResult"> &
  Partial<Pick<RoundState, "blackjackPayout" | "shoeCardsRemaining" | "insuranceBet" | "insuranceNetResult">>;

export interface PersistedTrainerState {
  state: Omit<TrainerState, "blackjackPayout" | "round" | "runningCountBeforeRound" | "roundExposedCardIds" | "decisionNotice" | "nextWagerDecision" | "countFeedback"> & {
    blackjackPayout?: BlackjackPayout;
    runningCountBeforeRound?: number;
    roundExposedCardIds?: string[];
    decisionNotice?: string | null;
    countFeedback?: TrainingCountFeedback | null;
    nextWagerDecision?: TrainerState["nextWagerDecision"];
    round: PersistedRoundState | null;
  };
  shoe: ShoeSnapshot;
}

export const createEmptyStats = (): SessionStats => ({
  totalHandsPlayed: 0,
  correctFirstTryDecisions: 0,
  decisionPointsResolved: 0,
  mistakesMade: 0,
  winnings: 0,
  currentStreak: 0,
  bestStreak: 0,
});
