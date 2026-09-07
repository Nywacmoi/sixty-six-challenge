export type MealIdea = {
  id: string;
  label: string;
  emoji: string;
  ideas: string[];
};

export const MEAL_IDEAS: MealIdea[] = [
  {
    id: 'breakfast',
    label: 'Petit-déjeuner',
    emoji: '🍳',
    ideas: [
      "Flocons d'avoine, fruits rouges et graines de chia",
      'Œufs brouillés, avocat et pain complet',
      'Yaourt grec, miel et amandes',
    ],
  },
  {
    id: 'lunch',
    label: 'Déjeuner',
    emoji: '🥗',
    ideas: [
      'Poulet grillé, quinoa et légumes rôtis',
      'Salade de lentilles, feta et tomates',
      'Wrap complet, houmous et crudités',
    ],
  },
  {
    id: 'dinner',
    label: 'Dîner',
    emoji: '🍲',
    ideas: [
      'Saumon, brocolis vapeur et riz complet',
      'Soupe de légumes maison et œuf poché',
      'Tofu sauté, légumes et nouilles complètes',
    ],
  },
  {
    id: 'snack',
    label: 'Collation',
    emoji: '🍎',
    ideas: [
      'Fruit frais et poignée d\'amandes',
      'Yaourt nature et quelques noix',
      'Bâtonnets de légumes et houmous',
    ],
  },
];
