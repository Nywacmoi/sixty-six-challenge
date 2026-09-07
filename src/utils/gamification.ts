export const XP_PER_COMPLETION = 10;
export const XP_PER_ACHIEVEMENT = 50;
export const MAX_STREAK_FREEZES = 3;

export type LevelInfo = {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  progress: number;
};

function xpRequiredForLevel(level: number): number {
  return 100 + (level - 1) * 40;
}

export function getLevelInfo(totalXP: number): LevelInfo {
  let level = 1;
  let remaining = totalXP;
  let needed = xpRequiredForLevel(level);
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed = xpRequiredForLevel(level);
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: needed,
    progress: remaining / needed,
  };
}
