import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const site = path.resolve('site');
const before = Boolean(process.env.LIBRARY_BEFORE);
const shots = 'work/library-reader';
const english = 'https://www.valmikiramayan.net/';
const hindi = 'https://bharatkosha.org/hi/granth/shrimad-valmiki-ramayana-gita-press';
const supported = [english, 'https://sanskritdocuments.org/doc_devii/durga700.html', 'https://sanskritdocuments.org/doc_upanishhat/kena.html'];
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/devotional/')) return res.writeHead(404).end();
    let file = path.resolve(site, decodeURIComponent(url.pathname.slice(12)));
    if (file !== site && !file.startsWith(site + path.sep)) return res.writeHead(403).end();
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.wasm': 'application/wasm' })[path.extname(file)] || 'application/octet-stream' }).end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/devotional/`;
const browser = await chromium.launch({ ...(process.env.PANCHANG_BROWSER ? { executablePath: process.env.PANCHANG_BROWSER } : {}) });
await mkdir(shots, { recursive: true });
try {
  for (const width of [320, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const external = [];
    await context.route('https://**/*', route => {
      const url = route.request().url();
      if (supported.includes(url) || url === hindi || url.startsWith('https://www.youtube.com/results?') || url.startsWith('https://www.gitasupersite.in/')) {
        external.push(url);
        return route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1>Mock reader - live framing is checked separately</h1>' });
      }
      return route.abort();
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const route of ['', 'library/']) {
      external.length = 0;
      await page.goto(base + route);
      if (!route) await page.locator('.abp-home-library > summary').click();
      const card = page.locator('.abp-book').filter({ has: page.getByRole('heading', { name: 'Valmiki Ramayana', exact: true }) });
      const name = `${route ? 'library' : 'home'}-${width}`;
      await card.screenshot({ path: `${shots}/${before ? 'before' : 'after'}-${name}.png` });
      if (before) continue;
      assert.equal(await card.count(), 1);
      assert.equal(await card.locator('a').count(), 4, 'no duplicate card or language button');
      assert.deepEqual(external, [], 'no book provider contacted before explicit click');
      assert.equal(await page.locator('iframe').count(), 0);
      for (const url of supported) {
        const link = page.locator(`a[data-book-reader][href="${url}"]`).first();
        await link.focus(); await page.keyboard.press('Enter');
        // Material's search also has role=dialog; scope to our native dialog.
        const panel = page.locator('dialog.abp-library-reader');
        assert.equal(await panel.count(), 1);
        assert.ok(await panel.isVisible());
        assert.match(await link.getAttribute('aria-label'), /in-page reader/);
        const frame = panel.locator('iframe');
        assert.equal(await frame.getAttribute('src'), url);
        assert.match(await frame.getAttribute('title'), /External book reader/);
        assert.equal(await frame.getAttribute('sandbox'), 'allow-scripts allow-same-origin allow-forms');
        assert.equal(await frame.getAttribute('referrerpolicy'), 'no-referrer');
        await page.frameLocator('.abp-library-reader iframe').getByRole('heading').waitFor();
        const fallback = panel.getByRole('link', { name: /Open original website/ });
        assert.equal(await fallback.getAttribute('href'), url);
        assert.equal(await fallback.getAttribute('rel'), 'noopener noreferrer');
        const popupPromise = page.waitForEvent('popup'); await fallback.click();
        const popup = await popupPromise; await popup.waitForLoadState();
        assert.equal(popup.url(), url); await popup.close();
        assert.match(await panel.innerText(), /cannot detect all external loading failures/);
        await panel.getByRole('button', { name: 'Close reader' }).focus();
        for (let n = 0; n < 5; n++) {
          await page.keyboard.press('Tab');
          // Native dialogs keep the background inert, while browsers may still
          // let Tab reach browser chrome (reported as body, not a page control).
          assert.ok(await panel.evaluate(el => el.matches(':modal') && (el.contains(document.activeElement) || document.activeElement === document.body)), 'keyboard cannot reach background page controls');
        }
        const bounds = await panel.boundingBox();
        assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width + 1);
        assert.ok(await panel.evaluate(el => el.scrollWidth <= el.clientWidth + 1));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
        if (url === english) await panel.screenshot({ path: `${shots}/reader-${name}.png` });
        if (url === english && route && width === 1440) {
          for (const mode of ['dark', 'high-contrast']) {
            await page.evaluate(mode => {
              document.body.setAttribute('data-md-color-scheme', mode === 'dark' ? 'abp-dark' : 'abp-light');
              document.documentElement.classList.toggle('abp-hc', mode === 'high-contrast');
            }, mode);
            assert.ok(await panel.getByRole('button', { name: 'Close reader' }).isVisible());
            await panel.screenshot({ path: `${shots}/reader-${mode}.png` });
          }
          await page.evaluate(() => document.documentElement.classList.remove('abp-hc'));
        }
        await panel.getByRole('button', { name: 'Close reader' }).focus();
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('dialog.abp-library-reader').count(), 0);
        assert.equal(await page.locator('iframe').count(), 0, 'close stops embedded content');
        assert.ok(await link.evaluate(el => el === document.activeElement), 'focus returns to opener');
      }
      for (const label of ['HINDI', 'LISTEN']) {
        const link = card.locator('a').filter({ hasText: new RegExp(`^${label}$`) });
        assert.equal(await link.getAttribute('data-book-reader'), null);
        const popupPromise = page.waitForEvent('popup'); await link.click();
        const popup = await popupPromise; await popup.waitForLoadState();
        assert.equal(popup.url(), label === 'HINDI' ? hindi : 'https://www.youtube.com/results?search_query=Valmiki+Ramayana+recitation');
        await popup.close();
      }
      // A future provider restriction/network failure must not remove escape routes.
      await context.route(english, r => r.abort());
      await card.locator('[data-book-reader]').first().click();
      assert.ok(await page.getByRole('link', { name: /Open original website/ }).isVisible());
      await page.getByRole('button', { name: 'Close reader' }).click();
      assert.equal(await page.locator('dialog.abp-library-reader').count(), 0);
      await context.unroute(english);
      console.log(`PASS ${name}: three framed sources, no eager requests, safe fallback, blocked Hindi/Listen external, keyboard/focus, failed source and no overflow`);
    }
    if (!before) {
      await page.goto(base);
      await page.locator('a[href="library/"]:visible, a[href$="/library/"]:visible').first().click();
      await page.locator('[data-book-reader][data-reader-ready]').first().waitFor();
      await page.locator('[data-book-reader]').first().click();
      assert.equal(await page.locator('dialog.abp-library-reader').count(), 1, 'instant navigation initializes once');
      await page.goBack();
      await page.locator('.abp-home-library').waitFor();
      assert.equal(await page.locator('dialog.abp-library-reader').count(), 0, 'instant navigation removes stale reader');
      assert.deepEqual(errors, []);
    }
    await context.close();
  }
  if (!before) {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage(); await page.goto(base + 'library/');
    assert.equal(await page.locator('[data-book-reader]').first().getAttribute('href'), english);
    assert.equal(await page.locator('[data-book-reader]').first().getAttribute('target'), '_blank');
    assert.equal(await page.locator('iframe').count(), 0);
    await context.close();
    console.log('PASS JavaScript-disabled external link fallback');
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
