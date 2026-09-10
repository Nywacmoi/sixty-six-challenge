// "10 000 pas" -> 10000. Falls back to a sane default for habits that
// don't name a number (a custom "Marcher plus" habit using the walk icon).
export function parseStepGoal(name: string): number {
  const digits = name.replace(/[^\d]/g, '');
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : 10000;
}
