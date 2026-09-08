export type ReadingGoal = {
  id: string;
  label: string;
  emoji: string;
  tip: string;
};

export const READING_GOALS: ReadingGoal[] = [
  {
    id: 'time10',
    label: '10 minutes',
    emoji: 'timer',
    tip: 'Idéal pour créer le réflexe sans te mettre la pression.',
  },
  {
    id: 'pages20',
    label: '20 pages',
    emoji: 'document',
    tip: 'Un objectif concret qui fait avancer un roman rapidement.',
  },
  {
    id: 'chapter',
    label: '1 chapitre',
    emoji: 'bookmark',
    tip: "Termine sur une vraie pause dans l'histoire, plus facile à reprendre le lendemain.",
  },
  {
    id: 'deep',
    label: 'Lecture active',
    emoji: 'pencil',
    tip: 'Note une idée ou une citation qui te marque avant de refermer le livre.',
  },
];
