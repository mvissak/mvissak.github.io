import type { CountFeedbackChoice, TrainingCountFeedback } from "@/application/trainerState";
import type { InsuranceDecision, PlayerAction } from "@/domain/types";
import { formatTrueCount } from "@/presentation/view-models/buildTrainerViewModel";

const actionLabels: Record<PlayerAction, string> = { hit: "Hit", stand: "Stand", double: "Double", split: "Split" };
const insuranceLabels: Record<InsuranceDecision, string> = { yes: "Buy Insurance", no: "No Insurance" };

export const buildCountFeedbackViewModel = (feedback: TrainingCountFeedback | null) => {
  if (!feedback) return null;
  const chosenLabel = feedback.kind === "action" ? actionLabels[feedback.chosenAction] : insuranceLabels[feedback.chosenAction];
  const basicLabel = feedback.kind === "action" ? actionLabels[feedback.basicAction] : insuranceLabels[feedback.basicAction];
  const preferredLabel = feedback.kind === "action" ? actionLabels[feedback.preferredAction] : insuranceLabels[feedback.preferredAction];
  const chosePreferred = feedback.chosenAction === feedback.preferredAction;
  const primaryChoice: CountFeedbackChoice = chosePreferred ? "original" : "preferred";
  return {
    title: chosePreferred ? "Good count read" : "Good chart recall",
    summary: chosePreferred
      ? `You chose ${chosenLabel}, the preferred count-based play for this hand.`
      : `You chose ${chosenLabel}, which follows basic strategy. The count favors ${preferredLabel} here.`,
    trueCountLabel: formatTrueCount(feedback.trueCount),
    basicLabel,
    preferredLabel,
    explanation: feedback.explanation,
    rationale: feedback.rationale,
    primaryLabel: chosePreferred ? "Continue" : feedback.kind === "insurance" ? "Buy Insurance" : `Use ${preferredLabel}`,
    primaryChoice,
    keepLabel: chosePreferred ? null : feedback.kind === "insurance" ? "Decline Insurance" : `Keep ${chosenLabel}`,
  };
};

export type TrainerViewCountFeedback = NonNullable<ReturnType<typeof buildCountFeedbackViewModel>>;
