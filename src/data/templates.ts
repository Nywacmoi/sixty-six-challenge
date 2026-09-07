export type RoutineTemplateHabit = { name: string; icon: string; color: string };

export type RoutineTemplate = {
  id: string;
  title: string;
  emoji: string;
  description: string;
  habits: RoutineTemplateHabit[];
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: 'morning',
    title: 'Routine matinale',
    emoji: '🌅',
    description: 'Bien démarrer chaque journée',
    habits: [
      { name: "Boire un verre d'eau", icon: '💧', color: '#4E9BFF' },
      { name: 'Étirements', icon: '🧘', color: '#3ECF5B' },
      { name: 'Pas de téléphone au réveil', icon: '📵', color: '#FF4D8D' },
    ],
  },
  {
    id: 'sport',
    title: 'Routine sportive',
    emoji: '💪',
    description: 'Bouger tous les jours',
    habits: [
      { name: 'Séance de sport', icon: '🏋️', color: '#FF5A2E' },
      { name: '10 000 pas', icon: '🚶', color: '#2EC4B6' },
      { name: 'Étirements', icon: '🧘', color: '#3ECF5B' },
    ],
  },
  {
    id: 'wellbeing',
    title: 'Bien-être & mental',
    emoji: '🧘',
    description: "Prendre soin de ton esprit",
    habits: [
      { name: 'Méditation', icon: '🙏', color: '#B15AFF' },
      { name: 'Écriture / journaling', icon: '✍️', color: '#FFC542' },
      { name: 'Sommeil régulier', icon: '🛌', color: '#4E9BFF' },
    ],
  },
  {
    id: 'productivity',
    title: 'Productivité',
    emoji: '🎯',
    description: 'Avancer sur tes objectifs',
    habits: [
      { name: 'Lire 20 pages', icon: '📖', color: '#4E9BFF' },
      { name: "Pas d'écran le soir", icon: '📵', color: '#FF4D8D' },
      { name: 'Planifier sa journée', icon: '🗓️', color: '#FFC542' },
    ],
  },
  {
    id: 'health',
    title: 'Alimentation saine',
    emoji: '🥗',
    description: 'Mieux manger au quotidien',
    habits: [
      { name: 'Sans sucre ajouté', icon: '🍎', color: '#FF5A2E' },
      { name: '5 fruits et légumes', icon: '🥦', color: '#3ECF5B' },
      { name: "Boire 2L d'eau", icon: '💧', color: '#4E9BFF' },
    ],
  },
  {
    id: 'evening',
    title: 'Routine du soir',
    emoji: '🌙',
    description: 'Bien terminer la journée',
    habits: [
      { name: "Pas d'écran avant de dormir", icon: '📵', color: '#B15AFF' },
      { name: 'Lecture avant dodo', icon: '📖', color: '#4E9BFF' },
      { name: 'Coucher à heure fixe', icon: '🛌', color: '#2EC4B6' },
    ],
  },
];
