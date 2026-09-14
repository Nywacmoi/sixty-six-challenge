// The day's colour is a continuous sweep rather than a handful of fixed
// states: hue walks from 205° (calm blue, nothing done yet) down to 133°
// (green, day complete), which crosses cyan and turquoise on the way and
// never lands on a muddy in-between. Saturation and lightness ease down
// slightly so the green reads as solid rather than neon.
//
// The point is that opening the app at 0% and at 100% should not look like
// the same screen with a different number on it.
const HUE_START = 205;
const HUE_END = 133;
const SAT_START = 100;
const SAT_END = 60;
const LIGHT_START = 67;
const LIGHT_END = 53;

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

export function progressColor(progress: number): string {
  const t = Math.max(0, Math.min(1, progress));
  const h = Math.round(lerp(HUE_START, HUE_END, t));
  const s = Math.round(lerp(SAT_START, SAT_END, t));
  const l = Math.round(lerp(LIGHT_START, LIGHT_END, t));
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Deliberately not "À la traîne" any more: at 0% the person hasn't failed
// at anything yet, they just haven't started — scolding them on open is the
// opposite of motivating.
export function progressStatusLabel(doneCount: number, totalCount: number): string {
  if (totalCount === 0 || doneCount === 0) return 'À commencer';
  if (doneCount >= totalCount) return 'Journée parfaite';
  const progress = doneCount / totalCount;
  if (progress < 0.4) return 'En route';
  if (progress < 0.75) return 'En cours';
  return 'Presque';
}
