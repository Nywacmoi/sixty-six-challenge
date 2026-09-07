export type JawlineExercise = { name: string; reps: string; tip: string };
export type JawlineSession = { id: string; label: string; emoji: string; exercises: JawlineExercise[] };

export const JAWLINE_SESSIONS: JawlineSession[] = [
  {
    id: 'mewing',
    label: 'Mewing & posture',
    emoji: '👅',
    exercises: [
      {
        name: 'Posture linguale (mewing)',
        reps: 'Toute la journée',
        tip: 'Langue entièrement collée au palais, dents légèrement en contact, lèvres fermées, sans forcer.',
      },
      {
        name: 'Déglutition correcte',
        reps: 'À chaque fois',
        tip: 'Avale en gardant la langue au palais, sans contracter le menton ni les lèvres.',
      },
      {
        name: 'Respiration nasale',
        reps: 'En continu',
        tip: 'Respire par le nez plutôt que par la bouche pour soutenir la posture linguale.',
      },
    ],
  },
  {
    id: 'strength',
    label: 'Renforcement mâchoire',
    emoji: '💪',
    exercises: [
      {
        name: 'Jaw clench (serrage mâchoire)',
        reps: '3x20',
        tip: 'Serre les mâchoires 2 secondes en gardant la posture linguale, puis relâche.',
      },
      {
        name: 'Mastication (chewing gum sans sucre)',
        reps: '10-15 min',
        tip: 'Mâche des deux côtés en alternance pour ne pas déséquilibrer le visage.',
      },
      {
        name: 'Chin lifts',
        reps: '3x15',
        tip: 'Tête basculée en arrière, pousse le menton et les lèvres vers le plafond.',
      },
    ],
  },
  {
    id: 'neck',
    label: 'Cou & fermeté',
    emoji: '🦢',
    exercises: [
      {
        name: 'Neck curl-up',
        reps: '3x12',
        tip: 'Allongé sur le dos, lève la tête vers la poitrine en gardant les épaules au sol.',
      },
      {
        name: 'Étirement du platysma',
        reps: '3x20s',
        tip: 'Tire les commissures des lèvres vers le bas, tête légèrement en arrière, maintiens la tension.',
      },
      {
        name: 'Rotation lente du cou',
        reps: '2x10 tours',
        tip: "Fais tourner doucement la tête pour relâcher les tensions et soutenir la posture.",
      },
    ],
  },
];
