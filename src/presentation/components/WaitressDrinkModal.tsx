"use client";

import { ControlButton } from "@/presentation/components/ControlButton";
import { ViewportPortal } from "@/presentation/components/ViewportPortal";
import type { DrinkOrderChoice } from "@/presentation/hooks/useDrinkServiceInterruptions";

interface WaitressDrinkModalProps {
  countdownSecondsRemaining: number;
  isOpen: boolean;
  onSelect: (choice: DrinkOrderChoice) => void;
}

const drinkOptions: Array<{ id: DrinkOrderChoice; label: string }> = [
  { id: "heineken", label: "Heineken" },
  { id: "bottledWater", label: "Bottled Water" },
  { id: "oldFashioned", label: "Old Fashioned" },
  { id: "tequilaSodaWithLime", label: "Tequila Soda with Lime" },
];

export function WaitressDrinkModal({
  countdownSecondsRemaining,
  isOpen,
  onSelect,
}: WaitressDrinkModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ViewportPortal>
      <div
        className="fixed inset-0 z-50 grid place-items-center bg-overlay px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitress-title"
      >
        <div className="table-panel w-full max-w-xl px-6 py-6">
          <p className="text-xs uppercase tracking-[0.35em] text-gold-muted">Table Service</p>
          <h2 id="waitress-title" className="mt-3 font-display text-3xl text-gold">
            The waitress just walked over.
          </h2>
          <p className="mt-4 text-base leading-7 text-ivory/85">
            She wants your drink order. Pick something before she gives up on this table.
          </p>
          <p className="mt-3 text-sm uppercase tracking-[0.25em] text-gold-muted">
            {countdownSecondsRemaining}s remaining
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {drinkOptions.map((option) => (
              <ControlButton
                key={option.id}
                variant="secondary"
                onClick={() => onSelect(option.id)}
              >
                {option.label}
              </ControlButton>
            ))}
          </div>
        </div>
      </div>
    </ViewportPortal>
  );
}
