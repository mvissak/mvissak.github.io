import type { TrainerState } from "@/application/trainerState";
import { blackjackRules } from "@/domain/blackjackRules";

export interface TrainerViewShoeNotice {
  title: string;
  message: string;
}

export const buildShoeNoticeViewModel = (state: TrainerState | null): TrainerViewShoeNotice | null => {
  if (!state?.bannerMessage || !state.round) return null;
  return state.phase === "roundResolved" ? {
    title: "Shoe reshuffled",
    message: `A fresh ${blackjackRules.deckCount}-deck shoe is ready for the next hand. The running count will restart at 0 before the next deal.`,
  } : {
    title: "New shoe in play",
    message: `This hand uses a fresh ${blackjackRules.deckCount}-deck shoe. The running count restarted at 0 before this hand's face-up cards were counted.`,
  };
};
