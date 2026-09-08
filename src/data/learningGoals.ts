export type LearningGoal = {
  id: string;
  label: string;
  emoji: string;
  tip: string;
};

export const LEARNING_GOALS: LearningGoal[] = [
  {
    id: 'time15',
    label: '15 minutes',
    emoji: '⏱️',
    tip: 'Assez court pour ne jamais sauter, assez long pour vraiment progresser.',
  },
  {
    id: 'lesson',
    label: '1 leçon',
    emoji: '📘',
    tip: 'Termine la leçon en entier plutôt que de la commencer à moitié plusieurs fois.',
  },
  {
    id: 'vocab',
    label: '10 mots / notions',
    emoji: '🧠',
    tip: 'Note-les quelque part — la répétition espacée bat le par-cœur en une fois.',
  },
  {
    id: 'practice',
    label: 'Mise en pratique',
    emoji: '🛠️',
    tip: "Applique ce que tu apprends sur un vrai cas plutôt que de rester en théorie.",
  },
];
