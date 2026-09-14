import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TOTAL_DAYS } from '../theme/theme';
import { addDays, toSafeDateKey } from '../utils/date';

// How much of each of the 99 days got done, across every active habit, as a
// ratio from 0 to 1. This is DayGrid's only input, and three screens need the
// same array — Progression, a habit's own screen and the share card — so it
// lives here rather than being re-derived slightly differently in each.
export function useDayValues(): number[] {
  const { habits, completions, isCompleted, profile } = useApp();
  const startDate = toSafeDateKey(profile.challengeStartDate);

  return useMemo(() => {
    const active = habits.filter((h) => !h.archived);
    return Array.from({ length: TOTAL_DAYS }, (_, i) => {
      if (active.length === 0) return 0;
      const date = addDays(startDate, i);
      return active.filter((h) => isCompleted(h.id, date)).length / active.length;
    });
    // `completions` is what actually changes underneath isCompleted.
  }, [startDate, habits, completions, isCompleted]);
}
