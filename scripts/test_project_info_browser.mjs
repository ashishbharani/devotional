import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const site = path.resolve('site');
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/devotional/')) return res.writeHead(404).end();
    let file = path.resolve(site, decodeURIComponent(url.pathname.slice(12)));
    if (!file.startsWith(site + path.sep) && file !== site) return res.writeHead(403).end();
    if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.pdf': 'application/pdf' };
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/devotional/`;
const browser = await chromium.launch();
const shots = process.env.PROJECT_SCREENSHOTS;
if (shots) await mkdir(shots, { recursive: true });
const checkContrast = async page => {
  const failures = await page.evaluate(() => {
    const rgb = color => color.startsWith('#')
      ? (color.length === 4 ? [...color.slice(1)].map(x => x + x).join('') : color.slice(1)).match(/../g).map(x => parseInt(x, 16))
      : color.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = color => rgb(color).map(x => {
      x /= 255;
      return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
    }).reduce((sum, x, i) => sum + x * [.2126, .7152, .0722][i], 0);
    const backgrounds = ['--abp-paper', '--abp-paper-2'].map(key => luminance(getComputedStyle(document.body).getPropertyValue(key).trim()));
    return [...document.querySelectorAll('.abp-project-info h1, .abp-project-info h2, .abp-project-info h3, .abp-project-info p, .abp-project-info a, .abp-project-footer a')].flatMap(el => {
      const foreground = luminance(getComputedStyle(el).color);
      const ratio = Math.min(...backgrounds.map(bg => (Math.max(foreground, bg) + .05) / (Math.min(foreground, bg) + .05)));
      return ratio < 4.5 ? [{ text: el.textContent.slice(0, 50), ratio }] : [];
    });
  });
  assert.deepEqual(failures, [], 'official-page text meets 4.5:1 on both theme surfaces');
};
try {
  for (const width of [320, 768, 1440]) {
    for (const scheme of ['abp-light', 'abp-dark']) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
      for (const route of ['foreword', 'about', 'contribution', 'disclaimer']) {
        await page.goto(base + route + '/');
        await page.locator('body').evaluate((el, value) => el.setAttribute('data-md-color-scheme', value), scheme);
        assert.equal(await page.locator('main h1').count(), 1);
        assert.equal(await page.locator('iframe').count(), 0);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${route} ${width}: overflow`);
        const pdf = page.locator('.abp-project-info a.abp-pdf-link').first();
        assert.equal(await pdf.getAttribute('target'), '_blank');
        assert.match(new URL(await pdf.evaluate(a => a.href)).pathname, /^\/devotional\/assets\/pdfs\//);
        assert.equal((await context.request.get(await pdf.evaluate(a => a.href))).status(), 200);
        await pdf.focus();
        assert.notEqual(await pdf.evaluate(el => getComputedStyle(el).outlineStyle), 'none', 'visible keyboard focus');
        assert.ok((await pdf.boundingBox()).height >= 44);
        assert.equal(await page.locator('.abp-project-footer a').count(), 4);
        assert.match(await page.locator('.md-copyright').textContent(), /Ashish Bharani/);
        assert.equal(await page.locator('.abp-pager__n.is-disabled').count(), 0, 'reading-order pager retained');
        await checkContrast(page);
        if (shots) await page.screenshot({ path: path.join(shots, `${route}-${scheme}-${width}.png`), fullPage: true });
        await page.locator('html').evaluate(el => el.classList.add('abp-hc'));
        await checkContrast(page);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      }
      await page.goto(base);
      if (shots && scheme === 'abp-light' && width !== 768) {
        // Homepage source is otherwise unchanged. Hide only the new footer for a before/after comparison.
        await page.locator('.abp-project-footer').evaluate(el => { el.hidden = true; el.style.display = 'none'; });
        await page.screenshot({ path: path.join(shots, `home-footer-before-${width}.png`), fullPage: true });
        await page.locator('.abp-project-footer').evaluate(el => { el.hidden = false; el.style.removeProperty('display'); });
        await page.screenshot({ path: path.join(shots, `home-footer-after-${width}.png`), fullPage: true });
      }
      if (width < 1200) await page.locator('.abp-menu-toggle').click();
      await page.locator('.abp-navigation__section').last().click();
      const aboutLinks = page.locator('#abp-navigation .abp-navigation__submenu').last().locator('a');
      assert.deepEqual((await aboutLinks.allTextContents()).map(s => s.trim()), ['Foreword', 'About Me', 'Contribution', 'Disclaimer & Terms', 'Legend', 'Reconciliation Rules']);
      await aboutLinks.filter({ hasText: /^About Me$/ }).click();
      await page.waitForURL(base + 'about/');
      await page.locator('.abp-project-footer').getByRole('link', { name: 'Contribution', exact: true }).click();
      await page.waitForURL(base + 'contribution/');
      await page.locator('.abp-project-footer').getByRole('link', { name: 'Disclaimer & Terms', exact: true }).click();
      await page.waitForURL(base + 'disclaimer/');
      assert.equal(await page.locator('main h1').textContent(), 'Disclaimer & Terms');
      assert.deepEqual(errors, [], `${width} ${scheme}: runtime errors`);
      await context.close();
      console.log(`PASS official pages ${width}px ${scheme}: PDFs, headings, focus, footer, ABOUT, instant navigation`);
    }
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
