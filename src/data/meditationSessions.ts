export type MeditationSession = {
  id: string;
  label: string;
  emoji: string;
  duration: string;
  steps: string[];
};

export const MEDITATION_SESSIONS: MeditationSession[] = [
  {
    id: 'breathing',
    label: 'Respiration 4-7-8',
    emoji: '🌬️',
    duration: '5 min',
    steps: [
      'Inspire calmement par le nez pendant 4 secondes',
      'Retiens ta respiration pendant 7 secondes',
      'Expire lentement par la bouche pendant 8 secondes',
      'Répète le cycle 4 à 6 fois',
    ],
  },
  {
    id: 'bodyscan',
    label: 'Scan corporel',
    emoji: '🧘',
    duration: '10 min',
    steps: [
      'Allonge-toi confortablement et ferme les yeux',
      'Porte ton attention sur tes pieds, relâche toute tension',
      'Remonte lentement à travers chaque partie du corps',
      'Termine par le visage et le haut du crâne',
    ],
  },
  {
    id: 'mindfulness',
    label: 'Pleine conscience',
    emoji: '🙏',
    duration: '10 min',
    steps: [
      'Assieds-toi le dos droit, les yeux fermés',
      'Observe ta respiration sans chercher à la contrôler',
      'Quand ton esprit divague, reviens doucement au souffle',
      'Termine en rouvrant les yeux lentement',
    ],
  },
  {
    id: 'visualization',
    label: 'Visualisation positive',
    emoji: '✨',
    duration: '5 min',
    steps: [
      'Ferme les yeux et respire calmement',
      'Imagine un lieu où tu te sens pleinement en paix',
      'Ajoute des détails : sons, odeurs, sensations',
      'Reste dans cette image pendant quelques minutes',
    ],
  },
];
