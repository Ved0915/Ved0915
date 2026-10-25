// Captures the first screen of each live project into assets/shots/<slug>.webp, one site at a time.
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { projects } from '../data.ts';

const root = fileURLToPath(new URL('../..', import.meta.url));
const out = join(root, 'assets', 'shots');
const only = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36';
const HIDE_BANNERS = `[id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],[aria-label*="cookie" i],#onetrust-banner-sdk{display:none!important}`;

// ORIGIN_IP (local env only, never committed: it lets anyone skip the CDN) loads our sites straight from the server,
// for when the CDN has blocked this PC after a burst of page loads.
const ORIGIN = process.env.ORIGIN_IP;
const publicProjects = projects.filter((p): p is typeof p & { url: string } => Boolean(p.url));
const originHosts = publicProjects.filter((p) => p.slug !== 'radiocode').flatMap((p) => [new URL(p.url).hostname, new URL(p.url).hostname.replace(/^www\./, '')]);
const args = ORIGIN ? [`--host-resolver-rules=${[...new Set(originHosts)].map((h) => `MAP ${h} ${ORIGIN}`).join(',')}`] : [];
const browser = await chromium.launch({ channel: 'chromium', args });
try {
  for (const p of publicProjects.filter((pr) => !only.length || only.includes(pr.slug))) {
    // Hostinger's CDN closes connections from the HeadlessChrome user agent; these are our own sites.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, userAgent: UA });
    try {
      await page.goto(p.url, { waitUntil: 'load', timeout: 45000 });
      await page.addStyleTag({ content: HIDE_BANNERS });
      await page.waitForTimeout(3500);
      const png = join(out, `${p.slug}.png`);
      await page.screenshot({ path: png });
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-quality', '84', join(out, `${p.slug}.webp`)]);
      rmSync(png);
      console.log(`ok ${p.slug}`);
    } catch (e) {
      console.error(`fail ${p.slug}: ${(e as Error).message.split('\n')[0]}`);
    } finally {
      await page.close();
    }
  }
} finally {
  await browser.close();
}
