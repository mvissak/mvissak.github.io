type WindowWithWebkitAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export const playDisappointedSound = () => {
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
    gainNode.gain.exponentialRampToValueAtTime(0.09, context.currentTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.8);

    const notes = [
      { frequency: 392, start: 0, duration: 0.5, type: "triangle" as OscillatorType },
      { frequency: 329.63, start: 0.22, duration: 0.55, type: "sawtooth" as OscillatorType },
      { frequency: 261.63, start: 0.48, duration: 0.9, type: "triangle" as OscillatorType },
    ];

    notes.forEach((note) => {
      const oscillator = context.createOscillator();
      const noteGain = context.createGain();

      oscillator.type = note.type;
      oscillator.frequency.setValueAtTime(note.frequency, context.currentTime + note.start);
      noteGain.gain.setValueAtTime(0.0001, context.currentTime + note.start);
      noteGain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + note.start + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + note.start + note.duration,
      );

      oscillator.connect(noteGain);
      noteGain.connect(gainNode);
      oscillator.start(context.currentTime + note.start);
      oscillator.stop(context.currentTime + note.start + note.duration + 0.05);
    });

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 2_000);
  } catch {
    // Audio playback is best-effort and may be blocked by the browser.
  }
};
