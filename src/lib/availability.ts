export type Range = { startAt: Date; endAt: Date };

/** Deux intervalles [start, end) se chevauchent-ils ? */
export function overlaps(a: Range, b: Range): boolean {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

export function isRangeFree(range: Range, taken: Range[]): boolean {
  return !taken.some((t) => overlaps(range, t));
}

/** Liste des jours (AAAA-MM-JJ, dans le fuseau donné) couverts par des plages occupées. */
export function busyDays(taken: Range[], timeZone: string): Set<string> {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const days = new Set<string>();
  for (const r of taken) {
    // on avance par pas de 6 h pour ne rater aucun jour, quel que soit le fuseau
    for (let t = r.startAt.getTime(); t < r.endAt.getTime(); t += 6 * 3600 * 1000) {
      days.add(fmt.format(new Date(t)));
    }
    days.add(fmt.format(new Date(r.endAt.getTime() - 1)));
  }
  return days;
}
