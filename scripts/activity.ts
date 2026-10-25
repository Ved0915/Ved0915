// Fetches the contribution calendar (private counts included) into data/activity.json. Needs GH_TOKEN with read:user.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import type { RawCalendar } from './activity-data.ts';

const QUERY = `query { viewer { contributionsCollection { contributionCalendar { totalContributions weeks { contributionDays { date weekday contributionCount contributionLevel } } } } } }`;

const token = process.env.GH_TOKEN ?? execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim();

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': 'ved0915-profile' },
  body: JSON.stringify({ query: QUERY }),
});
if (!res.ok) throw new Error(`GitHub GraphQL ${res.status}`);

const json = (await res.json()) as { data?: { viewer: { contributionsCollection: { contributionCalendar: RawCalendar } } }; errors?: unknown };
const calendar = json.data?.viewer.contributionsCollection.contributionCalendar;
if (!calendar) throw new Error(`GitHub GraphQL returned no calendar: ${JSON.stringify(json.errors)}`);

const out = new URL('../data/activity.json', import.meta.url);
mkdirSync(new URL('.', out), { recursive: true });
writeFileSync(out, `${JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), calendar }, null, 1)}\n`);
console.log(`activity: ${calendar.totalContributions} contributions`);
