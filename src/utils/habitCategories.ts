const SPORT_ICONS = ['🏋️', '💪', '🏃', '🚴', '⚡'];
export function isSportHabit(name: string, icon: string) {
  return SPORT_ICONS.includes(icon) || /sport|muscu|gym|fitness|salle/i.test(name);
}

const MEDITATION_ICONS = ['🙏', '🧘'];
export function isMeditationHabit(name: string, icon: string) {
  return MEDITATION_ICONS.includes(icon) || /médit|relax|respiration|calme|mental/i.test(name);
}

const NUTRITION_ICONS = ['🥗', '🍎', '🥦'];
export function isNutritionHabit(name: string, icon: string) {
  return NUTRITION_ICONS.includes(icon) || /aliment|nutrition|manger|repas|sucre|cuisine/i.test(name);
}

const READING_ICONS = ['📖'];
export function isReadingHabit(name: string, icon: string) {
  return READING_ICONS.includes(icon) || /lecture|lire|livre/i.test(name);
}

const JAWLINE_ICONS = ['👅'];
export function isJawlineHabit(name: string, icon: string) {
  return JAWLINE_ICONS.includes(icon) || /jawline|mewing|mâchoire|machoire|menton/i.test(name);
}
