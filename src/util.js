export function statModifier(stat) {
  return Math.max(-4, Math.min(4, ((stat / 2) | 0) - 5));
}
