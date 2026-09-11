// `icon` is an Ionicons glyph name (see AddHabitScreen's icon picker), not
// an emoji — kept as plain strings so it stays interchangeable with
// user-created habits' icon field.
export type CommonHabit = { name: string; icon: string; color: string };

// Trimmed from ~40 to the strongest suggestions: kept the universal,
// clearly-actionable ones and anything with its own detail-screen module
// (sport, steps, meditation, nutrition, reading, learning, podcast, screen
// time, money-saving — see src/utils/habitCategories.ts), cut the vague
// ones ("Ranger / nettoyer", "Économiser de l'argent") and near-duplicates
// ("Se coucher tôt" next to "Dormir 8h", "Faire une pause écran" next to
// two other screen-time habits already on the list). This list is purely
// the quick-add suggestions — it doesn't touch anyone's own custom habits,
// and the routine templates in data/templates.ts define their own habits
// independently of this file.
export const COMMON_HABITS: CommonHabit[] = [
  { name: "Boire de l'eau", icon: 'water', color: '#4E9BFF' },
  { name: 'Faire du sport', icon: 'barbell', color: '#FF5A2E' },
  { name: '10 000 pas', icon: 'walk', color: '#2EC4B6' },
  { name: 'Méditer', icon: 'leaf', color: '#B15AFF' },
  { name: 'Lire 20 pages', icon: 'book', color: '#4E9BFF' },
  { name: 'Dormir 8h', icon: 'bed', color: '#2EC4B6' },
  { name: "Pas d'écran le soir", icon: 'phone-portrait', color: '#FF4D8D' },
  { name: '5 fruits et légumes', icon: 'nutrition', color: '#3ECF5B' },
  { name: 'Sans sucre ajouté', icon: 'restaurant', color: '#FF5A2E' },
  { name: 'Écriture / journaling', icon: 'pencil', color: '#FFC542' },
  { name: 'Planifier sa journée', icon: 'calendar', color: '#FFC542' },
  { name: 'Pas de téléphone au réveil', icon: 'phone-portrait', color: '#FF4D8D' },
  { name: 'Douche froide', icon: 'snow', color: '#4E9BFF' },
  { name: 'Écouter un podcast', icon: 'headset', color: '#4E9BFF' },
  { name: 'Se former (apprendre une compétence)', icon: 'school', color: '#B15AFF' },
  { name: 'Apprendre une langue', icon: 'language', color: '#2EC4B6' },
  { name: 'Arrêter de fumer', icon: 'ban', color: '#FF5A2E' },
  { name: "Réduire l'alcool", icon: 'wine', color: '#FF4D8D' },
  { name: 'Moins de réseaux sociaux', icon: 'airplane', color: '#FFC542' },
  { name: 'Yoga', icon: 'flower', color: '#3ECF5B' },
  // Cut in the original trim for being too vague to act on — back in now
  // that it has a real module (BudgetTracker: dépense du jour, moyenne,
  // prévision de fin de mois vs objectif).
  { name: 'Suivre son budget', icon: 'bar-chart', color: '#FFC542' },
];
