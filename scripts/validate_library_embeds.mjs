// Opt-in live provider audit; no translations are downloaded into the website.
// Run: node scripts/validate_library_embeds.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { chromium } from 'playwright';

const sources = [
  ['Valmiki index', 'https://www.valmikiramayan.net/', /Bala|Baala/i],
  ['Valmiki English chapter', 'https://www.valmikiramayan.net/baala/sarga1/bala_1_prose.htm', /Narada/i],
  ['Devi Mahatmya', 'https://sanskritdocuments.org/doc_devii/durga700.html', /दुर्गा|सप्तशती/],
  ['Kena Upanishad', 'https://sanskritdocuments.org/doc_upanishhat/kena.html', /केनोपनिषत्|केनेषितं/],
];
const server = createServer((req, res) => res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><html lang="en"><title>Cross-origin reader audit</title><body><h1>Reader audit</h1></body></html>'));
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({ ...(process.env.PANCHANG_BROWSER ? { executablePath: process.env.PANCHANG_BROWSER } : {}) });
try {
  const page = await browser.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}/devotional/`);
  for (const [name, url, text] of sources) {
    await page.evaluate(url => {
      document.querySelector('iframe')?.remove();
      const frame = document.createElement('iframe');
      frame.title = 'External reader';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
      frame.referrerPolicy = 'no-referrer';
      frame.src = url;
      document.body.append(frame);
    }, url);
    const frame = page.frameLocator('iframe');
    await frame.locator('body').filter({ hasText: text }).waitFor({ timeout: 45000 });
    assert.match(await frame.locator('body').innerText(), text);
    console.log(`PASS actual framed content: ${name} — ${url}`);
  }
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
