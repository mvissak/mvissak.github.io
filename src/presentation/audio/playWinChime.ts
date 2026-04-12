type WindowWithWebkitAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export const playWinChime = () => {
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
