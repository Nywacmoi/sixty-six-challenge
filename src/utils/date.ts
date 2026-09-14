export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const from = Date.UTC(fy, fm - 1, fd);
  const to = Date.UTC(ty, tm - 1, td);
  return Math.round((to - from) / 86400000);
}

export function addDays(dateKey: string, amount: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + amount);
  return toDateKey(date);
}

// Habits created by older versions of the app stored a full ISO timestamp
// where a date key belongs. Everything downstream splits on "-" and does
// arithmetic on the pieces, so one of those doesn't just render as "Invalid
// Date" — fed in as a challenge start date it throws the whole 99-day grid off.
// Trimming to the first ten characters normalises both shapes.
export function toSafeDateKey(value: string | null | undefined): string {
  if (!value) return todayKey();
  return value.slice(0, 10);
}

export function formatDayLabel(dateKey: string): string {
  const [y, m, d] = toSafeDateKey(dateKey).split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
}

// A stable index into `length` items that changes once a day (same value
// all day if reloaded, different value tomorrow) — used to rotate daily
// suggestions (a bonus exercise, a nutrition tip) without any stored state.
export function dailyIndex(length: number, salt = ''): number {
  if (length <= 0) return 0;
  const key = todayKey() + salt;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}
