// Renders every profile card in headless Chromium to WebP. Usage: node scripts/render.ts [personal|org] [card names...]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Page } from 'playwright-core';
import { featured, projects } from './data.ts';

type Job = { name: string; url: string; selector: string; fps?: number };

const root = fileURLToPath(new URL('..', import.meta.url));
const ORG_OUT = resolve(root, '..', 'balanceview-dotgithub', 'profile', 'assets');
const DPR = 1.25;
const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };

const [brandArg = 'personal', ...only] = process.argv.slice(2);
const brand = brandArg === 'org' ? 'org' : 'personal';
const outDir = brand === 'org' ? ORG_OUT : join(root, 'assets');
const card = (c: string, extra = '') => `/scripts/render/card.html?card=${c}&brand=${brand}${extra}`;
const jobs: Job[] = [
  brand === 'personal' ? { name: 'hero', url: '/scripts/hero/hero.html?dpr=1.25', selector: '#hero', fps: 20 } : { name: 'hero', url: card('ohero'), selector: '.card', fps: 12 },
  { name: 'tiles', url: card('tiles'), selector: '.card' },
  { name: 'work', url: card('strip'), selector: '.card' },
  ...projects.filter((p) => featured.includes(p.slug)).map((p) => ({ name: `work-${p.slug}`, url: card('work', `&slug=${p.slug}`), selector: '.card' })),
  { name: 'more', url: card('more'), selector: '.card' },
  { name: 'ship', url: card('ship'), selector: '.card', fps: 12 },
  { name: 'toolkit', url: card('toolkit'), selector: '.card' },
  ...(brand === 'personal' ? [{ name: 'activity', url: card('activity', `&dpr=${DPR}`), selector: '.card', fps: 12 }] : []),
  { name: 'footer', url: card('footer'), selector: '.card' },
].filter((j) => !only.length || only.some((o) => j.name === o || j.name.startsWith(`${o}-`)));

const server = createServer((req, res) => {
  const file = join(root, decodeURIComponent((req.url ?? '/').split('?')[0]));
  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
});
await new Promise<void>((done) => server.listen(4410, done));

async function capture(page: Page, job: Job): Promise<void> {
  const tmp = resolve(root, '.scratch', 'frames', job.name);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });
  await page.goto(`http://127.0.0.1:4410${job.url}`);
  await page.waitForFunction(() => (window as unknown as { ready?: Promise<boolean> }).ready !== undefined);
  await page.evaluate(() => (window as unknown as { ready: Promise<boolean> }).ready);
  const layoutError = await page.evaluate(() => (window as unknown as { layoutError?: string }).layoutError);
  if (layoutError) throw new Error(`${job.name}: ${layoutError}`);
  const el = page.locator(job.selector);
  const loop = job.fps ? await page.evaluate(() => (window as unknown as { LOOP: number }).LOOP) : 0;
  const frames = loop ? Math.round(loop * (job.fps ?? 1)) : 1;
  for (let i = 0; i < frames; i++) {
    if (loop) await page.evaluate((t) => (window as unknown as { renderAt: (t: number) => void }).renderAt(t), i / (job.fps ?? 1));
    await el.screenshot({ path: join(tmp, `f${String(i).padStart(3, '0')}.png`), omitBackground: true });
  }
  const out = join(outDir, `${job.name}.webp`);
  const args = frames > 1
    ? ['-framerate', String(job.fps), '-i', join(tmp, 'f%03d.png'), '-c:v', 'libwebp_anim', '-quality', '76', '-compression_level', '6', '-loop', '0', '-pix_fmt', 'yuva420p']
    : ['-i', join(tmp, 'f000.png'), '-quality', '86', '-compression_level', '6'];
  execFileSync('ffmpeg', ['-v', 'error', '-y', ...args, out]);
  console.log(`${job.name}: ${frames} frame${frames > 1 ? 's' : ''}`);
}

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=d3d11', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: DPR });
  page.on('console', (m) => m.type() === 'error' && console.error(`[page] ${m.text()}`));
  for (const job of jobs) await capture(page, job);
} finally {
  await browser.close();
  server.close();
}
