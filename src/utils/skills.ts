import { Habit, HabitCompletion } from '../types';
import { getHabitCategories } from './habitCategories';
import { toSafeDateKey } from './date';

// The skill tree: five stats that grow with what you actually do.
//
// XP already existed, but it was one number — a level that said "you've
// ticked a lot" and nothing about what kind of person the ticking is
// building. Five skills turn the same check-ins into a character: someone
// who runs and reads looks different from someone who meditates and sleeps.
//
// Everything here is derived from habits and completions that are already
// stored — nothing new is saved. So the tree is correct on the first open
// (a day-75 user sees seventy-five days of history in it, not an empty
// chart), can't drift from the data, and comes back intact with a restore.

export type SkillId = 'discipline' | 'corps' | 'vitalite' | 'mental' | 'savoir';

export type SkillDef = { id: SkillId; label: string; icon: string; color: string };

// Order is the order round the radar, clockwise from the top. Discipline
// takes the top: it's the word the app is built on.
export const SKILLS: SkillDef[] = [
  { id: 'discipline', label: 'Discipline', icon: 'locate', color: '#FFC542' },
  { id: 'corps', label: 'Corps', icon: 'barbell', color: '#FF5A2E' },
  { id: 'vitalite', label: 'Vitalité', icon: 'water', color: '#2EC4B6' },
  { id: 'mental', label: 'Mental', icon: 'leaf', color: '#B15AFF' },
  { id: 'savoir', label: 'Savoir', icon: 'book', color: '#4E9BFF' },
];

// Every category habitCategories.ts knows, and the skill it trains.
const CATEGORY_SKILL: Record<string, SkillId> = {
  sport: 'corps',
  steps: 'corps',
  running: 'corps',
  jawline: 'corps',
  nutrition: 'vitalite',
  sleep: 'vitalite',
  meditation: 'mental',
  journaling: 'mental',
  reading: 'savoir',
  learning: 'savoir',
  podcast: 'savoir',
  screenTime: 'discipline',
  moneySaving: 'discipline',
  budget: 'discipline',
};

// Habits no category claims — "Boire de l'eau", "Douche froide",
// "Étirements", "Planifier sa journée" — placed by their icon.
const ICON_SKILL: Record<string, SkillId> = {
  water: 'vitalite',
  snow: 'vitalite',
  body: 'corps',
  flower: 'mental',
  'color-palette': 'savoir',
  'musical-notes': 'savoir',
  laptop: 'savoir',
  bulb: 'savoir',
  calendar: 'discipline',
  cash: 'discipline',
  locate: 'discipline',
  'partly-sunny': 'discipline',
};

/** A habit can train two skills ("Pas de téléphone au réveil" is both
 *  screen time and sleep); each gets the full point. Anything unplaced
 *  trains Discipline — keeping a promise to yourself always does. */
export function skillsForHabit(habit: Pick<Habit, 'name' | 'icon'>): SkillId[] {
  const fromCategories = [
    ...new Set(getHabitCategories(habit.name, habit.icon).map((c) => CATEGORY_SKILL[c]).filter(Boolean)),
  ];
  if (fromCategories.length) return fromCategories;
  return [ICON_SKILL[habit.icon] ?? 'discipline'];
}

// Points needed to reach a level, cumulative: 0, 5, 15, 30, 50, 75, 105…
// One habit a day in a skill reaches level 3 in two weeks and level 6 by
// day 75 — early levels come quickly, later ones have to be earned.
const threshold = (level: number) => (5 * (level - 1) * level) / 2;

export function levelFor(points: number) {
  let level = 1;
  while (points >= threshold(level + 1)) level++;
  const floor = threshold(level);
  const next = threshold(level + 1);
  return { level, progress: (points - floor) / (next - floor), toNext: next - points };
}

export function tierFor(level: number): string {
  if (level >= 10) return 'Légende';
  if (level >= 9) return 'Maître';
  if (level >= 7) return 'Expert';
  if (level >= 5) return 'Confirmé';
  if (level >= 3) return 'Apprenti';
  return 'Novice';
}

// A perfect day is worth this much Discipline on top of its habits. It's the
// one thing no single habit measures: that all of them held on the same day.
const PERFECT_DAY_BONUS = 2;

export type Skill = SkillDef & {
  points: number;
  level: number;
  progress: number;
  toNext: number;
  tier: string;
  /** Active habits that train it — what the person can do to raise it. */
  fedBy: string[];
};

export function computeSkills(habits: Habit[], completions: HabitCompletion[]): Skill[] {
  const byHabit = new Map(habits.map((h) => [h.id, skillsForHabit(h)]));
  const points: Record<SkillId, number> = { discipline: 0, corps: 0, vitalite: 0, mental: 0, savoir: 0 };

  const doneByDate = new Map<string, Set<string>>();
  for (const c of completions) {
    if (!c.completed) continue;
    // Completions of a deleted habit are orphans: nothing left to say what
    // they trained, so they don't count toward any skill.
    const skills = byHabit.get(c.habitId);
    if (!skills) continue;
    for (const s of skills) points[s] += 1;
    if (!doneByDate.has(c.date)) doneByDate.set(c.date, new Set());
    doneByDate.get(c.date)!.add(c.habitId);
  }

  // A day counts as perfect if every active habit that existed that day was
  // done — so adding a habit on day 40 doesn't retroactively spoil days 1–39.
  const active = habits.filter((h) => !h.archived);
  for (const [date, done] of doneByDate) {
    const due = active.filter((h) => toSafeDateKey(h.createdAt) <= date);
    if (due.length > 0 && due.every((h) => done.has(h.id))) points.discipline += PERFECT_DAY_BONUS;
  }

  return SKILLS.map((def) => {
    const { level, progress, toNext } = levelFor(points[def.id]);
    return {
      ...def,
      points: points[def.id],
      level,
      progress,
      toNext,
      tier: tierFor(level),
      fedBy: [
        ...active.filter((h) => skillsForHabit(h).includes(def.id)).map((h) => h.name),
        // Discipline always has this source, even with no habit of its own —
        // otherwise a level-4 Discipline would claim nothing trains it.
        ...(def.id === 'discipline' ? ['journées parfaites'] : []),
      ],
    };
  });
}
