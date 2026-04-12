import type { TrainerStateStore } from "@/application/ports";
import type { PersistedTrainerState } from "@/application/trainerState";

const STORAGE_KEY = "blackjack-trainer-session";

export class SessionStorageTrainerStore implements TrainerStateStore {
  load(): PersistedTrainerState | null {
    if (typeof window === "undefined") {
      return null;
    }

    const snapshot = window.sessionStorage.getItem(STORAGE_KEY);

    if (!snapshot) {
      return null;
    }

    return JSON.parse(snapshot) as PersistedTrainerState;
  }

  save(snapshot: PersistedTrainerState): void {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  clear(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.sessionStorage.removeItem(STORAGE_KEY);
  }
}
