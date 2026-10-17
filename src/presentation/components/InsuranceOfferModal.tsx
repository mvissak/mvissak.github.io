"use client";

import { ControlButton } from "@/presentation/components/ControlButton";
import { ModalFrame } from "@/presentation/components/ModalFrame";

interface InsuranceOfferModalProps {
  insuranceAmountLabel: string;
  trueCountLabel: string;
  isOpen: boolean;
  onChooseNo: () => void;
  onChooseYes: () => void;
}

export function InsuranceOfferModal({
  insuranceAmountLabel,
  trueCountLabel,
  isOpen,
  onChooseNo,
  onChooseYes,
}: InsuranceOfferModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalFrame titleId="insurance-title">
      <p className="text-xs uppercase tracking-[0.35em] text-gold-muted">Insurance</p>
      <h2 id="insurance-title" className="mt-3 font-display text-3xl text-gold">
        Dealer shows an ace.
      </h2>
      <p className="mt-4 text-base leading-7 text-ivory/85">
        Insurance costs {insuranceAmountLabel}, which is 50% of your original wager. Do you want
        to buy insurance before the dealer checks for blackjack?
      </p>
      <p className="mt-2 text-sm leading-6 text-ivory/85">Current true count: {trueCountLabel}. Declining is always accepted. Buying insurance is accepted at true count +3 or higher and pays 2:1 on dealer blackjack.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <ControlButton variant="ghost" onClick={onChooseYes}>
          Yes, Buy Insurance
        </ControlButton>
        <ControlButton variant="primary" onClick={onChooseNo}>
          No Insurance
        </ControlButton>
      </div>
    </ModalFrame>
  );
}
