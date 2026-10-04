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
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png' };
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { console.error('Missing test asset:', req.url); res.writeHead(404).end('Not found'); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/devotional/`;
const browser = await chromium.launch();
const shots = process.env.NAV_SCREENSHOTS;
if (shots) await mkdir(shots, { recursive: true });
try {
  for (const width of [320,360,390,414,768,1024,1280,1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block', reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack));
    await page.route('https://fonts.googleapis.com/**', route => route.fulfill({contentType:'text/css',body:''}));
    await page.goto(base);
    const nav = page.locator('#abp-navigation');
    const sections = nav.locator('.abp-navigation__section');
    assert.deepEqual(await nav.locator('.abp-navigation__item > a, .abp-navigation__item > button').allTextContents().then(xs => xs.map(x => x.replace('▾','').trim())), ['HOME','TODAY PANCHANG','DEVOTIONAL WORKS','SCRIPTURES & BOOKS','TOOLS','ABOUT']);
    assert.equal(await nav.locator('a[href*="categories/"]').count(), 0);
    const mobile = width < 1200;
    if (mobile) {
      await page.locator('.abp-menu-toggle').click();
      assert.equal(await page.locator('html').evaluate(el => getComputedStyle(el).overflow), 'hidden');
      await nav.locator('.abp-menu-close').focus();
      await page.keyboard.press('Shift+Tab');
      assert.equal(await sections.last().evaluate(el => el === document.activeElement), true, 'drawer traps focus');
    }
    await sections.nth(1).click();
    assert.equal(await sections.nth(1).getAttribute('aria-expanded'), 'true');
    if (shots) await page.screenshot({path:path.join(shots, `navigation-menu-${width}.png`)});
    await sections.nth(0).click();
    assert.equal(await sections.nth(1).getAttribute('aria-expanded'), 'false');
    const box = await nav.locator('.abp-navigation__submenu:not([hidden])').boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
    await page.keyboard.press('Escape');
    if (mobile) {
      assert.equal(await page.locator('.abp-menu-toggle').getAttribute('aria-expanded'), 'false');
      await page.locator('.abp-menu-toggle').click();
      await page.locator('.abp-menu-shade').click({ position: { x: width - 5, y: 300 } });
      await page.locator('.abp-menu-toggle').click();
    }
    await sections.nth(1).focus();
    await page.keyboard.press('Enter');
    await nav.getByRole('link', { name: 'Browse All 42 Categories', exact: true }).click();
    await page.waitForURL(base + 'master-index/');
    assert.ok(await page.locator('main a[href*="categories/"]').count() >= 42);
    assert.equal(await nav.getByRole('link', {name:'HOME',exact:true,includeHidden:true}).getAttribute('aria-current'), null);
    assert.equal(await page.locator('html').evaluate(el => getComputedStyle(el).overflow === 'hidden'), false);
    await page.goBack();
    await page.waitForURL(base);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.evaluate(() => scrollTo(0, 500));
    assert.ok((await page.locator('.abp-navigation-shell').boundingBox()).y >= -1, 'sticky header remains onscreen');
    await page.evaluate(() => scrollTo(0, 0));
    if (shots) await page.screenshot({path:path.join(shots, `navigation-${width}.png`)});
    assert.deepEqual(errors, [], `${width}: no runtime errors`);
    await context.close();
    console.log(`PASS navigation ${width}px: keyboard, accordion, outside/ESC close, links, back, overflow`);
  }
  const page = await browser.newPage({ viewport: {width:1440,height:900} });
  await page.goto(base);
  for (const [section, label, route] of [[1,'Browse All 42 Categories','master-index/'], [0,'Today’s Panchang','panchang/'], [3,'Foreword','foreword/']]) {
    await page.locator('.abp-navigation__section').nth(section).click();
    await page.locator('#abp-navigation').getByRole('link', {name:label,exact:true}).click();
    await page.waitForURL(base + route);
    assert.equal(await page.locator('#abp-navigation').getByRole('link', {name:label,exact:true,includeHidden:true}).getAttribute('aria-current'), 'page');
  }
  await page.locator('#abp-navigation').getByRole('link', {name:'HOME',exact:true}).click();
  await page.waitForURL(base);
  const links = await page.locator('#abp-navigation a').evaluateAll(els => els.map(el => el.href));
  for (const link of new Set(links)) {
    assert.ok(link.startsWith(base));
    const response = await page.goto(link);
    assert.equal(response.status(), 200, link);
    await page.reload();
    assert.equal(await page.locator('#abp-navigation [aria-current="page"]').count() >= 1, true, link);
  }
  await page.goto(base + 'master-index/');
  const categories = await page.locator('main a[href*="categories/"]').evaluateAll(els => [...new Set(els.map(el => el.href))]);
  assert.equal(categories.length, 42);
  for (const link of categories) assert.equal((await page.request.get(link)).status(), 200);
  for (const link of [categories[0],categories[20],categories[41]]) {
    await page.goto(link);
    assert.equal(await page.locator('.abp-crumbs').count(), 1);
    assert.ok(await page.locator('.abp-navigation__item.is-active').innerText().then(x => x.includes('DEVOTIONAL WORKS')));
  }
  await page.goto(base + 'find/');
  await page.locator('#abp-q').fill('Hanuman Chalisa');
  await page.waitForFunction(() => document.querySelectorAll('#abp-results tr').length > 0);
  assert.ok((await page.locator('#abp-results').innerText()).includes('Hanuman Chalisa'));
  await page.goto(base);
  await page.locator('.md-search__input').fill('Hanuman');
  await page.waitForFunction(() => document.querySelectorAll('.md-search-result__item').length > 0);
  console.log('PASS all navigation routes, nested refresh, active states, 42 category links, work and global search');
  const places = JSON.parse(await readFile(path.join(site, 'assets/works-index.json'), 'utf8')).places;
  const first = places[0][0], last = places.at(-1)[0];
  const middle = places.find((entry, i) => i && entry[0].split('#')[0] === places[i - 1][0].split('#')[0]);
  const boundary = places.find((entry, i) => i && entry[1] !== places[i - 1][1]);
  for (const target of [first, middle[0], boundary[0], last]) {
    await page.goto(base + target);
    for (const refresh of [false, true]) {
      if (refresh) await page.reload();
      const pager = page.locator('.abp-pager[data-sections]');
      await pager.waitFor();
      const sections = JSON.parse(await pager.getAttribute('data-sections'));
      const current = sections.find(section => section.anchor === target.split('#')[1]);
      for (const [selector, key] of [['.abp-pager__p','previous'], ['.abp-pager__n','next']]) {
        const button = pager.locator(selector);
        if (current[key]) await assertEventuallyHref(button, '/devotional/' + current[key]);
        else assert.equal(await button.getAttribute('aria-disabled'), 'true');
      }
      assert.equal(await pager.locator('.abp-btn').count(), 4);
    }
  }
  await page.goto(base + middle[0]);
  const nextHref = await page.locator('.abp-pager__n').getAttribute('href');
  await page.locator('.abp-pager__n').click();
  await page.waitForURL('**' + nextHref);
  await assertEventuallyHref(page.locator('.abp-pager__p'), '/devotional/' + middle[0]);
  console.log('PASS canonical pager: direct entry, refresh, anchor click, category boundary, endpoints');
  for (const width of [320, 1440]) {
    await page.setViewportSize({width, height: 900});
    await page.locator('.abp-pager').scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    if (shots) await page.screenshot({path:path.join(shots, `section-pager-${width}.png`)});
  }
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}

async function assertEventuallyHref(control, expected) {
  await control.page().waitForFunction(({selector, expected}) => document.querySelector(selector)?.getAttribute('href') === expected,
    {selector: '.abp-pager ' + (await control.getAttribute('class')).split(' ').find(x => x.startsWith('abp-pager__')).replace(/^/, '.'), expected});
  assert.equal(await control.getAttribute('href'), expected);
}
