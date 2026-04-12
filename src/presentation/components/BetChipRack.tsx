"use client";

import { BetChipStack } from "@/presentation/components/BetChipStack";
import type { TrainerViewBetStack } from "@/presentation/view-models/betChips";

interface BetChipRackProps {
  stacks: TrainerViewBetStack[];
}

export function BetChipRack({ stacks }: BetChipRackProps) {
  if (stacks.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-4" role="list" aria-label="Bet chips">
      {stacks.map((stack) => (
        <BetChipStack key={stack.id} stack={stack} />
      ))}
    </div>
  );
}
