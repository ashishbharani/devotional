import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const site = path.resolve('site');
const baseline = process.env.SEARCH_BASELINE_SITE ? path.resolve(process.env.SEARCH_BASELINE_SITE) : null;
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const prefix = baseline && url.pathname.startsWith('/baseline/') ? '/baseline/' : '/devotional/';
    if (!url.pathname.startsWith(prefix)) return res.writeHead(404).end();
    const root = prefix === '/baseline/' ? baseline : site;
    let file = path.resolve(root, decodeURIComponent(url.pathname.slice(prefix.length)));
    if (!file.startsWith(root + path.sep) && file !== root) return res.writeHead(403).end();
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/devotional/`;
const browser = await chromium.launch();
const screenshots = process.env.SEARCH_SCREENSHOTS;
if (screenshots) await mkdir(screenshots, { recursive: true });
try {
  for (const width of [320, 768, 1440]) for (const scheme of ['abp-light', 'abp-dark']) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [], indexes = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => { if (/assets\/(works-index|universal-search)\.json$/.test(r.url())) indexes.push(r.url()); });
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
    await page.goto(base + 'find/?w=bake+bihari');
    await page.locator('body').evaluate((el, value) => el.setAttribute('data-md-color-scheme', value), scheme);
    await page.waitForFunction(() => document.querySelector('#abp-results tr')?.textContent, { timeout: 30000 });
    assert.match(await page.locator('#abp-search-identities').textContent(), /Banke Bihari/);
    assert.match(await page.locator('#abp-search-related').textContent(), /Krishna/);
    assert.ok(await page.locator('#abp-results tr').count() > 0);
    assert.equal(await page.locator('main h1').count(), 1);
    if (screenshots && scheme === 'abp-light' && width !== 768) {
      await page.screenshot({ path: path.join(screenshots, `finder-after-${width}.png`) });
      if (baseline) {
        const before = await context.newPage();
        await before.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
        await before.goto(base.replace('/devotional/', '/baseline/') + 'find/?w=bake+bihari');
        await before.locator('body').evaluate(el => el.setAttribute('data-md-color-scheme', 'abp-light'));
        await before.waitForFunction(() => {
          const status = document.querySelector('#abp-status');
          return status && !/Loading/.test(status.textContent);
        });
        await before.screenshot({ path: path.join(screenshots, `finder-before-${width}.png`) });
        await before.close();
      }
    }
    const input = page.locator('#abp-q');
    await input.fill('शिव कवच'); await input.press('Enter');
    await page.waitForFunction(() => document.querySelector('#abp-search-identities')?.textContent.includes('Shiva'));
    assert.ok(await page.locator('#abp-results tr').count());
    assert.match(page.url(), /w=/);
    await input.fill('Balaji'); await input.press('Enter');
    await page.waitForFunction(() => document.querySelector('#abp-search-identities')?.textContent.includes('disambiguate'));
    assert.match(await page.locator('#abp-search-identities').textContent(), /Venkateswara/);
    assert.match(await page.locator('#abp-search-identities').textContent(), /Mehandipur/);
    await page.goBack();
    await page.waitForFunction(() => document.querySelector('#abp-q')?.value === 'शिव कवच');
    await input.fill('Krishna'); await input.press('Enter');
    await page.waitForFunction(() => document.querySelector('#abp-search-identities')?.textContent.includes('Krishna'));
    await page.locator('#abp-results mark').first().waitFor();
    const initial = await page.locator('#abp-results tr').count();
    await page.locator('#abp-more').click();
    assert.ok(await page.locator('#abp-results tr').count() > initial);
    await input.fill('bake bi');
    await page.locator('#abp-suggestions button').filter({ hasText: /Banke Bihari/ }).waitFor();
    const suggestionButton = page.locator('#abp-suggestions button').filter({ hasText: /Banke Bihari/ }).first();
    await page.keyboard.press('Tab'); // Enter keyboard modality after the pointer-driven pagination click.
    await suggestionButton.focus();
    assert.notEqual(await suggestionButton.evaluate(el => getComputedStyle(el).outlineStyle), 'none');
    await page.locator('#abp-suggestions button').filter({ hasText: /Banke Bihari/ }).first().click();
    await page.waitForFunction(() => document.querySelector('#abp-q')?.value === 'Banke Bihari');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    const link = page.locator('#abp-results .where a').first();
    assert.ok(new URL(await link.getAttribute('href')).pathname.startsWith('/devotional/categories/'));
    assert.equal((await context.request.get(await link.getAttribute('href'))).status(), 200);
    assert.equal(indexes.length, 2, 'indexes loaded once across queries');
    if (screenshots) await page.screenshot({ path: path.join(screenshots, `find-${scheme}-${width}.png`), fullPage: true });
    await input.fill('<script>alert("xss")</script>'); await input.press('Enter');
    await page.waitForTimeout(250);
    assert.equal(await page.locator('#abp-results script').count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS universal search browser: ${width}px ${scheme}, worker, aliases, native script, history, pagination, suggestions, safe links`);
  }
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  await page.goto(base + 'find/');
  await page.locator('#abp-q').fill('Hanuman Chalisa');
  await page.waitForFunction(() => document.querySelectorAll('#abp-results tr').length > 0);
  assert.equal(await page.locator('#abp-q').inputValue(), 'Hanuman Chalisa', 'early input survives cold worker startup');
  await page.goto(base + 'find/?w=Hanuman&language=UnpublishedLanguage');
  await page.waitForFunction(() => document.querySelector('#abp-lang')?.selectedOptions[0]?.textContent.includes('Unavailable'));
  await page.waitForFunction(() => /^0 works/.test(document.querySelector('#abp-status')?.textContent || ''));
  assert.equal(await page.locator('#abp-results tr').count(), 0, 'unknown URL filters never silently become all languages');
  await page.goto(base);
  await page.locator('[data-universal-search-form] input').fill('Bajrangbali');
  await page.locator('[data-universal-search-form] button').click();
  await page.waitForURL(/find\/\?w=Bajrangbali/);
  await page.waitForFunction(() => document.querySelector('#abp-search-identities')?.textContent.includes('Hanuman'));
  await page.goto(base + 'a-z/');
  await page.locator('[data-universal-search-form] input').fill('Pillaiyar');
  await page.locator('[data-universal-search-form] button').click();
  await page.waitForFunction(() => document.querySelector('#abp-search-identities')?.textContent.includes('Ganesha'));
  await context.close();
  console.log('PASS homepage and A–Z use the same canonical search engine');
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
