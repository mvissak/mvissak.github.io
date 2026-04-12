type WindowWithWebkitAudioContext = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export const playDrinkPourSound = () => {
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
    const masterGain = context.createGain();
    const filter = context.createBiquadFilter();

    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1_050, context.currentTime);
    filter.Q.setValueAtTime(0.9, context.currentTime);

    masterGain.connect(filter);
    filter.connect(context.destination);
    masterGain.gain.setValueAtTime(0.0001, context.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.06, context.currentTime + 0.04);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 1.05);

    const shimmer = context.createOscillator();
    const shimmerGain = context.createGain();

    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(720, context.currentTime);
    shimmer.frequency.exponentialRampToValueAtTime(440, context.currentTime + 0.8);
    shimmerGain.gain.setValueAtTime(0.0001, context.currentTime);
    shimmerGain.gain.exponentialRampToValueAtTime(0.025, context.currentTime + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.9);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(masterGain);
    shimmer.start(context.currentTime);
    shimmer.stop(context.currentTime + 0.95);

    const fizz = context.createBufferSource();
    const fizzGain = context.createGain();
    const buffer = context.createBuffer(1, context.sampleRate * 0.9, context.sampleRate);
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < channel.length; index += 1) {
      const progress = index / channel.length;
      const fade = 1 - progress;
      channel[index] = (Math.random() * 2 - 1) * fade * 0.18;
    }

    fizz.buffer = buffer;
    fizzGain.gain.setValueAtTime(0.0001, context.currentTime);
    fizzGain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.03);
    fizzGain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.85);
    fizz.connect(fizzGain);
    fizzGain.connect(masterGain);
    fizz.start(context.currentTime);
    fizz.stop(context.currentTime + 0.9);

    window.setTimeout(() => {
      void context.close().catch(() => undefined);
    }, 1_300);
  } catch {
    // Audio playback is best-effort and may be blocked by the browser.
  }
};
