import { useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { computeSkills, Skill, SkillId } from '../utils/skills';

export function useSkills(): Skill[] {
  const { habits, completions } = useApp();
  return useMemo(() => computeSkills(habits, completions), [habits, completions]);
}

// Says so when a tick takes a skill up a level — the moment the tree stops
// being a chart on a screen you rarely open and becomes a reward you feel.
//
// Only for a single fresh check-in. Loading the store, restoring a backup or
// importing a file also move every skill at once, and none of those deserve
// five toasts; unticking never levels anything up. So a level-up only counts
// when the number of check-ins has grown by exactly one since last time.
export function useSkillLevelUps() {
  const skills = useSkills();
  const { loading, completions, showToast } = useApp();
  const previous = useRef<{ total: number; levels: Record<SkillId, number> } | null>(null);

  useEffect(() => {
    if (loading) return;
    const total = completions.reduce((n, c) => n + (c.completed ? 1 : 0), 0);
    const levels = Object.fromEntries(skills.map((s) => [s.id, s.level])) as Record<SkillId, number>;
    const before = previous.current;
    previous.current = { total, levels };
    if (!before || total !== before.total + 1) return;

    const up = skills.find((s) => s.level > before.levels[s.id]);
    if (up) showToast(up.icon, `${up.label} passe niveau ${up.level} · ${up.tier}`);
    // `skills` is derived from `completions`, so it changes in the same render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills, loading]);
}
