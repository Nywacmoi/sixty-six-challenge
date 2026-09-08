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

const MONEY_SAVING_ICONS = ['🚭', '🍷'];
export function isMoneySavingHabit(name: string, icon: string) {
  // "boire" alone would also match "Boire de l'eau" — only count it
  // together with "alcool" so plain water-drinking habits aren't caught.
  return MONEY_SAVING_ICONS.includes(icon) || /fumer|cigarette|tabac|clope|alcool/i.test(name);
}

const SCREEN_TIME_ICONS = ['📴', '👀'];
export function isScreenTimeHabit(name: string, icon: string) {
  return SCREEN_TIME_ICONS.includes(icon) || /réseaux sociaux|reseaux sociaux|pause écran|pause ecran|temps d'écran|temps d'ecran/i.test(name);
}

const LEARNING_ICONS = ['🎓', '🗣️'];
export function isLearningHabit(name: string, icon: string) {
  return LEARNING_ICONS.includes(icon) || /former|formation|langue|apprendre|compétence|competence|étudier|etudier/i.test(name);
}

const PODCAST_ICONS = ['🎧'];
export function isPodcastHabit(name: string, icon: string) {
  return PODCAST_ICONS.includes(icon) || /podcast/i.test(name);
}

const SLEEP_ICONS = ['🛌', '🌙'];
export function isSleepHabit(name: string, icon: string) {
  return SLEEP_ICONS.includes(icon) || /sommeil|dormir|coucher|réveil|reveil|endorm/i.test(name);
}
