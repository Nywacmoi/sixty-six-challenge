// Icon values are Ionicons glyph names (see AddHabitScreen's icon picker
// and commonHabits.ts) — not emoji. Keep each category's icon list disjoint
// from every other category's so a single habit can't accidentally trigger
// two modules at once.
// 'walk' is deliberately NOT here: it's shared with plain "go for a walk"
// habits ("Marcher / prendre l'air") that shouldn't pull up the full
// gym-workout module (weight/BMI tracking, Push/Pull/Legs splits). A
// step-count habit like "10 000 pas" gets the dedicated steps module
// instead (see isStepsHabit below).
const SPORT_ICONS = ['barbell', 'fitness', 'bicycle', 'flash'];
export function isSportHabit(name: string, icon: string) {
  return SPORT_ICONS.includes(icon) || /sport|muscu|gym|fitness|salle/i.test(name);
}

const STEPS_ICONS = ['walk'];
export function isStepsHabit(name: string, icon: string) {
  return STEPS_ICONS.includes(icon) || /\d[\s .,]?\d{2,3}\s*pas\b|nombre de pas|compteur de pas/i.test(name);
}

const MEDITATION_ICONS = ['leaf'];
export function isMeditationHabit(name: string, icon: string) {
  return MEDITATION_ICONS.includes(icon) || /médit|relax|respiration|calme|mental|yoga/i.test(name);
}

const NUTRITION_ICONS = ['nutrition', 'restaurant'];
export function isNutritionHabit(name: string, icon: string) {
  return NUTRITION_ICONS.includes(icon) || /aliment|nutrition|manger|repas|sucre|cuisine|petit-déj|petit-dej/i.test(name);
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
  return (
    LEARNING_ICONS.includes(icon) ||
    /former|formation|langue|apprendre|compétence|competence|étudier|etudier|instrument/i.test(name)
  );
}

const PODCAST_ICONS = ['headset'];
export function isPodcastHabit(name: string, icon: string) {
  return PODCAST_ICONS.includes(icon) || /podcast/i.test(name);
}

const SLEEP_ICONS = ['bed', 'moon'];
export function isSleepHabit(name: string, icon: string) {
  return SLEEP_ICONS.includes(icon) || /sommeil|dormir|coucher|réveil|reveil|endorm/i.test(name);
}

const BUDGET_ICONS = ['bar-chart'];
export function isBudgetHabit(name: string, icon: string) {
  return BUDGET_ICONS.includes(icon) || /budget|dépense|depense|finances?\b/i.test(name);
}

const CATEGORY_CHECKS: Array<[string, (name: string, icon: string) => boolean]> = [
  ['sport', isSportHabit],
  ['steps', isStepsHabit],
  ['meditation', isMeditationHabit],
  ['nutrition', isNutritionHabit],
  ['reading', isReadingHabit],
  ['jawline', isJawlineHabit],
  ['moneySaving', isMoneySavingHabit],
  ['screenTime', isScreenTimeHabit],
  ['learning', isLearningHabit],
  ['podcast', isPodcastHabit],
  ['sleep', isSleepHabit],
  ['budget', isBudgetHabit],
];

// Every theme a habit belongs to — used to suggest new habits that fit
// themes the person is already building, instead of a fixed generic list.
export function getHabitCategories(name: string, icon: string): string[] {
  return CATEGORY_CHECKS.filter(([, check]) => check(name, icon)).map(([key]) => key);
}
