import { getBasicStrategyReference } from "@/domain/strategy";

export type TrainerViewStrategyReference = ReturnType<typeof getBasicStrategyReference>;

export const buildStrategyReferenceViewModel = (): TrainerViewStrategyReference =>
  getBasicStrategyReference();
