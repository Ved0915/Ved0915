export type Level = 0 | 1 | 2 | 3 | 4;
export type Day = { date: string; weekday: number; count: number; level: Level };

export type Activity = {
  total: number;
  days: number;
  activeDays: number;
  longestStreak: number;
  busiest: { date: string; count: number; label: string };
  weeks: Day[][];
  generatedLabel: string;
};

type RawDay = { date: string; weekday: number; contributionCount: number; contributionLevel: string };
export type RawCalendar = { totalContributions: number; weeks: Array<{ contributionDays: RawDay[] }> };

const LEVELS: Record<string, Level> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

const label = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function summarize(cal: RawCalendar, generatedAt: string): Activity {
  const weeks = cal.weeks.map((w) =>
    w.contributionDays.map((d) => ({ date: d.date, weekday: d.weekday, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0 })),
  );
  const days = weeks.flat();
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  const busiest = days.reduce((best, d) => (d.count > best.count ? d : best), days[0]);
  return {
    total: cal.totalContributions,
    days: days.length,
    activeDays: days.filter((d) => d.count > 0).length,
    longestStreak: longest,
    busiest: { date: busiest.date, count: busiest.count, label: label(busiest.date) },
    weeks,
    generatedLabel: label(generatedAt),
  };
}
