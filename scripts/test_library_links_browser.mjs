import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const site = path.resolve('site');
const readers = {
  OPEN: 'https://www.valmikiramayan.net/',
  ENGLISH: 'https://www.valmikiramayan.net/',
  HINDI: 'https://bharatkosha.org/hi/granth/shrimad-valmiki-ramayana-gita-press',
  LISTEN: 'https://www.youtube.com/results?search_query=Valmiki+Ramayana+recitation',
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/devotional/')) return res.writeHead(404).end();
    let file = path.resolve(site, decodeURIComponent(url.pathname.slice(12)));
    if (file !== site && !file.startsWith(site + path.sep)) return res.writeHead(403).end();
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' }).end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/devotional/`;
const browser = await chromium.launch({ headless: true, ...(process.env.PANCHANG_BROWSER ? { executablePath: process.env.PANCHANG_BROWSER } : {}) });
const shots = process.env.LIBRARY_SCREENSHOTS;
if (shots) await mkdir(shots, { recursive: true });
try {
  for (const width of [320, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    // Reader content was manually verified. CI checks destinations without
    // depending on third-party availability or signing into an external service.
    for (const destination of new Set(Object.values(readers))) await context.route(destination, route => route.fulfill({ contentType: 'text/html', body: '<h1>External destination test</h1>' }));
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['', 'library/']) {
      await page.goto(base + route);
      if (!route) await page.locator('.abp-home-library > summary').click();
      const card = page.locator('.abp-book').filter({ has: page.getByRole('heading', { name: 'Valmiki Ramayana', exact: true }) });
      assert.equal(await card.count(), 1);
      assert.equal(await card.locator('a').count(), 4);
      for (const [label, destination] of Object.entries(readers)) {
        const link = card.locator('a').filter({ hasText: new RegExp(`^${label}$`) });
        assert.equal(await link.getAttribute('href'), destination);
        assert.equal(await link.getAttribute('target'), '_blank');
        assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
        assert.match(await link.getAttribute('aria-label'), /Valmiki Ramayana.*opens in a new tab/);
        const popupPromise = page.waitForEvent('popup'); await link.click();
        const popup = await popupPromise; await popup.waitForLoadState(); assert.equal(popup.url(), destination); await popup.close();
        const box = await link.boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      if (shots) await card.screenshot({ path: path.join(shots, `${route ? 'library' : 'home'}-${width}.png`) });
      console.log(`PASS ${route || 'homepage'} ${width}px: one card, four named links, safe popups, preserved Listen, no overflow`);
    }
    assert.deepEqual(errors, []); await context.close();
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
