export type Diet = 'omnivore' | 'vegetarien' | 'vegan';

export type MealSuggestion = { text: string; diet: Diet[] };

export type MealIdea = {
  id: string;
  label: string;
  emoji: string;
  ideas: MealSuggestion[];
};

export const DIET_OPTIONS: { id: Diet; label: string; emoji: string }[] = [
  { id: 'omnivore', label: 'Tout', emoji: '🍖' },
  { id: 'vegetarien', label: 'Végétarien', emoji: '🥕' },
  { id: 'vegan', label: 'Vegan', emoji: '🌱' },
];

const NO_MEAT: Diet[] = ['omnivore', 'vegetarien'];
const VEGAN_OK: Diet[] = ['omnivore', 'vegetarien', 'vegan'];

export const MEAL_IDEAS: MealIdea[] = [
  {
    id: 'breakfast',
    label: 'Petit-déjeuner',
    emoji: '🍳',
    ideas: [
      { text: "Flocons d'avoine, fruits rouges et graines de chia", diet: VEGAN_OK },
      { text: 'Œufs brouillés, avocat et pain complet', diet: NO_MEAT },
      { text: 'Yaourt grec, miel et amandes', diet: NO_MEAT },
      { text: 'Porridge banane et beurre de cacahuète', diet: VEGAN_OK },
      { text: 'Pain complet, fromage blanc et fruits secs', diet: NO_MEAT },
      { text: 'Smoothie bowl fruits rouges et granola', diet: VEGAN_OK },
      { text: 'Omelette aux légumes et tranche de pain complet', diet: NO_MEAT },
    ],
  },
  {
    id: 'lunch',
    label: 'Déjeuner',
    emoji: '🥗',
    ideas: [
      { text: 'Poulet grillé, quinoa et légumes rôtis', diet: ['omnivore'] },
      { text: 'Salade de lentilles, feta et tomates', diet: NO_MEAT },
      { text: 'Wrap complet, houmous et crudités', diet: VEGAN_OK },
      { text: 'Bowl de riz complet, saumon et edamame', diet: ['omnivore'] },
      { text: 'Salade de pois chiches, concombre et menthe', diet: VEGAN_OK },
      { text: 'Pâtes complètes, sauce tomate maison et parmesan', diet: NO_MEAT },
      { text: 'Buddha bowl quinoa, patate douce et légumes rôtis', diet: VEGAN_OK },
    ],
  },
  {
    id: 'dinner',
    label: 'Dîner',
    emoji: '🍲',
    ideas: [
      { text: 'Saumon, brocolis vapeur et riz complet', diet: ['omnivore'] },
      { text: 'Soupe de légumes maison et œuf poché', diet: NO_MEAT },
      { text: 'Tofu sauté, légumes et nouilles complètes', diet: VEGAN_OK },
      { text: 'Poisson blanc, purée de patate douce et haricots verts', diet: ['omnivore'] },
      { text: 'Curry de légumes et pois chiches, riz basmati', diet: VEGAN_OK },
      { text: 'Omelette aux champignons et salade verte', diet: NO_MEAT },
      { text: 'Poulet rôti, ratatouille maison', diet: ['omnivore'] },
    ],
  },
  {
    id: 'snack',
    label: 'Collation',
    emoji: '🍎',
    ideas: [
      { text: "Fruit frais et poignée d'amandes", diet: VEGAN_OK },
      { text: 'Yaourt nature et quelques noix', diet: NO_MEAT },
      { text: 'Bâtonnets de légumes et houmous', diet: VEGAN_OK },
      { text: 'Compote sans sucre ajouté et quelques noisettes', diet: VEGAN_OK },
      { text: 'Fromage blanc et fruits rouges', diet: NO_MEAT },
      { text: 'Une poignée de fruits secs et un fruit', diet: VEGAN_OK },
      { text: "Tranche de pain complet et purée d'oléagineux", diet: VEGAN_OK },
    ],
  },
];
