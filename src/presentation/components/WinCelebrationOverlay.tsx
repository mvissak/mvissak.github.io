"use client";

import type { CSSProperties } from "react";
import { useEffect } from "react";

interface WinCelebrationOverlayProps {
  active: boolean;
}

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

type WindowWithWebkitAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

const playWinChime = () => {
  if (typeof window === "undefined") {
    return;
  }

  const audioContextConstructor =
    window.AudioContext ?? (window as WindowWithWebkitAudioContext).webkitAudioContext;

  if (!audioContextConstructor) {
    return;
  }

  try {
    const context = new audioContextConstructor();
    const gainNode = context.createGain();

    gainNode.connect(context.destination);
    gainNode.gain.setValueAtTime(0.0001, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.4);

    const notes = [
      { frequency: 783.99, start: 0, type: "triangle" as OscillatorType },
      { frequency: 987.77, start: 0.12, type: "sine" as OscillatorType },
      { frequency: 1174.66, start: 0.24, type: "triangle" as OscillatorType },
    ];

    notes.forEach((note) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();

      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, context.currentTime + note.start);
      noteGain.gain.setValueAtTime(0.0001, context.currentTime + note.start);
      noteGain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + note.start + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + note.start + 0.75);

      oscillator.connect(noteGain);
      noteGain.connect(gainNode);
      oscillator.start(context.currentTime + note.start);
      oscillator.stop(context.currentTime + note.start + 0.8);
    });

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 1_600);
  } catch {
    // Audio playback is best-effort and may be blocked by the browser.
  }
};

export function WinCelebrationOverlay({ active }: WinCelebrationOverlayProps) {
  useEffect(() => {
    if (!active) {
      return;
    }

    playWinChime();
  }, [active]);

  if (!active) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      data-testid="win-celebration"
    >
      {confettiPieces.map((piece, index) => (
        <div
          key={`${piece.leftPercent}-${piece.delayMs}-${index}`}
          className={`absolute -top-12 rounded-sm opacity-90 ${piece.colorClassName} ${piece.sizeClassName}`}
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
