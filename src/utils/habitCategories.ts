// Icon values are Ionicons glyph names (see AddHabitScreen's icon picker
// and commonHabits.ts) — not emoji. Keep each category's icon list disjoint
// from every other category's so a single habit can't accidentally trigger
// two modules at once.
const SPORT_ICONS = ['barbell', 'fitness', 'walk', 'bicycle', 'flash'];
export function isSportHabit(name: string, icon: string) {
  return SPORT_ICONS.includes(icon) || /sport|muscu|gym|fitness|salle/i.test(name);
}

const MEDITATION_ICONS = ['leaf'];
export function isMeditationHabit(name: string, icon: string) {
  return MEDITATION_ICONS.includes(icon) || /médit|relax|respiration|calme|mental/i.test(name);
}

const NUTRITION_ICONS = ['nutrition', 'restaurant'];
export function isNutritionHabit(name: string, icon: string) {
  return NUTRITION_ICONS.includes(icon) || /aliment|nutrition|manger|repas|sucre|cuisine/i.test(name);
}

const READING_ICONS = ['book'];
export function isReadingHabit(name: string, icon: string) {
  return READING_ICONS.includes(icon) || /lecture|lire|livre/i.test(name);
}

const JAWLINE_ICONS = ['accessibility'];
export function isJawlineHabit(name: string, icon: string) {
  return JAWLINE_ICONS.includes(icon) || /jawline|mewing|mâchoire|machoire|menton/i.test(name);
}

const MONEY_SAVING_ICONS = ['ban', 'wine'];
export function isMoneySavingHabit(name: string, icon: string) {
  // "boire" alone would also match "Boire de l'eau" — only count it
  // together with "alcool" so plain water-drinking habits aren't caught.
  return MONEY_SAVING_ICONS.includes(icon) || /fumer|cigarette|tabac|clope|alcool/i.test(name);
}

const SCREEN_TIME_ICONS = ['airplane', 'eye', 'phone-portrait'];
export function isScreenTimeHabit(name: string, icon: string) {
  return (
    SCREEN_TIME_ICONS.includes(icon) ||
    /réseaux sociaux|reseaux sociaux|pause écran|pause ecran|temps d'écran|temps d'ecran|pas d'écran|pas d'ecran|téléphone|telephone/i.test(
      name
    )
  );
}

const LEARNING_ICONS = ['school', 'language'];
export function isLearningHabit(name: string, icon: string) {
  return LEARNING_ICONS.includes(icon) || /former|formation|langue|apprendre|compétence|competence|étudier|etudier/i.test(name);
}

const PODCAST_ICONS = ['headset'];
export function isPodcastHabit(name: string, icon: string) {
  return PODCAST_ICONS.includes(icon) || /podcast/i.test(name);
}

const SLEEP_ICONS = ['bed', 'moon'];
export function isSleepHabit(name: string, icon: string) {
  return SLEEP_ICONS.includes(icon) || /sommeil|dormir|coucher|réveil|reveil|endorm/i.test(name);
}
