"use client";

import {
  casinoChipPalettes,
  formatChipDenomination,
  type ChipDenomination,
} from "@/presentation/theme/casinoChips";

interface CasinoChipProps {
  denomination: ChipDenomination;
}

const buildAccentBackground = (accent: string): string =>
  `conic-gradient(from -18deg,
    transparent 0deg 30deg,
    ${accent} 30deg 46deg,
    transparent 46deg 120deg,
    ${accent} 120deg 136deg,
    transparent 136deg 210deg,
    ${accent} 210deg 226deg,
    transparent 226deg 300deg,
    ${accent} 300deg 316deg,
    transparent 316deg 360deg
  )`;

export function CasinoChip({ denomination }: CasinoChipProps) {
  const chipPalette = casinoChipPalettes[denomination];
  const amountLabel = formatChipDenomination(denomination);

  return (
    <div
      aria-label={`${amountLabel} chip`}
      className="relative h-16 w-16 shrink-0 rounded-full shadow-card tablet:h-[4.5rem] tablet:w-[4.5rem]"
      role="img"
    >
      <div
        className="absolute inset-0 rounded-full border border-black/10"
        style={{
          background: `linear-gradient(145deg, ${chipPalette.edgeTint} 0%, ${chipPalette.edgeBase} 45%, ${chipPalette.edgeShadow} 100%)`,
          boxShadow: "inset 0 2px 5px rgba(255,255,255,0.22), inset 0 -4px 8px rgba(0,0,0,0.2)",
        }}
      />
      <div
        className="absolute inset-[0.16rem] rounded-full"
        style={{ background: buildAccentBackground(chipPalette.accent) }}
      />
      <div
        className="absolute inset-[0.42rem] rounded-full border border-white/20"
        style={{
          background: `linear-gradient(145deg, ${chipPalette.edgeTint} 0%, ${chipPalette.edgeBase} 55%, ${chipPalette.edgeShadow} 100%)`,
        }}
      />
      <div
        className="absolute inset-[0.9rem] rounded-full border text-ink shadow-[inset_0_2px_6px_rgba(17,33,23,0.12)]"
        style={{
          background: chipPalette.centerBackground,
          borderColor: chipPalette.centerBorder,
        }}
      >
        <div
          className="absolute inset-x-2 top-1 text-center text-[0.3rem] font-semibold uppercase tracking-[0.18em]"
          style={{ color: chipPalette.edgeText }}
        >
          Blackjack
        </div>
        <div
          className="absolute inset-x-2 bottom-1 text-center text-[0.3rem] font-semibold uppercase tracking-[0.18em]"
          style={{ color: chipPalette.edgeText }}
        >
          Trainer
        </div>
        <div className="flex h-full flex-col items-center justify-center">
          <span className="text-[0.38rem] font-semibold uppercase tracking-[0.18em] text-ink/60">
            Table Bet
          </span>
          <span
            className="mt-0.5 font-display text-base leading-none tablet:text-lg"
            style={{ color: chipPalette.valueColor }}
          >
            {amountLabel}
          </span>
          <span className="mt-0.5 text-[0.38rem] font-semibold uppercase tracking-[0.18em] text-ink/60">
            Basic Strategy
          </span>
        </div>
      </div>
    </div>
  );
}
