"use client";

import { getControlButtonClassName } from "@/presentation/components/ControlButton";

interface NextHandCountdownButtonProps {
  countdownProgressPercent: number;
  isEnabled: boolean;
  onClick: () => void;
  secondsRemaining: number;
}

export function NextHandCountdownButton({
  countdownProgressPercent,
  isEnabled,
  onClick,
  secondsRemaining,
}: NextHandCountdownButtonProps) {
  const progressPercent = Math.max(0, Math.min(100, countdownProgressPercent));
  const label = isEnabled ? `Next Hand (${secondsRemaining}s)` : "Next Hand";

  return (
    <button
      className={getControlButtonClassName(
        "secondary",
        "relative overflow-hidden isolate min-w-[10.5rem]",
      )}
      disabled={!isEnabled}
      onClick={onClick}
      type="button"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 rounded-pill bg-gold/20 transition-[width] duration-100 ease-linear"
        style={{ width: `${progressPercent}%` }}
      />
      <span className="relative z-10">{label}</span>
    </button>
  );
}
