import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const root='http://127.0.0.1:4354/devotional/';
const manifest=JSON.parse(await readFile('data/reader-books/manifest.json','utf8'));
const book=JSON.parse(await readFile('data/reader-books/bhagavad-gita.json','utf8'));
const first=book.chapters[0].passages[0],second=book.chapters[0].passages[1];
const sourceHash=value=>createHash('sha256').update(value).digest('hex');
const sourceSha256=manifest.outputs['bhagavad-gita.json'];
const sample='परीक्षण-केवल अनुवाद: धृतराष्ट्र ने संजय से पूछा।';
const path='assets/reader-translations/bhagavad-gita/hi.json';
const index={schema:1,books:{'bhagavad-gita':{languages:{
  hi:{path,sourceSha256,reviewedPassages:1,totalPassages:701}
}}}};
const pack={schema:1,book:'bhagavad-gita',language:'hi',status:'reviewed',sourceSha256,
  review:{reviewer:'SYNTHETIC TEST ONLY',reviewedOn:'2026-11-05',
    evidence:'https://example.test/test',rightsNote:'Synthetic test'},
  translations:{[first.id]:{sourceSha256:sourceHash(first.text),text:sample}}
};
const englishSample='Synthetic English fixture: Dhritarashtra asked Sanjaya.';
const englishPack={...pack,language:'en',translations:{
  [first.id]:{sourceSha256:sourceHash(first.text),text:englishSample}
}};
index.books['bhagavad-gita'].languages.en={
  path:'assets/reader-translations/bhagavad-gita/en.json',sourceSha256,
  reviewedPassages:1,totalPassages:701
};
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{
  env:{...process.env,HDC_PREVIEW_PORT:'4354'},stdio:['ignore','pipe','inherit']
});
await new Promise((resolve,reject)=>{
  server.stdout.once('data',resolve);server.once('error',reject);
});
const browser=await chromium.launch({
  ...(process.env.PANCHANG_BROWSER?{executablePath:process.env.PANCHANG_BROWSER}:{})
});
try {
  for(const width of [320,1440]) {
    const context=await browser.newContext({viewport:{width,height:940},serviceWorkers:'block'});
    const page=await context.newPage(),errors=[],packRequests=[];
    page.on('pageerror',error=>errors.push(error.message));
    await context.route('**/assets/reader-translations/index.json',route=>
      route.fulfill({contentType:'application/json',body:JSON.stringify(index)}));
    await context.route('**/assets/reader-translations/bhagavad-gita/hi.json',route=>{
      packRequests.push(route.request().url());
      return route.fulfill({contentType:'application/json',body:JSON.stringify(pack)});
    });
    await context.route('**/assets/reader-translations/bhagavad-gita/en.json',route=>
      route.fulfill({contentType:'application/json',body:JSON.stringify(englishPack)}));
    await page.goto(root+'reader/bhagavad-gita/chapter-1/#gita-1-1');
    await page.waitForFunction(()=>window.abpI18n&&document.querySelector('.abp-language-btn:not(:disabled)'));
    const original=await page.locator('#gita-1-1 .hdc-verse').innerText();
    assert.equal(await page.locator('#gita-1-1 .hdc-verse').getAttribute('translate'),'no');
    await page.waitForFunction(()=>document.querySelector('#gita-1-1 [data-reader-translation-text]')?.textContent==='Synthetic English fixture: Dhritarashtra asked Sanjaya.');
    assert.equal(await page.locator('#gita-1-1 [data-reader-translation-text]').getAttribute('lang'),'en');
    await page.evaluate(()=>window.abpI18n.applyLanguage('hi'));
    await page.waitForFunction(()=>!document.querySelector('#gita-1-1 [data-reader-translation]').hidden);
    assert.equal(await page.locator('#gita-1-1 [data-reader-translation-text]').innerText(),sample);
    assert.equal(await page.locator('#gita-1-1 [data-reader-translation] summary').innerText(),await page.evaluate(()=>window.abpI18n.t('readerTranslationTitle')));
    assert.equal(await page.locator('#gita-1-1 [data-reader-translation-text]').getAttribute('lang'),'hi');
    assert.equal(await page.locator('#gita-1-2 [data-reader-translation]').isVisible(),false);
    assert.equal(await page.locator('#gita-1-1 .hdc-verse').innerText(),original);
    await page.locator('[data-reader-options] > summary').click();
    await page.locator('[data-reader-query]').fill('परीक्षण-केवल');
    assert.equal(await page.locator('#gita-1-1').isVisible(),true);
    assert.equal(await page.locator('#gita-1-2').isVisible(),false);
    await page.locator('[data-reader-query]').fill('');
    await page.evaluate(()=>window.abpI18n.applyLanguage('mr'));
    await page.waitForFunction(()=>document.querySelector('[data-reader-translation-status]')?.textContent===window.abpI18n?.t('readerMissing'));
    assert.equal(await page.locator('#gita-1-1 [data-reader-translation]').isVisible(),false);
    await page.evaluate(()=>window.abpI18n.applyLanguage('hi'));
    await page.waitForFunction(()=>!document.querySelector('#gita-1-1 [data-reader-translation]').hidden);
    assert.equal(packRequests.length,1,'one selected pack, reused across language switches');
    await page.evaluate(()=>window.abpI18n.applyLanguage('en'));
    await page.waitForFunction(()=>document.querySelector('#gita-1-1 [data-reader-translation-text]')?.textContent==='Synthetic English fixture: Dhritarashtra asked Sanjaya.');
    assert.equal(await page.locator('#gita-1-1 [data-reader-translation-text]').innerText(),englishSample);
    assert.equal(await page.locator('#gita-1-1 [data-reader-translation-text]').getAttribute('lang'),'en');
    assert.equal(await page.locator('#gita-1-2 [data-reader-translation]').isVisible(),false);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.equal(await page.locator('#gita-1-1 .hdc-verse').innerText(),original);
    assert.deepEqual(errors,[]);
    await context.close();
  }
  const bad=await browser.newContext({serviceWorkers:'block'}),p=await bad.newPage();
  await bad.route('**/assets/reader-translations/index.json',route=>
    route.fulfill({contentType:'application/json',body:JSON.stringify(index)}));
  await bad.route('**/assets/reader-translations/bhagavad-gita/hi.json',route=>
    route.fulfill({contentType:'application/json',body:JSON.stringify({
      ...pack,sourceSha256:'0'.repeat(64)
    })}));
  await p.goto(root+'reader/bhagavad-gita/chapter-1/');
  await p.waitForFunction(()=>window.abpI18n&&document.querySelector('.abp-language-btn:not(:disabled)'));
  await p.evaluate(()=>window.abpI18n.applyLanguage('hi'));
  await p.waitForFunction(()=>document.querySelector('[data-reader-translation-status]')?.textContent===window.abpI18n?.t('readerError'));
  assert.equal(await p.locator('[data-reader-translation]:visible').count(),0);
  await bad.close();
  console.log('PASS Reader translated passages: Hindi and English packs, protected originals, missing-language fallback, exact source hashes, search, 320/1440px and language restoration');
} finally {
  await browser.close();
  server.kill();
}
