// Explicit V2 review build only; synthetic date evidence never enters source data.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {chromium} from 'playwright';
import {THEMES,quality} from '../docs/assets/festivals/living-presentation.mjs';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4380'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4380/devotional/',out='work/living-festival/screenshots';
await mkdir(out,{recursive:true});
const bundled=JSON.parse(await readFile('docs/assets/festivals/living-registry.json','utf8'));
const approval={approved:true,reviewer:'Synthetic test only',reviewedOn:'2026-01-01'},sources=[{url:'https://example.invalid/test-only',label:'Synthetic evidence, not publication data',reviewedOn:'2026-01-01'}];
const event={id:'synthetic-window',name:'Synthetic date test — not a real festival',family:'diwali',theme:'diwali',tradition:'Fictional test fixture',start:'2026-11-11',end:'2026-11-13',priority:10,status:'verified',approval,sources,regions:['IN']};
const fixture={...bundled,windows:[event],members:[{id:'synthetic-member',windowId:'synthetic-window',name:'Synthetic day variation',family:'diwali',start:'2026-11-12',end:'2026-11-12',status:'verified',approval,sources}]};
const policy={schema:1,enabled:true,previewEnabled:true};
const result={syntheticEvidenceOnly:true,viewports:[],screenshots:[],errors:[],checks:[]};
async function contextFor({width=375,motion='reduce',timezone='Asia/Kolkata',fake=true,time='2026-11-04T06:30:00Z'}={}){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:motion,timezoneId:timezone});
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 if(fake){await context.route('**/assets/festivals/living-registry.json',r=>r.fulfill({json:fixture}));await context.route('**/assets/festivals/living-policy.json',r=>r.fulfill({json:policy}));}
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
 await page.clock.install({time:new Date(new Date(time).getTime()-3600000)});await page.clock.pauseAt(new Date(time));
 return {context,page};
}
async function ready(page){await page.waitForFunction(()=>document.querySelector('[data-living-status]')?.textContent.match(/Automatic reviewed|disabled by|appearance selected|No applicable/));}
async function open(page){await page.locator('.hdc-living > details > summary').click();}
try{
 for(const width of [320,360,390,414,768,1024,1440]){
  const {context,page}=await contextFor({width});await page.goto(base);await ready(page);
  assert.equal(await page.locator('html').getAttribute('data-hdc-stage'),'anticipation');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.equal(await page.locator('.hdc-living-scenery svg').count(),8);
  assert.equal(await page.locator('.hdc-living-scenery svg').first().evaluate(e=>getComputedStyle(e).animationName),'none');
  const originalHero=await page.locator('.udhc-hero-art img').getAttribute('src');
  await open(page);await page.locator('[data-living-original]').click();
  const original=await page.locator('body').evaluate(e=>({background:getComputedStyle(e).backgroundImage,color:getComputedStyle(e).color,font:getComputedStyle(e).fontFamily}));
  assert.equal(await page.locator('[data-hdc-festival]').count(),0);assert.equal(await page.locator('.hdc-living-scenery').count(),0);
  if([320,1440].includes(width)){
   await page.locator('.hdc-living > details > summary').click();await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:`${out}/original-${width}.png`});result.screenshots.push(`original-${width}.png`);await open(page);
   await page.locator('[data-living-previews] > summary').click();
   for(const [id,theme] of Object.entries(THEMES)){
    await page.getByRole('button',{name:theme.name,exact:true}).click();
    assert.equal(await page.locator('html').getAttribute('data-hdc-festival'),id);
    assert.equal(await page.locator('.udhc-hero-art img').getAttribute('src'),originalHero);
    assert.match(await page.locator('[data-living-countdown]').textContent(),/No festival date is implied/);
    assert.equal((await page.request.get(await page.locator('[data-living-explore]').getAttribute('href'))).status(),200,'existing collection route');
    for(const stage of ['anticipation','approach','celebration']){
     await page.locator('[data-living-stage]').selectOption(stage);await page.evaluate(()=>scrollTo(0,0));
     await page.screenshot({path:`${out}/${id}-${stage}-${width}.png`});result.screenshots.push(`${id}-${stage}-${width}.png`);
    }
   }
   await page.locator('[data-living-original]').click();
   assert.deepEqual(await page.locator('body').evaluate(e=>({background:getComputedStyle(e).backgroundImage,color:getComputedStyle(e).color,font:getComputedStyle(e).fontFamily})),original);
   await page.locator('.hdc-living > details > summary').click();await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:`${out}/restored-${width}.png`});
   assert.equal(Buffer.compare(await readFile(`${out}/original-${width}.png`),await readFile(`${out}/restored-${width}.png`)),0,'original/restored viewport pixels match in this fixed-clock reduced-motion lab');
  }
  await context.close();result.viewports.push(width);console.log(`PASS V2 layout and reversible appearance ${width}px`);
 }
 for(const timezone of ['America/Los_Angeles','Asia/Tokyo','Asia/Kolkata']){
  const {context,page}=await contextFor({timezone,time:'2026-11-03T18:29:59Z'});await page.goto(base);await ready(page);
  assert.equal(await page.locator('[data-hdc-festival]').count(),0);
  await page.clock.fastForward(1000);await page.waitForFunction(()=>document.documentElement.dataset.hdcStage==='anticipation');
  await page.clock.fastForward(4*86400000);await page.waitForFunction(()=>document.documentElement.dataset.hdcStage==='approach');
  await page.clock.fastForward(3*86400000);await page.waitForFunction(()=>document.documentElement.dataset.hdcStage==='celebration');
  await page.reload();await ready(page);assert.equal(await page.locator('html').getAttribute('data-hdc-stage'),'celebration');
  await page.clock.fastForward(86400000);await page.waitForFunction(()=>document.querySelector('[data-living-countdown]')?.textContent.includes('Synthetic day variation'));
  await page.clock.fastForward(2*86400000);await page.waitForFunction(()=>!document.documentElement.dataset.hdcFestival);await context.close();
 }
 result.checks.push('IST midnight, all three stages, inclusive multi-day expiry, variation and refresh in three browser timezones');
 const {context,page}=await contextFor({motion:'no-preference'});await page.goto(base);await ready(page);await open(page);
 assert.equal(await page.locator('html').getAttribute('data-hdc-quality'),'full');
 await page.evaluate(()=>document.documentElement.classList.add('abp-hc'));await page.waitForFunction(()=>document.documentElement.dataset.hdcQuality==='calm');
 assert.equal(await page.locator('.hdc-living-scenery').evaluate(e=>getComputedStyle(e).display),'none');
 await page.evaluate(()=>document.documentElement.classList.remove('abp-hc'));await page.locator('[data-living-effects]').selectOption('reduced');
 assert.equal(await page.locator('.hdc-living-scenery svg').first().evaluate(e=>getComputedStyle(e).animationName),'none');
 await page.locator('[data-living-region]').selectOption('IN-KL');
 assert.equal(await page.evaluate(()=>localStorage.getItem('abp-panchang-place')),null,'region selection does not write a Panchang location');
 await page.evaluate(()=>{localStorage.setItem('unrelated-test','keep');Storage.prototype.setItem=function(){throw Error('Synthetic quota failure');};});
 await page.locator('[data-living-original]').click();assert.match(await page.locator('[data-living-status]').textContent(),/this visit/);
 assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated-test')),'keep');assert.equal(await page.locator('[data-hdc-festival]').count(),0);
 await context.close();result.checks.push('adaptive/high-contrast/reduced motion, regions independent of Panchang, blocked storage restores Original');
 const repeated=await contextFor();await repeated.page.goto(base);await ready(repeated.page);
 for(const route of ['find/','panchang/','master-index/']){
  await repeated.page.evaluate(path=>{const a=document.createElement('a');a.href=path;a.textContent='Test navigation';a.id='living-test-navigation';document.querySelector('main').prepend(a);},base+route);
  await repeated.page.locator('#living-test-navigation').click();await repeated.page.waitForURL(base+route);await ready(repeated.page);
  assert.equal(await repeated.page.locator('.hdc-living-scenery').count(),1);assert.equal(await repeated.page.locator('.hdc-living-scenery svg').count(),8);
 }
 await repeated.page.goBack();await ready(repeated.page);assert.equal(await repeated.page.locator('.hdc-living-scenery').count(),1);
 await repeated.context.close();result.checks.push('instant navigation/repeated pages and browser Back have one decoration layer');
 const missing=await contextFor({fake:false});await missing.context.route('**/assets/festivals/living-registry.json',r=>r.fulfill({status:404,body:'Unavailable'}));
 await missing.page.goto(base);await missing.page.waitForFunction(()=>document.querySelector('[data-living-status]')?.textContent.includes('unavailable'));
 assert.equal(await missing.page.locator('[data-hdc-festival]').count(),0);await missing.context.close();
 const offline=await browser.newContext({serviceWorkers:'allow',reducedMotion:'reduce'});await offline.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 const offlinePage=await offline.newPage();await offlinePage.goto(base);await ready(offlinePage);
 await offlinePage.evaluate(()=>navigator.serviceWorker.ready);await offlinePage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 for(const file of ['living-registry.json','living-policy.json','living-scheduler.mjs','living-presentation.mjs'])assert.ok(await offlinePage.evaluate(async url=>Boolean(await caches.match(url)),base+'assets/festivals/'+file));
 await offline.setOffline(true);await offlinePage.reload();await ready(offlinePage);assert.equal(await offlinePage.locator('[data-hdc-festival]').count(),0,'unapproved bundled schedule remains Original offline');
 await open(offlinePage);await offlinePage.locator('[data-living-previews] > summary').click();await offlinePage.getByRole('button',{name:'Pongal',exact:true}).click();
 assert.equal(await offlinePage.locator('html').getAttribute('data-hdc-festival'),'pongal');await offline.close();
 result.checks.push('real PWA shell caches local modules/policy/empty registry; offline Original and explicit design preview, NOT verified V2 observance availability');
 const sizes={};for(const file of ['docs/javascripts/abp-living-festivals.js','docs/assets/festivals/living-scheduler.mjs','docs/assets/festivals/living-presentation.mjs','docs/stylesheets/living-festivals.css'])sizes[file]=gzipSync(await readFile(file)).byteLength;
 assert.ok(Object.entries(sizes).filter(([p])=>!p.endsWith('.css')).reduce((n,[,bytes])=>n+bytes,0)<=15*1024);assert.ok(sizes['docs/stylesheets/living-festivals.css']<=12*1024);
 assert.equal(quality({dataSaver:true}),'calm');assert.equal(quality({cores:2}),'calm');assert.equal(quality({memory:2}),'calm');
 result.gzipBytes=sizes;assert.deepEqual(result.errors,[]);result.passed=true;
 await writeFile('work/living-festival/browser-results.json',JSON.stringify(result,null,2));console.log('PASS V2 browser fixtures, offline fallback and byte budgets; dates/art/cultural review remain incomplete');
}finally{await browser.close();server.kill();}
