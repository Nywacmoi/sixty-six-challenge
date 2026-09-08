// Habit icons used to be raw emoji glyphs; they're now Ionicons names (see
// commonHabits.ts / AddHabitScreen's icon picker / templates.ts) for a
// cleaner, more consistent look. Anyone with habits saved before this
// change has old emoji sitting in their stored Habit.icon field — this
// maps every emoji that could ever have ended up there to its new Ionicons
// equivalent. Unknown values (already migrated, or genuinely unrecognized)
// pass through unchanged.
const OLD_EMOJI_TO_ICON: Record<string, string> = {
  '💧': 'water',
  '🏋️': 'barbell',
  '🚶': 'walk',
  '🙏': 'leaf',
  '📖': 'book',
  '🧘': 'leaf',
  '🛌': 'bed',
  '📵': 'phone-portrait',
  '🥦': 'nutrition',
  '🍎': 'restaurant',
  '✍️': 'pencil',
  '🗓️': 'calendar',
  '🌙': 'moon',
  '🚿': 'water',
  '🧹': 'home',
  '💰': 'cash',
  '👅': 'accessibility',
  '🎧': 'headset',
  '🎓': 'school',
  '🗣️': 'language',
  '🚭': 'ban',
  '🍷': 'wine',
  '📴': 'airplane',
  '🌳': 'trail-sign',
  '🚴': 'bicycle',
  '🤸': 'flower',
  '🪜': 'trending-up',
  '🦷': 'medical',
  '🧴': 'sparkles',
  '📞': 'call',
  '👨‍👩‍👧': 'people',
  '🤝': 'heart',
  '🌟': 'star',
  '👀': 'eye',
  '📊': 'bar-chart',
  '🎸': 'musical-notes',
  '🍳': 'cafe',
  '☀️': 'sunny',
  '🔥': 'flame',
  '💪': 'fitness',
  '🥗': 'nutrition',
  '🎨': 'color-palette',
  '💻': 'laptop',
  '🧠': 'bulb',
  '🎯': 'locate',
  '🌱': 'leaf',
};

export function migrateHabitIcon(icon: string): string {
  return OLD_EMOJI_TO_ICON[icon] ?? icon;
}
