"use client";

import { CasinoChip } from "@/presentation/components/CasinoChip";
import type { TrainerViewBetStack } from "@/presentation/view-models/betChips";

interface BetChipStackProps {
  stack: TrainerViewBetStack;
}

const chipLiftOffsetPx = 18;
const chipBaseHeightPx = 72;

export function BetChipStack({ stack }: BetChipStackProps) {
  const stackHeight = chipBaseHeightPx + chipLiftOffsetPx * Math.max(0, stack.denominations.length - 1);

  return (
    <div
      aria-label={`${stack.totalLabel} betting stack`}
      className="relative w-20 shrink-0"
      role="listitem"
      style={{ height: `${stackHeight}px` }}
    >
      {stack.denominations.map((denomination, index) => (
        <div
          key={`${stack.id}-${denomination}-${index}`}
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: `${index * chipLiftOffsetPx}px`,
            zIndex: index + 1,
          }}
        >
          <CasinoChip denomination={denomination} />
        </div>
      ))}
    </div>
  );
}
