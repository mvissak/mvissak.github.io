"use client";

import type {
  TrainerViewOutcomeCallout,
  TrainerViewOutcomeTone,
} from "@/presentation/view-models/buildTrainerViewModel";

interface OutcomeCalloutProps {
  callout: TrainerViewOutcomeCallout;
  compact?: boolean;
}

const toneStyles: Record<
  TrainerViewOutcomeTone,
  {
    amount: string;
    container: string;
    detail: string;
    eyebrow: string;
    headline: string;
  }
> = {
  default: {
    amount: "text-gold",
    container: "table-panel px-4 py-3",
    detail: "text-ivory/80",
    eyebrow: "text-gold-muted",
    headline: "text-gold",
  },
  success: {
    amount: "text-success",
    container: "table-panel border-success/45 bg-success/10 px-4 py-3",
    detail: "text-ivory/85",
    eyebrow: "text-success/80",
    headline: "text-success",
  },
  danger: {
    amount: "text-danger",
    container: "table-panel border-danger/45 bg-danger/10 px-4 py-3",
    detail: "text-ivory/85",
    eyebrow: "text-danger/80",
    headline: "text-danger",
  },
  push: {
    amount: "text-gold",
    container: "table-panel border-gold/45 bg-gold.surface/55 px-4 py-3",
    detail: "text-ivory/85",
    eyebrow: "text-gold-muted",
    headline: "text-gold",
  },
  blackjack: {
    amount: "text-gold",
    container:
      "table-panel border-gold/60 bg-[linear-gradient(135deg,rgba(241,199,102,0.2),rgba(43,36,17,0.76))] px-4 py-3",
    detail: "text-ivory/90",
    eyebrow: "text-gold-muted",
    headline: "text-gold",
  },
};

export function OutcomeCallout({ callout, compact = false }: OutcomeCalloutProps) {
  const styles = toneStyles[callout.tone];

  return (
    <div className={styles.container}>
      {callout.eyebrow ? (
        <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.28em] ${styles.eyebrow}`}>
          {callout.eyebrow}
        </p>
      ) : null}
      <div
        className={`flex ${compact ? "flex-col gap-1" : "flex-col gap-2 tablet:flex-row tablet:items-end tablet:justify-between"}`}
      >
        <p
          className={`${compact ? "text-xl tracking-[0.18em]" : "text-2xl tracking-[0.22em] tablet:text-3xl"} font-display uppercase ${styles.headline}`}
        >
          {callout.headline}
        </p>
        {callout.amountLabel ? (
          <p
            className={`${compact ? "text-base" : "text-lg tablet:text-xl"} font-semibold ${styles.amount}`}
          >
            {callout.amountLabel}
          </p>
        ) : null}
      </div>
      {callout.detail ? <p className={`mt-2 text-sm ${styles.detail}`}>{callout.detail}</p> : null}
    </div>
  );
}
