import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4334'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4334/devotional/';
const checkContrast=async page=>assert.ok(await page.evaluate(()=>{
 const luminance=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
 const bg=luminance(getComputedStyle(document.querySelector('.hdc-practice')).backgroundColor);
 return [...document.querySelectorAll('.hdc-practice p,.hdc-practice a,.hdc-practice label,.hdc-practice h2,.hdc-practice figcaption')].every(el=>{const fg=luminance(getComputedStyle(el).color);return(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)>=4.5;});
}),'practice/reader text meets 4.5:1 on its theme surface');
await mkdir('work/practice',{recursive:true});
try{
 for(const width of [320,375,768,1024,1440])for(const theme of ['abp-light','abp-dark']){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await context.addInitScript(()=>{
   window.audioCreated=0;window.audioClosed=0;
   window.AudioContext=class{constructor(){window.audioCreated++;this.currentTime=0;this.destination={};}resume(){return Promise.resolve();}close(){window.audioClosed++;return Promise.resolve();}createOscillator(){return{frequency:{},connect(){return{connect(){}};},start(){},stop(){}};}createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}};}};
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await page.request.get(base+'sanctuary/')).status(),404,'Sanctuary retired');
  await page.goto(base+'reader/bhagavad-gita/chapter-2/#gita-2-47');
  await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  await page.locator('[data-bookmark]').click();await page.locator('[data-read]').click();
  await page.locator('[data-reader-size]').selectOption('1.5');await page.locator('[data-reader-spacing]').selectOption('2.2');
  assert.equal(await page.locator('[data-reader-progress]').textContent(),'1 of 72 passages marked read. Passage bookmarked.');
  assert.match(await page.locator('#gita-2-47 .hdc-verse').innerText(),/कर्मण्येवाधिकारस्ते/,'original verse remains in the full chapter');
  assert.equal(await page.locator('#gita-2-47 .hdc-verse').getAttribute('translate'),'no');
  await page.locator('[data-reader-query]').fill('not-a-real-passage');assert.equal(await page.locator('[data-reader-empty]').isVisible(),true);
  await page.locator('[data-reader-query]').fill('2.47');assert.equal(await page.locator('#gita-2-47').isVisible(),true);
  await page.reload();assert.equal(await page.locator('[data-bookmark]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-reader-continue]').isVisible(),true);
  assert.equal(await page.locator('[data-reader-size]').inputValue(),'1.5');
  await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await page.locator('main h1').count(),1);
  await checkContrast(page);
  await page.screenshot({path:`work/practice/reader-${width}-${theme}.png`,fullPage:true});
  await page.locator('[data-reader-clear]').click();assert.equal(await page.locator('[data-read]').getAttribute('aria-pressed'),'false');
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS reader / retired Sanctuary ${width}px ${theme}`);
 }
 const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
 await page.addInitScript(()=>{localStorage.setItem('abp-japa-state-v1','{"count":54}');localStorage.setItem('hdc-reader-v1','malformed');});
 await page.goto(base+'reader/bhagavad-gita/chapter-2/#gita-2-47');assert.equal(await page.locator('[data-read]').getAttribute('aria-pressed'),'false');
 await page.locator('[data-reader-clear]').click();assert.equal(await page.evaluate(()=>localStorage.getItem('abp-japa-state-v1')),'{"count":54}');
 assert.equal(await page.evaluate(()=>localStorage.getItem('hdc-reader-v1')),'malformed','clear must not silently replace an unreadable record');
 await page.evaluate(()=>localStorage.setItem('hdc-reader-v1','{}'));
 await page.evaluate(()=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k.startsWith('hdc-'))throw new Error('blocked');return set.call(this,k,v);};});
 await page.locator('[data-bookmark]').click();assert.match(await page.locator('[data-reader-status]').textContent(),/this visit only/);
 await page.evaluate(()=>{
  Object.defineProperty(navigator,'share',{value:undefined,configurable:true});
  Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw new Error('denied');}},configurable:true});
 });
 await page.locator('[data-reader-share]').click();await page.locator('[data-reader-link]:visible').waitFor();
 assert.match(await page.locator('[data-reader-link] input').inputValue(),/\/reader\/bhagavad-gita\/chapter-2\/#gita-2-47$/);
 await context.close();
 assert.ok((await readFile('site/sw.js','utf8')).includes('stylesheets/practice.css'),'offline shell includes practice stylesheet');
 const offline=await browser.newContext({serviceWorkers:'allow'}),offlinePage=await offline.newPage();
 await offlinePage.goto(base);await offlinePage.evaluate(()=>navigator.serviceWorker.ready);
 await offlinePage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 for(const route of ['reader/'])assert.ok(await offlinePage.evaluate(async url=>Boolean(await caches.match(url)),base+route),'new route precached');
 await offlinePage.goto(base+'reader/bhagavad-gita/chapter-2/#gita-2-47');
 await offlinePage.waitForFunction(async url=>!!await caches.match(url),base+'reader/bhagavad-gita/chapter-2/');
 await offline.setOffline(true);await offlinePage.goto(base+'reader/bhagavad-gita/chapter-2/#gita-2-47');
 await offlinePage.locator('[data-bookmark]').click();assert.equal(await offlinePage.locator('[data-bookmark]').getAttribute('aria-pressed'),'true');
 assert.equal(await offlinePage.locator('[data-sanctuary]').count(),0);
 await offline.close();
 const noScript=await browser.newContext({javaScriptEnabled:false,serviceWorkers:'block'}),staticPage=await noScript.newPage();
 await staticPage.goto(base+'reader/bhagavad-gita/chapter-2/');assert.ok(await staticPage.locator('#gita-2-47').isVisible());await noScript.close();
 console.log('PASS visited-chapter offline Reader bookmark and retired Sanctuary absence');
 console.log('PASS malformed/blocked storage, legacy Japa preservation, source and offline shell declarations');
}finally{await browser.close();server.kill();}
