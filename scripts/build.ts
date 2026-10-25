// Writes data/cards.json for the card renderer and the README for both profiles. `--org <dir>` writes the org README there.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as simpleIcons from 'simple-icons';
import { summarize } from './activity-data.ts';
import { contact, orgServices, personalBuild, projects, shipSteps, toolkit } from './data.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const orgIndex = process.argv.indexOf('--org');
const orgDir = orgIndex === -1 ? null : resolve(root, process.argv[orgIndex + 1] ?? '');

// Stack labels as written in data.ts mapped to simple-icons slugs; null means a text badge.
const STACK_LOGO: Record<string, string | null> = {
  Laravel: 'laravel', Filament: 'filament', Inertia: 'inertia', Vue: 'vuedotjs', React: 'react', Livewire: 'livewire', Astro: 'astro',
  TypeScript: 'typescript', Tailwind: 'tailwindcss', GSAP: 'greensock', Blade: 'laravel', MySQL: 'mysql', WordPress: 'wordpress',
  WooCommerce: 'woocommerce', Elementor: 'elementor', PHP: 'php', Bootstrap: 'bootstrap', 'Custom theme': null,
};
const stackLogo = (label: string): [string, string] => [STACK_LOGO[label.replace(/ \d+$/, '')] ?? label, label];

const icons: Record<string, { title: string; path: string }> = {};
const wanted = new Set<string>();
const use = (slug: string) => {
  wanted.add(slug);
  return slug;
};
for (const icon of Object.values(simpleIcons) as Array<{ slug?: string; title: string; path: string }>) {
  if (icon.slug) icons[icon.slug] = { title: icon.title, path: icon.path };
}

const raw = JSON.parse(readFileSync(resolve(root, 'data/activity.json'), 'utf8'));
const activity = summarize(raw.calendar, raw.generatedAt);

const cards = {
  projects: projects.map((p) => ({
    ...p,
    domain: p.url ? p.url.replace(/^https:\/\/(www\.)?/, '') : null,
    hasShot: Boolean(p.url) && existsSync(resolve(root, 'assets/shots', `${p.slug}.webp`)),
    stackLogos: p.stack.map(stackLogo).map(([s, l]) => [use(s), l]),
  })),
  ship: shipSteps.map((s) => ({ ...s, logo: use(s.logo) })),
  toolkit: toolkit.map((g) => ({ group: g.group, items: g.items.map(([slug, label]) => [use(slug), label]) })),
  activity,
  personal: {
    tiles: { title: 'What I build', subtitle: 'Laravel apps with Filament back offices, from the first schema to the deploy.', items: personalBuild.map((t) => ({ ...t, logos: t.logos.map(([s, l]) => [use(s), l]) })) },
    work: { title: 'Selected work', subtitle: `${projects.length} live sites for real clients. The code stays in a private org.` },
    ship: { title: 'How I ship', subtitle: 'Every change passes the same gates before it reaches a client.' },
    toolkit: { title: 'Toolkit', subtitle: 'The tools I use every day.' },
    footer: { lines: ['Open to freelance', 'and contract work.'], rows: [[use('gmail'), contact.personal.email], [use('whatsapp'), contact.personal.phone], [use('googlechrome'), 'balanceview.in/it-services']] },
  },
  org: {
    tiles: { title: 'What we do', subtitle: 'Seven areas, one team, around ten direct clients.', items: orgServices.map((t) => ({ ...t, logos: t.logos.map(([s, l]) => [use(s), l]) })) },
    work: { title: 'Live work', subtitle: `${projects.length} sites we built and run. Client code stays private.` },
    ship: { title: 'How we ship', subtitle: 'Every change passes the same gates before it reaches a client.' },
    footer: { lines: ['Talk to the', 'IT team.'], rows: [[use('gmail'), contact.org.email], [use('googlechrome'), 'balanceview.in/it-services']] },
  },
  icons: {} as Record<string, { title: string; path: string }>,
};
for (const slug of wanted) if (icons[slug]) cards.icons[slug] = icons[slug];

mkdirSync(resolve(root, 'data'), { recursive: true });
writeFileSync(resolve(root, 'data/cards.json'), `${JSON.stringify(cards)}\n`);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const img = (file: string, alt: string, width = '100%') => `<img src="assets/${file}" width="${width}" alt="${esc(alt)}">`;
const badge = (label: string, message: string, logo: string, href: string, colors: [string, string]) => {
  const enc = (s: string) => encodeURIComponent(s.replace(/-/g, '--').replace(/_/g, '__').replace(/ /g, '_'));
  return `<a href="${href}"><img src="https://img.shields.io/badge/${enc(label)}-${enc(message)}-${colors[1]}?style=flat-square&labelColor=${colors[0]}&logo=${logo}&logoColor=white" alt="${esc(`${label}: ${message}`)}" height="28"></a>`;
};

function readme(brandKey: 'personal' | 'org'): string {
  const isOrg = brandKey === 'org';
  const b = cards[brandKey];
  const colors: [string, string] = isOrg ? ['16183A', '4F46B5'] : ['0C2228', '0F766E'];
  const badges = isOrg
    ? [badge('Website', 'balanceview.in', 'googlechrome', contact.org.site, colors), badge('Email', contact.org.email, 'gmail', `mailto:${contact.org.email}`, colors)]
    : [
        badge('Website', 'balanceview.in', 'googlechrome', contact.personal.site, colors),
        badge('Email', contact.personal.email, 'gmail', `mailto:${contact.personal.email}`, colors),
        badge('WhatsApp', contact.personal.phone, 'whatsapp', contact.personal.whatsapp, colors),
        badge('Org', 'Balanceview', 'github', 'https://github.com/Balanceview', colors),
      ];
  const heroAlt = isOrg
    ? 'BalanceView IT services from Ahmedabad: software development, security reviews and cloud hosting. You get the full source code of what we build.'
    : 'Vedprakash Dhaka, full-stack engineer in Ahmedabad. I build Laravel and React apps for businesses, and the pipelines that ship them safely. Open to freelance and contract work.';
  const tilesAlt = `${b.tiles.title}. ${b.tiles.items.map((t) => `${t.title}: ${t.text}`).join(' ')}`;
  const pairs: string[] = [];
  for (let i = 0; i < projects.length; i += 2) {
    const pair = projects.slice(i, i + 2).map((p) => {
      const text = isOrg && p.orgText ? p.orgText : p.text;
      const tile = img(`work-${p.slug}.webp`, `${p.name}: ${text} Built with ${p.stack.join(', ')}.`, '49%');
      return p.url ? `<a href="${p.url}">${tile}</a>` : tile;
    });
    pairs.push(`<p align="center">\n${pair.join('\n')}\n</p>`);
  }
  const blocks = [
    `<!-- Generated by scripts/build.ts${isOrg ? ' in Ved0915/Ved0915' : ''}. Edit the data there, not this file. -->`,
    `<a href="${isOrg ? contact.org.site : contact.personal.site}">${img('hero.webp', heroAlt)}</a>`,
    `<p align="center">\n${badges.join('\n')}\n</p>`,
    // Plain text as well as the images, so the key facts are selectable and searchable.
    `<p align="center">${esc(isOrg ? 'BalanceView builds websites, web apps, APIs, mobile apps and business software for companies across India, from Ahmedabad. You get the full source code of what we build.' : 'Full-stack engineer in Ahmedabad. I build Laravel and React apps for businesses, with Filament back offices, and the CI pipelines that ship them safely. Open to freelance and contract work.')}</p>`,
    img('tiles.webp', tilesAlt),
    img('work.webp', `${b.work.title}. ${b.work.subtitle}`),
    ...pairs,
    img('ship.webp', `${b.ship.title}. ${shipSteps.map((s) => `${s.name} (${s.note})`).join(', then ')}.`),
  ];
  if (!isOrg) {
    blocks.push(img('toolkit.webp', `Toolkit. ${toolkit.map((g) => `${g.group}: ${g.items.map(([, l]) => l).join(', ')}`).join('. ')}.`));
    blocks.push(
      img('activity.webp', `Activity: ${activity.total} contributions on ${activity.activeDays} active days in the last year, longest streak ${activity.longestStreak} days, busiest day ${activity.busiest.count} on ${activity.busiest.label}. Counts include private client repositories.`),
    );
  }
  blocks.push(img('footer.webp', `${b.footer.lines.join(' ')} ${b.footer.rows.map(([, t]) => t).join(', ')}.`));
  return `${blocks.join('\n\n')}\n`;
}

writeFileSync(resolve(root, 'README.md'), readme('personal'));
if (orgDir) writeFileSync(resolve(orgDir, 'README.md'), readme('org'));
console.log(`cards.json: ${Object.keys(cards.icons).length} logos; README written${orgDir ? ' for both' : ''}`);
