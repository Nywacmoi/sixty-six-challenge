import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { todayKey } from '../utils/date';
import { computeTrends, Trends } from '../utils/trends';

// computeTrends asks "was this done that day?" a few thousand times;
// isCompleted scans every completion each time, so this answers from a set.
export function useTrends(): Trends {
  const { habits, completions, metrics, profile } = useApp();
  const today = todayKey();

  return useMemo(() => {
    const done = new Set(completions.filter((c) => c.completed).map((c) => `${c.habitId}|${c.date}`));
    return computeTrends({
      habits,
      isDone: (habitId, date) => done.has(`${habitId}|${date}`),
      startDate: profile.challengeStartDate ?? today,
      today,
      sleep: metrics.filter((m) => m.key === 'checkin:sleep'),
      mood: metrics.filter((m) => m.key === 'checkin:mood'),
    });
  }, [habits, completions, metrics, profile.challengeStartDate, today]);
}
