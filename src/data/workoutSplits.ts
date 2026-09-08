import { MovementPattern } from '../components/ExerciseAnimation';

export type Exercise = { name: string; reps: string; pattern: MovementPattern; alt?: string };

export type WorkoutSplit = {
  id: string;
  label: string;
  emoji: string;
  exercises: Exercise[];
};

export type WeeklySchedule = {
  id: string;
  label: string;
  level: string;
  days: { day: string; splitId: string | null }[];
};

export const WORKOUT_SPLITS: WorkoutSplit[] = [
  {
    id: 'push',
    label: 'Pectoraux / Épaules / Triceps',
    emoji: '💪',
    exercises: [
      { name: 'Développé couché', reps: '4x8-10', pattern: 'push', alt: 'Trop dur ? Développé incliné haltères, charge plus légère' },
      { name: 'Développé militaire', reps: '3x10', pattern: 'push', alt: 'Trop dur ? Développé assis avec dossier' },
      { name: 'Écarté haltères', reps: '3x12', pattern: 'raise' },
      { name: 'Dips ou pompes lestées', reps: '3x max', pattern: 'push', alt: 'Trop dur ? Pompes classiques ou sur genoux' },
      { name: 'Extension triceps à la poulie', reps: '3x12', pattern: 'push' },
      { name: 'Pompes diamant', reps: '3x max', pattern: 'push', alt: 'Trop dur ? Pompes diamant sur genoux' },
    ],
  },
  {
    id: 'pull',
    label: 'Dos / Biceps',
    emoji: '🏋️',
    exercises: [
      { name: 'Tractions ou tirage vertical', reps: '4x8', pattern: 'pull', alt: 'Trop dur ? Tractions assistées (élastique) ou tirage vertical machine' },
      { name: 'Rowing barre', reps: '4x10', pattern: 'pull' },
      { name: 'Tirage horizontal', reps: '3x12', pattern: 'pull' },
      { name: 'Curl biceps haltères', reps: '3x12', pattern: 'curl' },
      { name: 'Face pull', reps: '3x15', pattern: 'pull' },
      { name: 'Curl marteau', reps: '3x12', pattern: 'curl' },
    ],
  },
  {
    id: 'legs',
    label: 'Jambes',
    emoji: '🦵',
    exercises: [
      { name: 'Squat', reps: '4x8-10', pattern: 'squat', alt: 'Trop dur ? Squat au poids du corps ou goblet squat' },
      { name: 'Presse à cuisses', reps: '3x12', pattern: 'squat' },
      { name: 'Fentes marchées', reps: '3x12 par jambe', pattern: 'squat' },
      { name: 'Soulevé de terre roumain', reps: '3x10', pattern: 'squat', alt: 'Trop dur ? Avec haltères légers, dos bien droit' },
      { name: 'Leg curl', reps: '3x12', pattern: 'curl' },
      { name: 'Mollets debout', reps: '4x15', pattern: 'raise' },
    ],
  },
  {
    id: 'shoulders',
    label: 'Épaules',
    emoji: '🎯',
    exercises: [
      { name: 'Développé militaire', reps: '4x8', pattern: 'push' },
      { name: 'Élévations latérales', reps: '4x12', pattern: 'raise' },
      { name: 'Élévations arrière', reps: '3x15', pattern: 'raise' },
      { name: 'Shrugs haltères', reps: '3x12', pattern: 'raise' },
      { name: 'Oiseau (rear delt fly)', reps: '3x15', pattern: 'raise' },
    ],
  },
  {
    id: 'abs',
    label: 'Abdos / Gainage',
    emoji: '🔥',
    exercises: [
      { name: 'Planche', reps: '3x45s', pattern: 'hold', alt: 'Trop dur ? Planche sur les genoux' },
      { name: 'Crunchs', reps: '3x20', pattern: 'crunch' },
      { name: 'Relevé de jambes', reps: '3x15', pattern: 'crunch', alt: 'Trop dur ? Genoux repliés au lieu de jambes tendues' },
      { name: 'Gainage latéral', reps: '3x30s par côté', pattern: 'hold' },
      { name: 'Russian twist', reps: '3x20', pattern: 'crunch' },
    ],
  },
  {
    id: 'cardio',
    label: 'Cardio',
    emoji: '🏃',
    exercises: [
      { name: 'Course à intensité modérée', reps: '20-30 min', pattern: 'run' },
      { name: 'HIIT (30s effort / 30s repos)', reps: '15 min', pattern: 'run', alt: 'Trop dur ? 20s effort / 40s repos' },
      { name: 'Vélo ou rameur', reps: '25 min', pattern: 'run' },
      { name: 'Corde à sauter', reps: '3x3 min', pattern: 'run' },
    ],
  },
  {
    id: 'fullbody',
    label: 'Full Body',
    emoji: '⚡',
    exercises: [
      { name: 'Squat', reps: '3x10', pattern: 'squat' },
      { name: 'Développé couché ou pompes', reps: '3x10', pattern: 'push' },
      { name: 'Rowing', reps: '3x10', pattern: 'pull' },
      { name: 'Soulevé de terre', reps: '3x8', pattern: 'squat', alt: 'Trop dur ? Soulevé de terre jambes tendues, charge légère' },
      { name: 'Gainage', reps: '3x30s', pattern: 'hold' },
    ],
  },
];

// A small rotating pool per split — one is added to the day's session as a
// "bonus exercice du jour" (see dailyIndex in utils/date.ts) so the same
// split doesn't feel like the exact same session every time it comes
// around, without touching the core proven exercise list above.
export const BONUS_EXERCISES: Record<string, Exercise[]> = {
  push: [
    { name: 'Écarté à la poulie', reps: '3x15', pattern: 'raise' },
    { name: 'Pompes surélevées (pieds hauts)', reps: '3x max', pattern: 'push' },
  ],
  pull: [
    { name: 'Tirage nuque', reps: '3x12', pattern: 'pull' },
    { name: 'Rowing unilatéral haltère', reps: '3x10 par bras', pattern: 'pull' },
  ],
  legs: [
    { name: 'Fentes bulgares', reps: '3x10 par jambe', pattern: 'squat' },
    { name: 'Hip thrust', reps: '3x12', pattern: 'squat' },
  ],
  shoulders: [
    { name: 'Élévations frontales', reps: '3x12', pattern: 'raise' },
    { name: 'Arnold press', reps: '3x10', pattern: 'push' },
  ],
  abs: [
    { name: 'Mountain climbers', reps: '3x30s', pattern: 'crunch' },
    { name: 'Vélo (crunch croisé)', reps: '3x20', pattern: 'crunch' },
  ],
  cardio: [
    { name: 'Burpees', reps: '3x10', pattern: 'run' },
    { name: 'Jumping jacks', reps: '3x1 min', pattern: 'run' },
  ],
  fullbody: [
    { name: 'Kettlebell swing', reps: '3x15', pattern: 'squat' },
    { name: 'Thrusters', reps: '3x10', pattern: 'squat' },
  ],
};

// A structured weekly split, not just a flat exercise list — pick a level
// and it tells you which split to train each day of the week.
export const WEEKLY_SCHEDULES: WeeklySchedule[] = [
  {
    id: 'beginner',
    label: 'Débutant',
    level: '3 séances / semaine',
    days: [
      { day: 'Lundi', splitId: 'fullbody' },
      { day: 'Mardi', splitId: null },
      { day: 'Mercredi', splitId: 'fullbody' },
      { day: 'Jeudi', splitId: null },
      { day: 'Vendredi', splitId: 'fullbody' },
      { day: 'Samedi', splitId: 'cardio' },
      { day: 'Dimanche', splitId: null },
    ],
  },
  {
    id: 'intermediate',
    label: 'Intermédiaire',
    level: '4 séances / semaine',
    days: [
      { day: 'Lundi', splitId: 'push' },
      { day: 'Mardi', splitId: 'pull' },
      { day: 'Mercredi', splitId: null },
      { day: 'Jeudi', splitId: 'legs' },
      { day: 'Vendredi', splitId: 'shoulders' },
      { day: 'Samedi', splitId: 'abs' },
      { day: 'Dimanche', splitId: null },
    ],
  },
  {
    id: 'advanced',
    label: 'Avancé',
    level: '5-6 séances / semaine',
    days: [
      { day: 'Lundi', splitId: 'push' },
      { day: 'Mardi', splitId: 'pull' },
      { day: 'Mercredi', splitId: 'legs' },
      { day: 'Jeudi', splitId: 'shoulders' },
      { day: 'Vendredi', splitId: 'pull' },
      { day: 'Samedi', splitId: 'legs' },
      { day: 'Dimanche', splitId: 'abs' },
    ],
  },
];

export type SportGoal = 'muscle' | 'weightloss' | 'endurance' | 'general';
export type SportLevel = 'beginner' | 'intermediate' | 'advanced';

export const SPORT_GOALS: { id: SportGoal; label: string; emoji: string }[] = [
  { id: 'muscle', label: 'Prise de muscle', emoji: '💪' },
  { id: 'weightloss', label: 'Perte de poids', emoji: '🔥' },
  { id: 'endurance', label: 'Endurance', emoji: '🏃' },
  { id: 'general', label: 'Forme générale', emoji: '⚡' },
];

export const SPORT_LEVELS: { id: SportLevel; label: string }[] = [
  { id: 'beginner', label: 'Débutant' },
  { id: 'intermediate', label: 'Intermédiaire' },
  { id: 'advanced', label: 'Avancé' },
];

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// Builds a real weekly schedule from a person's actual answers (goal,
// level, days available) instead of one fixed generic plan — the splits
// themselves are the same building blocks as the preset schedules, just
// picked and ordered to match what was asked for.
export function buildPersonalSchedule(goal: SportGoal, level: SportLevel, daysPerWeek: number): WeeklySchedule {
  const cycles: Record<SportGoal, Record<number, (string | null)[]>> = {
    muscle: {
      2: ['fullbody', 'fullbody'],
      3: ['fullbody', 'fullbody', 'fullbody'],
      4: ['push', 'pull', 'legs', 'shoulders'],
      5: ['push', 'pull', 'legs', 'push', 'pull'],
      6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    },
    weightloss: {
      2: ['fullbody', 'cardio'],
      3: ['fullbody', 'cardio', 'fullbody'],
      4: ['fullbody', 'cardio', 'fullbody', 'cardio'],
      5: ['fullbody', 'cardio', 'fullbody', 'cardio', 'abs'],
      6: ['fullbody', 'cardio', 'fullbody', 'cardio', 'abs', 'cardio'],
    },
    endurance: {
      2: ['cardio', 'cardio'],
      3: ['cardio', 'fullbody', 'cardio'],
      4: ['cardio', 'cardio', 'fullbody', 'cardio'],
      5: ['cardio', 'fullbody', 'cardio', 'cardio', 'abs'],
      6: ['cardio', 'fullbody', 'cardio', 'cardio', 'abs', 'cardio'],
    },
    general: {
      2: ['fullbody', 'fullbody'],
      3: ['fullbody', 'fullbody', 'fullbody'],
      4: ['push', 'pull', 'legs', 'fullbody'],
      5: ['push', 'pull', 'legs', 'cardio', 'abs'],
      6: ['push', 'pull', 'legs', 'shoulders', 'cardio', 'abs'],
    },
  };

  const clampedDays = Math.min(6, Math.max(2, daysPerWeek));
  const cycle = cycles[goal][clampedDays];

  // Spread the active days evenly across the week (e.g. 3/week -> Mon/Wed/Fri)
  const spacing = 7 / clampedDays;
  const activeDayIndexes = new Set(Array.from({ length: clampedDays }, (_, i) => Math.round(i * spacing)));

  let cycleIndex = 0;
  const days = DAY_NAMES.map((day, i) => {
    if (!activeDayIndexes.has(i)) return { day, splitId: null };
    const splitId = cycle[cycleIndex % cycle.length];
    cycleIndex += 1;
    return { day, splitId };
  });

  const goalLabel = SPORT_GOALS.find((g) => g.id === goal)?.label ?? '';
  const levelLabel = SPORT_LEVELS.find((l) => l.id === level)?.label ?? '';

  return {
    id: 'personal',
    label: 'Mon programme',
    level: `${goalLabel} · ${levelLabel} · ${clampedDays}j/semaine`,
    days,
  };
}
