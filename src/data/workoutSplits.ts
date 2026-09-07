export type WorkoutSplit = {
  id: string;
  label: string;
  emoji: string;
  exercises: string[];
};

export const WORKOUT_SPLITS: WorkoutSplit[] = [
  {
    id: 'push',
    label: 'Pectoraux / Épaules / Triceps',
    emoji: '💪',
    exercises: [
      'Développé couché — 4x8-10',
      'Développé militaire — 3x10',
      'Écarté haltères — 3x12',
      'Dips ou pompes lestées — 3x max',
      'Extension triceps à la poulie — 3x12',
    ],
  },
  {
    id: 'pull',
    label: 'Dos / Biceps',
    emoji: '🏋️',
    exercises: [
      'Tractions ou tirage vertical — 4x8',
      'Rowing barre — 4x10',
      'Tirage horizontal — 3x12',
      'Curl biceps haltères — 3x12',
      'Face pull — 3x15',
    ],
  },
  {
    id: 'legs',
    label: 'Jambes',
    emoji: '🦵',
    exercises: [
      'Squat — 4x8-10',
      'Presse à cuisses — 3x12',
      'Fentes marchées — 3x12 par jambe',
      'Leg curl — 3x12',
      'Mollets debout — 4x15',
    ],
  },
  {
    id: 'shoulders',
    label: 'Épaules',
    emoji: '🎯',
    exercises: [
      'Développé militaire — 4x8',
      'Élévations latérales — 4x12',
      'Élévations arrière — 3x15',
      'Shrugs haltères — 3x12',
    ],
  },
  {
    id: 'abs',
    label: 'Abdos / Gainage',
    emoji: '🔥',
    exercises: [
      'Planche — 3x45s',
      'Crunchs — 3x20',
      'Relevé de jambes — 3x15',
      'Gainage latéral — 3x30s par côté',
    ],
  },
  {
    id: 'cardio',
    label: 'Cardio',
    emoji: '🏃',
    exercises: [
      '20-30 min course à intensité modérée',
      'ou 15 min HIIT (30s effort / 30s repos)',
      'ou vélo / rameur 25 min',
    ],
  },
  {
    id: 'fullbody',
    label: 'Full Body',
    emoji: '⚡',
    exercises: [
      'Squat — 3x10',
      'Développé couché ou pompes — 3x10',
      'Rowing — 3x10',
      'Gainage — 3x30s',
    ],
  },
];
