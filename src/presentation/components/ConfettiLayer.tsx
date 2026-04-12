"use client";

import type { CSSProperties } from "react";

const confettiColors = [
  "bg-gold",
  "bg-gold-strong",
  "bg-success",
  "bg-ivory",
  "bg-gold-muted",
] as const;

const confettiPieces = Array.from({ length: 26 }, (_, index) => ({
  colorClassName: confettiColors[index % confettiColors.length],
  delayMs: (index % 6) * 80,
  driftPx: -80 + ((index * 19) % 160),
  leftPercent: 4 + ((index * 11) % 92),
  rotateDeg: 160 + ((index * 37) % 300),
  sizeClassName: index % 3 === 0 ? "h-4 w-2.5" : index % 3 === 1 ? "h-3 w-3" : "h-5 w-2",
}));

export function ConfettiLayer() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden"
      data-testid="victory-confetti"
    >
      {confettiPieces.map((piece, index) => (
        <span
          key={`${piece.leftPercent}-${piece.delayMs}-${index}`}
          className={`absolute -top-12 block rounded-sm opacity-90 ${piece.colorClassName} ${piece.sizeClassName}`}
          style={{
            "--confetti-drift": `${piece.driftPx}px`,
            animationDelay: `${piece.delayMs}ms`,
            animationDuration: "3000ms",
            animationFillMode: "forwards",
            animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
            animationName: "confetti-fall",
            left: `${piece.leftPercent}%`,
            transform: `rotate(${piece.rotateDeg}deg)`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}
