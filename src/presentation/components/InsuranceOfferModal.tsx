"use client";

import { ControlButton } from "@/presentation/components/ControlButton";

interface InsuranceOfferModalProps {
  insuranceAmountLabel: string;
  isOpen: boolean;
  onChooseNo: () => void;
  onChooseYes: () => void;
}

export function InsuranceOfferModal({
  insuranceAmountLabel,
  isOpen,
  onChooseNo,
  onChooseYes,
}: InsuranceOfferModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-overlay px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="insurance-title"
    >
      <div className="table-panel w-full max-w-xl px-6 py-6">
        <p className="text-xs uppercase tracking-[0.35em] text-gold-muted">Insurance</p>
        <h2 id="insurance-title" className="mt-3 font-display text-3xl text-gold">
          Dealer shows an ace.
        </h2>
        <p className="mt-4 text-base leading-7 text-ivory/85">
          Insurance costs {insuranceAmountLabel}, which is 50% of your original wager. Do you want
          to buy insurance before the dealer checks for blackjack?
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <ControlButton variant="ghost" onClick={onChooseYes}>
            Yes, Buy Insurance
          </ControlButton>
          <ControlButton variant="primary" onClick={onChooseNo}>
            No Insurance
          </ControlButton>
        </div>
      </div>
    </div>
  );
}
