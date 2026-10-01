import type { Habit } from '../types';
import { addDays, toSafeDateKey } from './date';

// "Tes tendances": what the person's own history says about them. Nothing
// here is a guess — every sentence the app shows is one of these numbers,
// and each one waits until there's enough data behind it to mean something.
// Two Sundays aren't a pattern; a 3-point gap between Monday and Tuesday is
// noise. Below those thresholds the section says how long until it knows,
// instead of dressing noise up as insight.
//
// Only finished days count. Today is still being played, and counting it
// would make every evening look like the person's worst day of the week.

export const WEEKDAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

// Twelve weeks: enough Sundays to average, recent enough that last
// spring's habits don't speak for this autumn's.
const WINDOW_DAYS = 84;
const MIN_PER_WEEKDAY = 2;
const MIN_PER_GROUP = 3;
// Below this a "best" and "worst" day are the same day with noise on top.
const MEANINGFUL_GAP = 0.1;
const SLIP_GAP = 0.25;
const MIN_WEEKEND_DAYS = 4;
const MIN_WEEK_DAYS = 8;

export type Level = { date: string; value: number };

export type TrendsInput = {
  habits: Habit[];
  isDone: (habitId: string, date: string) => boolean;
  startDate: string;
  today: string;
  sleep: Level[];
  mood: Level[];
};

export type WeekdayTrend = {
  // Monday first, null for a weekday with no finished day yet.
  rates: (number | null)[];
  samples: number[];
  ready: boolean;
  // Days until every weekday has been lived often enough to compare.
  daysToReady: number;
  best: number | null;
  worst: number | null;
};

export type Comparison = {
  ready: boolean;
  good: number | null;
  low: number | null;
  goodDays: number;
  lowDays: number;
};

export type WeekendSlip = { habit: Habit; week: number; weekend: number };

export type Trends = {
  days: number;
  weekdays: WeekdayTrend;
  sleep: Comparison;
  mood: Comparison;
  slip: WeekendSlip | null;
};

// Monday = 0. From the date's own digits, not a local Date, so a timezone
// can't move a day into its neighbour.
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

export function computeTrends({ habits, isDone, startDate, today, sleep, mood }: TrendsInput): Trends {
  const active = habits.filter((h) => !h.archived);
  const first = [toSafeDateKey(startDate), addDays(today, -WINDOW_DAYS)].sort()[1];

  // Each finished day's share of the habits that existed that day. A habit
  // added on day 30 doesn't drag days 1 to 29 down for not being done.
  const ratio = new Map<string, number>();
  for (let date = first; date < today; date = addDays(date, 1)) {
    const live = active.filter((h) => toSafeDateKey(h.createdAt) <= date);
    if (live.length === 0) continue;
    ratio.set(date, live.filter((h) => isDone(h.id, date)).length / live.length);
  }

  const byWeekday: number[][] = WEEKDAYS.map(() => []);
  ratio.forEach((r, date) => byWeekday[weekdayOf(date)].push(r));
  const rates = byWeekday.map(mean);
  const ready = byWeekday.every((xs) => xs.length >= MIN_PER_WEEKDAY);

  // Walk forward from today — it becomes a finished day tomorrow — until
  // every weekday has its quota. Exact even when the history has holes.
  const counts = byWeekday.map((xs) => xs.length);
  let daysToReady = 0;
  for (let date = today; counts.some((c) => c < MIN_PER_WEEKDAY); date = addDays(date, 1)) {
    counts[weekdayOf(date)]++;
    daysToReady++;
  }

  let best: number | null = null;
  let worst: number | null = null;
  if (ready) {
    const r = rates as number[];
    const hi = r.indexOf(Math.max(...r));
    const lo = r.indexOf(Math.min(...r));
    if (r[hi] - r[lo] >= MEANINGFUL_GAP) {
      best = hi;
      worst = lo;
    }
  }

  // The morning's answer against that same day: "Bien dormi" is about the
  // night before the day it was given on. 3–4 on the scale is a good
  // morning, 1–2 a rough one.
  const compare = (levels: Level[]): Comparison => {
    const good: number[] = [];
    const low: number[] = [];
    for (const { date, value } of levels) {
      const r = ratio.get(date);
      if (r == null) continue;
      (value >= 3 ? good : low).push(r);
    }
    return {
      ready: good.length >= MIN_PER_GROUP && low.length >= MIN_PER_GROUP,
      good: mean(good),
      low: mean(low),
      goodDays: good.length,
      lowDays: low.length,
    };
  };

  // The habit the week holds and the weekend drops — but only one the
  // person actually does on weekdays; something done 20% of the time
  // doesn't "slip" at the weekend, it just isn't happening yet.
  let slip: WeekendSlip | null = null;
  for (const h of active) {
    const week: number[] = [];
    const weekend: number[] = [];
    ratio.forEach((_, date) => {
      if (toSafeDateKey(h.createdAt) > date) return;
      (weekdayOf(date) >= 5 ? weekend : week).push(isDone(h.id, date) ? 1 : 0);
    });
    if (week.length < MIN_WEEK_DAYS || weekend.length < MIN_WEEKEND_DAYS) continue;
    const w = mean(week)!;
    const we = mean(weekend)!;
    if (w >= 0.5 && w - we >= SLIP_GAP && (!slip || w - we > slip.week - slip.weekend)) {
      slip = { habit: h, week: w, weekend: we };
    }
  }

  return {
    days: ratio.size,
    weekdays: { rates, samples: byWeekday.map((xs) => xs.length), ready, daysToReady, best, worst },
    sleep: compare(sleep),
    mood: compare(mood),
    slip,
  };
}

// The epsilon keeps 0.375 from rounding to 37 in one place and 38 in another.
export const pct = (x: number) => `${Math.round(x * 100 + 1e-9)}%`;

// What the morning check-in can say with this, once it knows how the night
// went: the rough-night number when that's what this morning is, otherwise
// the hard-weekday number when today is that day. Nothing when the history
// doesn't support either — the check-in already has plenty to say.
export function checkInNudge(trends: Trends, sleepLevel: number | null, today: string): string | null {
  const { sleep, weekdays } = trends;
  if (sleepLevel != null && sleepLevel <= 2 && sleep.ready && sleep.good! - sleep.low! >= MEANINGFUL_GAP) {
    return `Après une nuit comme ça, tu tiens en moyenne ${pct(sleep.low!)} de tes habitudes — vise l’essentiel.`;
  }
  if (weekdays.worst != null && weekdayOf(today) === weekdays.worst) {
    return `Le ${WEEKDAYS[weekdays.worst]}, c’est ton jour le plus dur (${pct(weekdays.rates[weekdays.worst]!)} en moyenne). On le gagne aujourd’hui.`;
  }
  return null;
}
