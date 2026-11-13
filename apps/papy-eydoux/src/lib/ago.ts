const nf = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/**
 * "il y a …" label for a year on the timeline, relative to `now`.
 * Negative years are BCE; `approximate` adds "environ" for dates we only know roughly.
 */
export function agoLabel(year: number, now: number, approximate = false): string {
  const exact = now - Math.floor(year);
  // A rough date doesn't deserve a precise count: keep two significant digits (38 026 → 38 000).
  const years = approximate && exact >= 100 && exact < 1e6 ? roundTo2Significant(exact) : exact;
  if (exact <= 0) return "aujourd’hui";
  const about = approximate ? "environ " : "";
  if (years >= 1e9) return `il y a ${about}${nf.format(years / 1e9)} milliards d’années`;
  if (years >= 1e6) return `il y a ${about}${nf.format(Math.round(years / 1e6))} millions d’années`;
  if (years === 1) return "il y a 1 an";
  return `il y a ${about}${nf.format(years)} ans`;
}

function roundTo2Significant(n: number): number {
  const step = 10 ** (Math.floor(Math.log10(n)) - 1);
  return Math.round(n / step) * step;
}
