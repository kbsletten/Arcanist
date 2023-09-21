export function statModifier(stat) {
  return Math.max(-4, Math.min(4, ((stat / 2) | 0) - 5));
}

export function plusOrMinus(number) {
  return number >= 0 ? `+ ${number}` : `- ${Math.abs(number)}`;
}

export function findByName(needle, haystack) {
  const exactMatches = haystack.filter(it => it.name === needle);
  if (exactMatches.length > 0) {
    return exactMatches;
  }
  const caseInsensitiveMatches = haystack.filter(it => it.name.toLowerCase() === needle.toLowerCase());
  if (caseInsensitiveMatches.length > 0) {
    return caseInsensitiveMatches;
  }
  const partialMatches = haystack.filter(it => it.name.includes(needle));
  if (partialMatches.length > 0) {
    return partialMatches;
  }
  const caseInsensitivePartialMatches = haystack.filter(it => it.name.toLowerCase().includes(needle.toLowerCase()));
  return caseInsensitivePartialMatches;
}
