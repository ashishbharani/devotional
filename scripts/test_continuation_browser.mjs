import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4345'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4345/devotional/';
await mkdir('work/continuation',{recursive:true});
try{
 for(const [width,theme] of [[375,'abp-light'],[1440,'abp-dark']]){
  const context=await browser.newContext({viewport:{width,height:1000},colorScheme:theme==='abp-dark'?'dark':'light',serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  context.on('page',page=>page.on('pageerror',e=>errors.push(e.message)));
  const home=await context.newPage();await home.goto(base);
  assert.equal(await home.locator('[data-daily-reader]').isVisible(),false);
  await home.locator('.hdc-daily').screenshot({path:`work/continuation/daily-no-reader-progress-${width}.png`});
  const other=await context.newPage();await other.goto(base+'reader/');await other.locator('[data-bookmark]').click();
  await home.locator('[data-daily-reader]:visible').waitFor();
  await home.locator('.hdc-daily').screenshot({path:`work/continuation/daily-saved-reader-${width}.png`});
  await home.locator('[data-daily-reader] a').click();await home.waitForURL(/reader\/#gita-2-47$/);
  await home.locator('[data-reader-passage]').waitFor();
  await other.bringToFront();await other.locator('[data-reader-size]').selectOption('1.5');await other.locator('[data-reader-spacing]').selectOption('2.2');await other.locator('[data-read]').click();
  await home.bringToFront();await home.waitForFunction(()=>document.querySelector('[data-reader-size]').value==='1.5'&&document.querySelector('[data-read]').getAttribute('aria-pressed')==='true',null,{polling:100});
  assert.equal(await home.locator('[data-reader-spacing]').inputValue(),'2.2');
  await home.locator('[data-reader-query]').fill('no matching passage');assert.equal(await home.locator('[data-reader-passage]').isVisible(),false);
  await home.locator('[data-reader-continue]').click();assert.equal(await home.locator('[data-reader-passage]').isVisible(),true);
  assert.equal(await home.locator('[data-reader-query]').inputValue(),'','same-hash continue clears a hiding filter');
  await home.goto(base+'reader/?readerQuery=not-a-passage&privateToken=synthetic');
  assert.equal(await home.locator('[data-reader-empty]').isVisible(),true);
  await home.locator('[data-reader-continue]').click();assert.equal(await home.locator('[data-reader-passage]').isVisible(),true);
  await home.evaluate(()=>{Object.defineProperty(navigator,'share',{value:undefined,configurable:true});Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('blocked');}},configurable:true});});
  await home.locator('[data-reader-share]').click();await home.locator('[data-reader-link]:visible').waitFor();
  assert.equal(await home.locator('[data-reader-link] input').inputValue(),base+'reader/#gita-2-47','public passage sharing excludes all query parameters');
  await home.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  await home.screenshot({path:`work/continuation/reader-${width}.png`});
  await other.locator('[data-reader-clear]').click();
  await home.waitForFunction(()=>document.querySelector('[data-bookmark]').getAttribute('aria-pressed')==='false');
  assert.equal(await home.locator('[data-reader-size]').inputValue(),'1.5','clearing progress preserves typography');
  await home.goto(base);assert.equal(await home.locator('[data-daily-reader]').isVisible(),false);
  await other.evaluate(()=>localStorage.setItem('hdc-reader-v1','{"bookmark":"true","read":1}'));
  assert.equal(await home.locator('[data-daily-reader]').isVisible(),false,'malformed flags do not create false progress');
  await other.locator('[data-bookmark]').click();await home.locator('[data-daily-reader]:visible').waitFor();
  await home.locator('[data-daily-reader] a').click();await home.waitForURL(/reader\/#gita-2-47$/);
  await home.evaluate(()=>{window.qaWrites=0;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='hdc-reader-v1')window.qaWrites++;return set.call(this,k,v);};});
  await home.locator('[data-bookmark]').click();assert.equal(await home.evaluate(()=>window.qaWrites),1,'instant navigation has one active reader listener');
  assert.equal(await home.locator('[data-reader-size]').inputValue(),'1.5','reset starts from the nondefault saved size');
  await other.bringToFront();await other.evaluate(()=>localStorage.removeItem('hdc-reader-v1'));
  await home.bringToFront();
  // This is a cross-tab state check, not an animation-frame readiness check.
  try{
   await home.waitForFunction(()=>localStorage.getItem('hdc-reader-v1')===null&&document.querySelector('[data-reader-size]').value==='1'&&document.querySelector('[data-reader-spacing]').value==='1.8'&&document.querySelector('[data-bookmark]').getAttribute('aria-pressed')==='false'&&document.querySelector('[data-read]').getAttribute('aria-pressed')==='false',null,{polling:100});
  }catch(error){
   const diagnostic=await home.evaluate(()=>({url:location.href,visibility:document.visibilityState,focused:document.hasFocus(),readerRoots:document.querySelectorAll('[data-reader]').length,saved:localStorage.getItem('hdc-reader-v1'),size:document.querySelector('[data-reader-size]')?.value,spacing:document.querySelector('[data-reader-spacing]')?.value,status:document.querySelector('[data-reader-status]')?.textContent}));
   await writeFile(`work/continuation/reset-failure-${width}.json`,JSON.stringify(diagnostic,null,2));await home.screenshot({path:`work/continuation/reset-failure-${width}.png`});throw error;
  }
  await home.goto(base+'explore/?w=Shiva&category=1#filters');
  await home.waitForFunction(()=>document.querySelector('[data-discovery] [name=category]')?.options.length===43);
  assert.equal(await home.locator('[data-discovery] [name=w]').inputValue(),'Shiva');assert.equal(await home.locator('[data-discovery] [name=category]').inputValue(),'1');
  const language=await home.locator('[name=language] option').nth(1).getAttribute('value');
  await home.locator('[name=language]').selectOption(language);assert.equal(new URL(home.url()).searchParams.get('language'),language);
  await home.reload();await home.waitForFunction(value=>document.querySelector('[name=language]')?.value===value,language);
  assert.equal(new URL(home.url()).hash,'#filters');
  await home.locator('[data-discovery]').screenshot({path:`work/continuation/explore-filters-${width}.png`});
  await home.getByRole('link',{name:'Scriptures and Books Library',exact:true}).click();await home.waitForURL(base+'library/');
  await home.goBack();await home.waitForFunction(()=>document.querySelector('[data-discovery] [name=category]')?.value==='1');
  assert.equal(await home.locator('[name=language]').inputValue(),language,'browser Back restores the public filter state');
  await home.goto(base+'explore/?w=Shiva&category=unknown&language=unknown&form=unknown');
  await home.waitForFunction(()=>document.querySelector('[data-discovery-status]')?.textContent.includes('Unsupported'));
  assert.equal(new URL(home.url()).searchParams.has('category'),false,'unsupported filter is not silently retained in the shared address');
  await home.locator('[name=category]').selectOption('1');await home.getByRole('button',{name:'Search the existing collection',exact:true}).click();
  await home.waitForURL(/\/find\/\?/);await home.locator('#abp-results tr').first().waitFor();
  assert.equal(new URL(home.url()).searchParams.get('w'),'Shiva');assert.equal(new URL(home.url()).searchParams.get('category'),'1');
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS five continuation flows ${width}px ${theme}`);
 }
 const context=await browser.newContext({timezoneId:'Asia/Kolkata',serviceWorkers:'block'}),page=await context.newPage();
 await page.addInitScript(()=>{
  window.qaNow=Date.parse('2026-11-01T18:29:50Z');Date.now=()=>window.qaNow;
  localStorage.setItem('abp-japa-state-v1','{"count":108}');
  localStorage.setItem('hdc-journey-state-v1',JSON.stringify({name:'Local day test',minutes:5,journal:'',sessions:[{at:'2026-11-01T18:00:00Z',minutes:5},{at:'2026-10-31T18:00:00Z',minutes:10},{at:'2026-11-01T19:00:00Z',minutes:20},{at:'2026-10-20T18:00:00Z',minutes:20}]}));
 });
 await page.goto(base+'journeys/');
 assert.match(await page.locator('[data-journey-today]').textContent(),/Today: 1 self-reported sessions · 5 minutes/);
 assert.match(await page.locator('[data-journey-today]').textContent(),/Asia\/Kolkata|Asia\/Calcutta/);
 assert.match(await page.locator('[data-journey-summary]').textContent(),/2 self-reported sessions · 15 minutes/);
 const saved=await page.evaluate(()=>localStorage.getItem('hdc-journey-state-v1'));
 await page.evaluate(()=>{window.qaNow=Date.parse('2026-11-01T18:30:05Z');document.dispatchEvent(new Event('visibilitychange'));});
 assert.match(await page.locator('[data-journey-today]').textContent(),/Today: 0 self-reported sessions/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('hdc-journey-state-v1')),saved,'summary refresh is read-only');
 assert.equal(await page.evaluate(()=>localStorage.getItem('abp-japa-state-v1')),'{"count":108}');
 await context.close();console.log('PASS local civil-day boundary, rolling week, future exclusion and unchanged legacy state');
}finally{await browser.close();server.kill();}
