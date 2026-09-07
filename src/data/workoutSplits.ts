import { MovementPattern } from '../components/ExerciseAnimation';

export type Exercise = { name: string; reps: string; pattern: MovementPattern };

export type WorkoutSplit = {
  id: string;
  label: string;
  emoji: string;
  exercises: Exercise[];
};

export const WORKOUT_SPLITS: WorkoutSplit[] = [
  {
    id: 'push',
    label: 'Pectoraux / Épaules / Triceps',
    emoji: '💪',
    exercises: [
      { name: 'Développé couché', reps: '4x8-10', pattern: 'push' },
      { name: 'Développé militaire', reps: '3x10', pattern: 'push' },
      { name: 'Écarté haltères', reps: '3x12', pattern: 'raise' },
      { name: 'Dips ou pompes lestées', reps: '3x max', pattern: 'push' },
      { name: 'Extension triceps à la poulie', reps: '3x12', pattern: 'push' },
    ],
  },
  {
    id: 'pull',
    label: 'Dos / Biceps',
    emoji: '🏋️',
    exercises: [
      { name: 'Tractions ou tirage vertical', reps: '4x8', pattern: 'pull' },
      { name: 'Rowing barre', reps: '4x10', pattern: 'pull' },
      { name: 'Tirage horizontal', reps: '3x12', pattern: 'pull' },
      { name: 'Curl biceps haltères', reps: '3x12', pattern: 'curl' },
      { name: 'Face pull', reps: '3x15', pattern: 'pull' },
    ],
  },
  {
    id: 'legs',
    label: 'Jambes',
    emoji: '🦵',
    exercises: [
      { name: 'Squat', reps: '4x8-10', pattern: 'squat' },
      { name: 'Presse à cuisses', reps: '3x12', pattern: 'squat' },
      { name: 'Fentes marchées', reps: '3x12 par jambe', pattern: 'squat' },
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
    ],
  },
  {
    id: 'abs',
    label: 'Abdos / Gainage',
    emoji: '🔥',
    exercises: [
      { name: 'Planche', reps: '3x45s', pattern: 'hold' },
      { name: 'Crunchs', reps: '3x20', pattern: 'crunch' },
      { name: 'Relevé de jambes', reps: '3x15', pattern: 'crunch' },
      { name: 'Gainage latéral', reps: '3x30s par côté', pattern: 'hold' },
    ],
  },
  {
    id: 'cardio',
    label: 'Cardio',
    emoji: '🏃',
    exercises: [
      { name: 'Course à intensité modérée', reps: '20-30 min', pattern: 'run' },
      { name: 'HIIT (30s effort / 30s repos)', reps: '15 min', pattern: 'run' },
      { name: 'Vélo ou rameur', reps: '25 min', pattern: 'run' },
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
      { name: 'Gainage', reps: '3x30s', pattern: 'hold' },
    ],
  },
];
