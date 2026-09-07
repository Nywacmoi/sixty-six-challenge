// A short two-note launch chime, synthesized with the Web Audio API instead
// of a bundled sound file (no rights-free asset available). Web only;
// no-ops silently anywhere the API isn't available or autoplay is blocked
// (browsers require a prior user gesture on the origin before audio can
// play, so this may only be audible from the second launch onward).
export function playLaunchChime() {
  if (typeof window === 'undefined') return;
  const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, start: 0, dur: 0.18 },
      { freq: 784.0, start: 0.1, dur: 0.26 },
    ];

    notes.forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    });

    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // autoplay blocked or API unsupported — fail silently, no sound
  }
}
