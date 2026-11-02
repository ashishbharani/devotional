import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const catalogue=JSON.parse(await readFile('docs/assets/i18n.json','utf8'));
const languages=['hi','mr','gu','bn','pa','te','kn','ml','ta','en'];
const base='http://127.0.0.1:4328/devotional/';
const preview=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4328'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{preview.stdout.once('data',resolve);preview.once('error',reject);});
const browser=await chromium.launch({...(process.env.PANCHANG_BROWSER?{executablePath:process.env.PANCHANG_BROWSER}:{})});
try {
 await mkdir('work/translation-browser',{recursive:true});
 for(const width of [320,768,1440]) {
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[],providerRequests=[];
  page.on('pageerror',e=>errors.push(e.message));
  context.on('request',r=>{if(/translate\.(google|googleapis|googleusercontent)\./.test(r.url()))providerRequests.push(r.url());});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await context.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  await context.addCookies([{name:'googtrans',value:'/en/hi',url:base},{name:'unrelated-cookie',value:'preserve',url:base}]);
  await context.addInitScript(()=>{localStorage.setItem('abp-google-translate-consent-v1','yes');localStorage.setItem('unrelated-preference','preserve');});
  await page.goto(base+'?test=preserve#preserve');
  await page.evaluate(()=>window.abpI18n.ready);
  const originalURL=page.url();
  const originalHomeLabel=await page.locator('#abp-navigation .abp-navigation__item > a').first().textContent().then(x=>x.trim());
  async function picker() {
   if(!await page.locator('.abp-language-btn').isVisible())await page.locator('.abp-menu-toggle').click();
   await page.locator('.abp-language-btn').click();
   await page.locator('.abp-language-dialog').waitFor();
  }
  const svgCount=await page.locator('#abp-navigation svg').count();
  for(const code of languages) {
   await picker();
   const dialog=page.locator('.abp-language-dialog');
   assert.equal(await dialog.locator('[data-lang]').count(),10);
   assert.equal(await dialog.locator('details,a,[data-enable-translation]').count(),0,'direct in-site choices only');
   await dialog.locator('[data-lang="'+code+'"]').click();
   assert.equal(await page.locator('html').getAttribute('lang'),code);
   assert.equal(page.url(),originalURL);
   assert.equal(context.pages().length,1);
   assert.equal(await page.evaluate(()=>localStorage.getItem('abp-language')),code);
   const expected=code==='en'?'Daily Darshan':catalogue.textTranslations['Daily Darshan'][code];
   assert.equal(await page.locator('#hdc-daily-title').textContent(),expected,'real local homepage translation');
   assert.equal(await page.locator('#abp-navigation .abp-navigation__item > a').first().textContent().then(x=>x.trim()),code==='en'?originalHomeLabel:await page.evaluate(()=>window.abpI18n.t('home')));
   assert.equal(await page.locator('#abp-navigation svg').count(),svgCount,'translation must preserve nav icons and child markup');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.evaluate(()=>{
   const fixture=document.createElement('section');fixture.id='translation-fixture';
   fixture.innerHTML='<p id="dynamic-translation">Moonrise</p><input value="Home" aria-label="Moonrise" placeholder="Location"><p contenteditable>Home</p><code>Moonrise</code><select><option>Home</option><option value="source-home">Home</option></select>';
   document.body.appendChild(fixture);
   window.abpI18n.applyLanguage('ta');
  });
  await page.waitForFunction(value=>document.querySelector('#dynamic-translation').textContent===value,catalogue.textTranslations.Moonrise.ta);
  await page.evaluate(()=>{document.querySelector('#dynamic-translation').firstChild.nodeValue='Moonset';});
  await page.waitForFunction(value=>document.querySelector('#dynamic-translation').textContent===value,catalogue.textTranslations.Moonset.ta);
  assert.equal(await page.locator('#translation-fixture input').inputValue(),'Home');
  assert.equal(await page.locator('#translation-fixture input').getAttribute('aria-label'),catalogue.textTranslations.Moonrise.ta);
  assert.equal(await page.locator('#translation-fixture input').getAttribute('placeholder'),catalogue.textTranslations.Location.ta);
  assert.equal(await page.locator('#translation-fixture select').inputValue(),'Home','implicit option values must stay unchanged');
  assert.equal(await page.locator('#translation-fixture option[value]').getAttribute('value'),'source-home');
  assert.equal(await page.locator('#translation-fixture [contenteditable]').textContent(),'Home');
  assert.equal(await page.locator('#translation-fixture code').textContent(),'Moonrise');
  await page.evaluate(()=>window.abpI18n.applyLanguage('en'));
  assert.equal(await page.locator('#dynamic-translation').textContent(),'Moonset','restore current source, not a stale earlier value');
  await page.evaluate(()=>document.querySelector('#translation-fixture').remove());
  for(const route of ['library/','about/','disclaimer/','panchang/']) {
   await page.goto(base+route);await page.evaluate(()=>window.abpI18n.ready);
   for(const code of languages) {
    await page.evaluate(code=>window.abpI18n.applyLanguage(code),code);
    assert.equal(await page.locator('html').getAttribute('lang'),code);
    assert.equal(await page.locator('.abp-language-btn').count(),1);
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  await page.evaluate(()=>window.abpI18n.applyLanguage('ta'));await page.reload();
  await page.evaluate(()=>window.abpI18n.ready);
  assert.equal(await page.locator('html').getAttribute('lang'),'ta');
  assert.equal(await page.evaluate(()=>localStorage.getItem('abp-google-translate-consent-v1')),null);
  assert.equal(await page.evaluate(()=>document.cookie.includes('googtrans=')),false);
  assert.match(await page.evaluate(()=>document.cookie),/unrelated-cookie=preserve/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-preference')),'preserve');
  assert.deepEqual(providerRequests,[],'no Google translation requests, even with previous consent');
  assert.equal(await page.locator('#google_translate_element,script[src*="abp-google-translate"],.goog-te-combo').count(),0);
  await page.evaluate(()=>window.abpI18n.applyLanguage('en'));
  await picker();await page.screenshot({path:'work/translation-browser/picker-'+width+'.png'});
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('PASS '+width+'px: ten local languages, real labels, dynamic text updates, original restoration, markup/privacy/storage, routes and no Google translator');
 }
 const unavailable=await browser.newContext({serviceWorkers:'block'});
 await unavailable.addInitScript(()=>localStorage.setItem('abp-language','ta'));
 await unavailable.route('**/assets/i18n.json',route=>route.abort());
 const failedPage=await unavailable.newPage();
 await failedPage.goto(base);await failedPage.evaluate(()=>window.abpI18n.ready);
 assert.equal(await failedPage.locator('.abp-language-btn').isDisabled(),true);
 assert.match(await failedPage.locator('.abp-language-btn').getAttribute('aria-label'),/catalogue unavailable/);
 assert.equal(await failedPage.locator('html').getAttribute('lang'),'en');
 assert.equal(await failedPage.evaluate(()=>localStorage.getItem('abp-language')),'ta','temporary failure must not overwrite saved preference');
 await unavailable.close();
 console.log('PASS unavailable catalogue: accessible disabled picker, English source fallback and saved preference retained');
} finally {await browser.close();preview.kill();}
