import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4335'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4335/devotional/';
await mkdir('work/festival-preview',{recursive:true});
try{
 for(const width of [320,375,768,1024,1440])for(const theme of ['abp-light','abp-dark']){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('[data-festival-status]')?.textContent.includes('Original theme retained'));
  await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  assert.equal(await page.locator('[data-festival-display]').isVisible(),false,'no invented automatic dates');
  await page.locator('.hdc-festival summary').click();await page.locator('[data-festival-mode]').selectOption('ganesha');
  assert.match(await page.locator('[data-festival-note]').textContent(),/not a festival date/);
  await page.waitForFunction(()=>document.querySelector('[data-festival-image]').naturalWidth>0);
  assert.match(await page.locator('[data-festival-image]').getAttribute('src'),/ganesha-640.webp$/);
  await page.locator('[data-festival-effects]').check();
  assert.equal(await page.locator('.hdc-festival details').evaluate(el=>getComputedStyle(el).backgroundColor===getComputedStyle(el.closest('.hdc-festival')).backgroundColor),true,'settings panel uses the same sacred theme surface');
  assert.equal(await page.locator('[data-festival-display]').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.match(await page.locator('.udhc-hero-art img').getAttribute('src'),/temple-ghat-hero.webp$/);
  await page.locator('[data-festival-experience]').screenshot({path:`work/festival-preview/${width}-${theme}.png`});
  await page.reload();await page.waitForFunction(()=>document.querySelector('[data-festival-title]')?.textContent==='Ganesha design preview');
  await page.locator('.hdc-festival summary').click();await page.locator('[data-festival-mode]').selectOption('shiva');
  assert.match(await page.locator('[data-festival-image]').getAttribute('src'),/shiva-640.webp$/);
  const url=await page.locator('[data-festival-link]').getAttribute('href');assert.equal((await page.request.get(url)).status(),200);
  await page.locator('[data-festival-mode]').selectOption('original');assert.equal(await page.locator('[data-festival-display]').isVisible(),false);
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS festival preview ${width}px ${theme}`);
 }
 // Deliberately fictional scheduling evidence: injected only inside this test.
 const event={id:'synthetic',name:'Synthetic test, not a real festival',theme:'ganesha',status:'reviewed',start:'2026-01-01',end:'2026-01-02',regions:['IN'],tradition:'Test fixture only',priority:1,reviewer:'Test-only reviewer',reviewedOn:'2025-12-01',sources:[{url:'https://example.invalid/test-only',label:'Synthetic test source'}]};
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 await page.clock.install({time:new Date('2025-12-24T18:30:00Z')});
 await page.route('**/assets/festivals/2026.json',r=>r.fulfill({json:{schema:1,year:2026,events:[event]}}));
 await page.goto(base);await page.waitForFunction(()=>document.querySelector('[data-festival-title]')?.textContent.includes('Synthetic test'));
 assert.match(await page.locator('[data-festival-note]').textContent(),/Preparation window/);
 await page.clock.fastForward(9*86400000);
 await page.waitForFunction(()=>document.querySelector('[data-festival-display]').hidden);
 const other=await context.newPage();await other.goto(base);
 await other.locator('.hdc-festival summary').click();await other.locator('[data-festival-mode]').selectOption('ganesha');
 await page.waitForFunction(()=>document.querySelector('[data-festival-title]').textContent==='Ganesha design preview');
 await context.close();
 const broken=await browser.newContext({serviceWorkers:'block'}),brokenPage=await broken.newPage();
 await brokenPage.route('**/assets/festivals/index.json',r=>r.fulfill({json:{schema:0,years:'invalid'}}));
 await brokenPage.goto(base);await brokenPage.waitForFunction(()=>document.querySelector('[data-festival-status]')?.textContent.includes('schedule unavailable'));
 assert.equal(await brokenPage.locator('[data-festival-display]').isVisible(),false);
 await brokenPage.evaluate(()=>{localStorage.setItem('abp-japa-state-v1','{"count":27}');const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='hdc-festival-preferences-v1')throw new Error('blocked');return set.call(this,k,v);};});
 await brokenPage.locator('.hdc-festival summary').click();await brokenPage.locator('[data-festival-mode]').selectOption('ganesha');
 assert.match(await brokenPage.locator('[data-festival-status]').textContent(),/this visit only/);
 assert.equal(await brokenPage.evaluate(()=>localStorage.getItem('abp-japa-state-v1')),'{"count":27}');
 await broken.close();console.log('PASS synthetic automatic seven-day/end boundary, cross-tab preference and malformed-manifest original-theme fallback');
}finally{await browser.close();server.kill();}
