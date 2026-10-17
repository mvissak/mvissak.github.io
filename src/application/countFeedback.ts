import type { CountAwareStrategyDecision, CountInsuranceGuidance } from "@/domain/strategy";
import type { InsuranceDecision, PlayerAction } from "@/domain/types";
import type { TrainingCountFeedback } from "@/application/trainerState";

export const createActionCountFeedback = (
  decision: CountAwareStrategyDecision,
  chosenAction: PlayerAction,
  trueCount: number | null,
): TrainingCountFeedback | null => {
  if (trueCount === null || !decision.countAction || !decision.countExplanation || !decision.countRationale) return null;
  return {
    kind: "action",
    chosenAction,
    basicAction: decision.basicStrategy.action,
    preferredAction: decision.countAction,
    trueCount,
    explanation: decision.countExplanation,
    rationale: decision.countRationale,
  };
};

export const createInsuranceCountFeedback = (
  guidance: CountInsuranceGuidance | null,
  chosenAction: InsuranceDecision,
  trueCount: number | null,
): TrainingCountFeedback | null => trueCount !== null && guidance ? {
  kind: "insurance",
  chosenAction,
  basicAction: guidance.basicAction,
  preferredAction: guidance.countAction,
  trueCount,
  explanation: guidance.explanation,
  rationale: guidance.rationale,
} : null;
