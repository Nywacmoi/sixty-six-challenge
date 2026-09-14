import { dailyIndex } from '../utils/date';

// One short line under the day's number, chosen from where the person actually
// stands rather than pulled at random. Nothing here congratulates an empty day
// or scolds a late one: the app's job is to get one more habit ticked, not to
// have an opinion about the person.
//
// The line is stable for the whole day. A sentence that changes every time the
// screen re-renders stops being a message and becomes noise — and it would
// flicker on every tick of the countdown, which re-renders once a second.
const NOT_STARTED_EARLY = [
  'La première coche est toujours la plus lourde.',
  'Commence par la plus facile. Le reste suit.',
  'Rien n’est fait. Tout est encore possible.',
  'Une habitude cochée vaut mieux qu’une journée parfaite imaginée.',
];

const NOT_STARTED_LATE = [
  'Il reste du temps pour une. Prends la plus rapide.',
  'Une seule coche sauve la journée.',
  'Une habitude à moitié vaut mieux qu’une journée blanche.',
];

const IN_PROGRESS = [
  'Tu as commencé. C’était le plus dur.',
  'Le rythme compte plus que la perfection.',
  'Tu es dans le bon sens. Continue.',
  'Chaque coche rend la suivante plus facile.',
];

const ALMOST = [
  'Plus qu’un pas.',
  'Ne t’arrête pas si près.',
  'La dernière est celle dont tu te souviendras.',
];

const DONE = [
  'Journée pleine. Rendez-vous demain.',
  'C’est exactement comme ça qu’une série se construit.',
  'Rien à ajouter. Tu as fait le travail.',
];

const LATE_HOURS = 3;
const ALMOST_RATIO = 0.75;
// Below this a run is still an attempt; past it, it's worth naming.
const STREAK_WORTH_NAMING = 7;

export function getMotivation({
  doneCount,
  totalCount,
  hoursLeft,
  streak,
}: {
  doneCount: number;
  totalCount: number;
  hoursLeft: number;
  streak: number;
}): string | null {
  if (totalCount === 0) return null;

  const ratio = doneCount / totalCount;

  // A long run said out loud beats any generic line, but only once the day is
  // actually secured — otherwise it congratulates a streak that's about to break.
  if (ratio >= 1 && streak >= STREAK_WORTH_NAMING) {
    return `${streak} jours d’affilée. C’est une série, plus un essai.`;
  }

  const pool =
    ratio >= 1
      ? DONE
      : ratio >= ALMOST_RATIO
        ? ALMOST
        : doneCount > 0
          ? IN_PROGRESS
          : hoursLeft < LATE_HOURS
            ? NOT_STARTED_LATE
            : NOT_STARTED_EARLY;

  // Seeded per bucket so moving from one state to the next always changes the
  // sentence, instead of landing on the same index of a different list.
  return pool[dailyIndex(pool.length, `motivation:${pool.length}:${Math.round(ratio * 10)}`)];
}
