import type { PersistedTrainerState } from "@/application/trainerState";
import type { RandomSource } from "@/domain/types";

export interface TrainerStateStore {
  load(): PersistedTrainerState | null;
  save(snapshot: PersistedTrainerState): void;
  clear(): void;
}

export type ShoeFactory = (randomSource: RandomSource) => import("@/domain/Shoe").Shoe;
