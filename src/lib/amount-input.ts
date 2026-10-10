/** Keep only digits and one dot, with at most two decimals. */
export function cleanAmountInput(raw: string) {
  const kept = raw.replace(/[^0-9.]/g, "");
  const dot = kept.indexOf(".");
  if (dot === -1) return kept.slice(0, 9);
  return kept.slice(0, 9).slice(0, dot + 1) + kept.slice(dot + 1).replace(/\./g, "").slice(0, 2);
}
