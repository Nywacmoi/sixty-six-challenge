// "léa", "léa et sam", "léa, sam et inès", "léa, sam et 3 autres" — a short
// list in French, capped so a big group's relance stays one line.
export function joinNames(names: string[], max = 3): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length > max) return `${names.slice(0, max - 1).join(', ')} et ${names.length - (max - 1)} autres`;
  return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
}
