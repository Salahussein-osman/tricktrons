// The week counter. Spawns reset every week, so every TT seed carries a week tag
// like "2026-W40". ISO 8601 weeks: Monday-based, week 1 is the one with the year's
// first Thursday in it. Same rule everywhere, so every device agrees on the week.

export function isoWeek(d: Date = new Date()): string {
  // Work in UTC so the week doesn't depend on the player's time zone.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // hop to this week's Thursday
  const firstThursday = Date.UTC(date.getUTCFullYear(), 0, 4); // Jan 4 is always in week 1
  const week = 1 + Math.round((date.getTime() - firstThursday) / 86_400_000 / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Census Day: once a year every sealed seed opens (DESIGN.md section 7). It falls
// the moment the year's last week ends — Monday 00:00 UTC of week 1 of the next
// ISO year. Everyone computes the same instant, no announcement needed.
export function censusDay(isoYear: number): Date {
  const jan4 = new Date(Date.UTC(isoYear + 1, 0, 4)); // always in week 1
  const dayNum = (jan4.getUTCDay() + 6) % 7;          // Mon=0 .. Sun=6
  return new Date(Date.UTC(isoYear + 1, 0, 4 - dayNum));
}

// "2026-W41" -> 2026. The ISO year a week belongs to (can differ from the calendar
// year in the first/last days of January/December).
export function weekYear(week: string): number {
  return Number(week.slice(0, 4));
}
