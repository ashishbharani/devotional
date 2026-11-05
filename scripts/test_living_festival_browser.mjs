// Explicit V2 review build only; synthetic date evidence never enters source data.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createServer} from 'node:http';
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
const result={syntheticEvidenceOnly:true,viewports:[],screenshots:[],errors:[],consoleErrors:[],checks:[]};
async function contextFor({width=375,motion='reduce',timezone='Asia/Kolkata',fake=true,time='2026-11-04T06:30:00Z',expectedAssetFailure=false}={}){
 const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:motion,timezoneId:timezone});
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 if(fake){await context.route('**/assets/festivals/living-registry.json',r=>r.fulfill({json:fixture}));await context.route('**/assets/festivals/living-policy.json',r=>r.fulfill({json:policy}));}
 const page=await context.newPage();page.on('pageerror',e=>result.errors.push(e.message));
 if(!expectedAssetFailure)page.on('console',message=>{if(message.type()==='error')result.consoleErrors.push(message.text());});
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
    const lighting=[];
    for(const stage of ['anticipation','approach','celebration']){
     await page.locator('[data-living-stage]').selectOption(stage);await page.evaluate(()=>scrollTo(0,0));
     lighting.push(await page.locator('.udhc-hero').evaluate(e=>getComputedStyle(e).boxShadow));
     await page.screenshot({path:`${out}/${id}-${stage}-${width}.png`});result.screenshots.push(`${id}-${stage}-${width}.png`);
    }
    assert.equal(new Set(lighting).size,3,'each stage has a distinct computed lighting intensity');
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
  // Exercise the shared scheduler on a content page. Fast-forwarding every
  // browser timer on Home also expires the independent astronomy worker's
  // watchdog before that real worker can answer; that is a test-clock artefact.
  const {context,page}=await contextFor({timezone,time:'2026-11-03T18:29:59Z'});await page.goto(base+'foreword/');await ready(page);
  assert.equal(await page.locator('[data-hdc-festival]').count(),0);
  await page.clock.fastForward(1000);await page.waitForFunction(()=>document.documentElement.dataset.hdcStage==='anticipation');
  await page.clock.fastForward(4*86400000);await page.waitForFunction(()=>document.documentElement.dataset.hdcStage==='approach');
  await page.clock.fastForward(3*86400000);await page.waitForFunction(()=>document.documentElement.dataset.hdcStage==='celebration');
  await page.reload();await ready(page);assert.equal(await page.locator('html').getAttribute('data-hdc-stage'),'celebration');
  await page.clock.fastForward(86400000);await page.waitForFunction(()=>document.querySelector('[data-living-countdown]')?.textContent.includes('Synthetic day variation'));
  await page.clock.fastForward(2*86400000);await page.waitForFunction(()=>!document.documentElement.dataset.hdcFestival);await context.close();
 }
 result.checks.push('IST midnight, all three stages, inclusive multi-day expiry, variation and refresh in three browser timezones');
 const life=await contextFor();await life.page.goto(base+'foreword/');await ready(life.page);
 // Jump the injected civil clock without relying on the suspended midnight
 // timer: lifecycle restoration itself must recompute the correct date.
 await life.page.clock.setFixedTime(new Date('2026-11-12T06:30:00Z'));
 await life.page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
 await life.page.waitForFunction(()=>document.documentElement.dataset.hdcStage==='celebration');
 assert.match(await life.page.locator('[data-living-countdown]').textContent(),/Synthetic day variation/);
 await life.page.clock.setFixedTime(new Date('2026-11-14T06:30:00Z'));
 await life.page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 await life.page.waitForFunction(()=>!document.documentElement.dataset.hdcFestival);
 await life.page.clock.setFixedTime(new Date('2026-11-11T06:30:00Z'));
 for(let i=0;i<3;i++){
  await life.page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
  await life.page.waitForFunction(()=>document.documentElement.dataset.hdcStage==='celebration');
  assert.equal(await life.page.locator('.hdc-living-scenery').count(),1);
  await life.page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
  assert.equal(await life.page.locator('.hdc-living-scenery').count(),0);
 }
 await life.context.close();result.checks.push('suspended-timer civil-clock jumps recompute on visible/pageshow restoration; repeated bfcache lifecycle leaves one layer and cleans on pagehide');
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
 const sync=await contextFor();await sync.page.goto(base);await ready(sync.page);await open(sync.page);
 const second=await sync.context.newPage();second.on('pageerror',e=>result.errors.push(e.message));
 await second.clock.setFixedTime(new Date('2026-11-04T06:30:00Z'));await second.goto(base+'find/');await ready(second);
 await sync.page.locator('[data-living-original]').click();
 await second.waitForFunction(()=>document.querySelector('[data-living-mode]')?.value==='original');
 assert.equal(await second.locator('.hdc-living-scenery').count(),0);
 await open(second);await second.locator('[data-living-region]').selectOption('IN-TN');
 await sync.page.waitForFunction(()=>document.querySelector('[data-living-region]')?.value==='IN-TN');
 assert.equal(await sync.page.evaluate(()=>localStorage.getItem('abp-panchang-place')),null);
 await sync.context.close();result.checks.push('real cross-tab storage events synchronize opt-out and festival region without changing Panchang location');
 for(const [legacyMode,expected] of [['auto','diwali'],['original',null],['ganesha','ganesha'],['shiva','shivaratri']]){
  const legacy=await contextFor(),saved=JSON.stringify({mode:legacyMode,region:'IN-MH',effects:false,ownerExtra:'preserve'});
  await legacy.page.addInitScript(saved=>localStorage.setItem('hdc-festival-preferences-v1',saved),saved);
  await legacy.page.goto(base);await legacy.page.waitForFunction(()=>document.querySelector('[data-living-region]')?.value==='IN-MH');
  assert.equal(await legacy.page.locator('html').getAttribute('data-hdc-festival'),expected);
  assert.equal(await legacy.page.locator('[data-living-effects]').inputValue(),'none');
  assert.equal(await legacy.page.evaluate(()=>localStorage.getItem('hdc-festival-preferences-v1')),saved);
  assert.equal(await legacy.page.evaluate(()=>localStorage.getItem('hdc-living-festival-preferences-v2')),null,'reading a legacy preference does not write a migration');
  await open(legacy.page);await legacy.page.locator('[data-living-effects]').selectOption('reduced');await legacy.page.reload();
  await legacy.page.waitForFunction(()=>document.querySelector('[data-living-effects]')?.value==='reduced');
  assert.equal(await legacy.page.locator('html').getAttribute('data-hdc-festival'),expected,'new local settings keep the legacy manual identity');
  assert.equal(await legacy.page.evaluate(()=>localStorage.getItem('hdc-festival-preferences-v1')),saved);await legacy.context.close();
 }
 const kill=await contextFor();await kill.context.route('**/assets/festivals/living-policy.json',r=>r.fulfill({json:{schema:1,enabled:false,previewEnabled:false}}));
 await kill.page.addInitScript(()=>localStorage.setItem('hdc-festival-preferences-v1',JSON.stringify({mode:'ganesha',effects:true})));
 await kill.page.goto(base);await ready(kill.page);assert.equal(await kill.page.locator('[data-hdc-festival]').count(),0,'the administrator kill switch also suppresses saved/manual previews');await kill.context.close();
 result.checks.push('legacy Auto/Original/Ganesha/Shiva, region and effect choices retained without rewriting V1; administrator kill switch wins');
 const missing=await contextFor({fake:false,expectedAssetFailure:true});await missing.context.route('**/assets/festivals/living-registry.json',r=>r.fulfill({status:404,body:'Unavailable'}));
 await missing.page.goto(base);await missing.page.waitForFunction(()=>document.querySelector('[data-living-status]')?.textContent.includes('unavailable'));
 assert.equal(await missing.page.locator('[data-hdc-festival]').count(),0);await missing.context.close();
 const missingModule=await contextFor({fake:false,expectedAssetFailure:true});
 await missingModule.context.route('**/assets/festivals/living-presentation.mjs',r=>r.fulfill({status:404,body:'Unavailable'}));
 await missingModule.page.goto(base);await missingModule.page.waitForFunction(()=>document.querySelector('[data-living-status]')?.textContent.includes('unavailable'));
 await open(missingModule.page);await missingModule.page.locator('[data-living-original]').click();
 assert.equal(await missingModule.page.locator('[data-hdc-festival]').count(),0);await missingModule.context.close();
 result.checks.push('missing registry or presentation module fails to Original, with restore control still usable; expected 404 console messages excluded from ordinary-console assertion');
 const offline=await browser.newContext({serviceWorkers:'allow',reducedMotion:'reduce'});await offline.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 const offlinePage=await offline.newPage();await offlinePage.goto(base);await ready(offlinePage);
 await offlinePage.evaluate(()=>navigator.serviceWorker.ready);await offlinePage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 for(const file of ['living-registry.json','living-policy.json','living-scheduler.mjs','living-presentation.mjs'])assert.ok(await offlinePage.evaluate(async url=>Boolean(await caches.match(url)),base+'assets/festivals/'+file));
 await offline.setOffline(true);await offlinePage.reload();await ready(offlinePage);assert.equal(await offlinePage.locator('[data-hdc-festival]').count(),0,'unapproved bundled schedule remains Original offline');
 await open(offlinePage);await offlinePage.locator('[data-living-previews] > summary').click();await offlinePage.getByRole('button',{name:'Pongal',exact:true}).click();
 assert.equal(await offlinePage.locator('html').getAttribute('data-hdc-festival'),'pongal');await offline.close();
 result.checks.push('real PWA shell caches local modules/registry with production-disabled policy; offline Original and explicit design preview');
 // An isolated local proxy enables ONLY the administrator policy for this test.
 // Actual bundled source-checked records, worker, URLs and modules stay unchanged.
 // No runtime URL parameter, date override or deployment switch is introduced.
 const proxy=createServer(async(req,res)=>{
  try{
   if(req.url==='/devotional/assets/festivals/living-policy.json')return res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({schema:1,enabled:true,previewEnabled:true,testOnly:true}));
   const response=await fetch(new URL(req.url,'http://127.0.0.1:4380'));
   res.writeHead(response.status,{'Content-Type':response.headers.get('content-type')||'application/octet-stream'}).end(Buffer.from(await response.arrayBuffer()));
  }catch{res.writeHead(500).end('Local test proxy unavailable');}
 });
 await new Promise(resolve=>proxy.listen(0,'127.0.0.1',resolve));
 const realBase=`http://127.0.0.1:${proxy.address().port}/devotional/`,realOffline=await browser.newContext({viewport:{width:320,height:1000},serviceWorkers:'allow',reducedMotion:'reduce',timezoneId:'America/Los_Angeles'});
 try{
  await realOffline.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  const realPage=await realOffline.newPage(),realErrors=[];realPage.on('pageerror',e=>realErrors.push(e.message));
  await realPage.clock.install({time:new Date('2026-11-04T06:00:00Z')});await realPage.clock.pauseAt(new Date('2026-11-05T06:00:00Z'));
  await realPage.goto(realBase+'find/');await realPage.waitForFunction(()=>document.documentElement.dataset.hdcStage==='approach');
  assert.match(await realPage.locator('[data-living-title]').textContent(),/New Delhi/);
  await realPage.evaluate(()=>navigator.serviceWorker.ready);await realPage.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
  const cachedRegistry=await realPage.evaluate(async url=>(await caches.match(url)).json(),realBase+'assets/festivals/living-registry.json');
  assert.deepEqual(cachedRegistry.windows.map(w=>w.id),bundled.windows.map(w=>w.id),'actual published reference registry is cached, not synthetic date fixtures');
  await realOffline.setOffline(true);await realPage.reload();await realPage.waitForFunction(()=>document.documentElement.dataset.hdcStage==='approach');
  await realPage.clock.fastForward(3*86400000);await realPage.waitForFunction(()=>document.documentElement.dataset.hdcVariant==='lotus');
  assert.equal(await realPage.locator('html').getAttribute('data-hdc-festival'),'diwali');
  assert.match(await realPage.locator('[data-living-note]').textContent(),/not a ritual timetable/);
  await realPage.clock.fastForward(4*86400000);await realPage.waitForFunction(()=>document.documentElement.dataset.hdcFestival==='chhath');
  assert.equal(await realPage.locator('html').getAttribute('data-hdc-stage'),'approach');
  await realPage.clock.fastForward(4*86400000);await realPage.waitForFunction(()=>document.documentElement.dataset.hdcVariant==='dawn');
  await realPage.clock.fastForward(86400000);await realPage.waitForFunction(()=>!document.documentElement.dataset.hdcFestival);
  assert.deepEqual(realErrors,[]);
 }finally{await realOffline.close();await new Promise(resolve=>proxy.close(resolve));}
 result.checks.push('actual city-scoped reference records through real offline worker: approach, Diwali lotus day, Chhath handover/dawn and expiry in a US browser timezone; only test-server policy enabled');
 const sizes={};for(const file of ['docs/javascripts/abp-living-festivals.js','docs/assets/festivals/living-scheduler.mjs','docs/assets/festivals/living-presentation.mjs','docs/stylesheets/living-festivals.css'])sizes[file]=gzipSync(await readFile(file)).byteLength;
 assert.ok(Object.entries(sizes).filter(([p])=>!p.endsWith('.css')).reduce((n,[,bytes])=>n+bytes,0)<=15*1024);assert.ok(sizes['docs/stylesheets/living-festivals.css']<=12*1024);
 assert.equal(quality({dataSaver:true}),'calm');assert.equal(quality({cores:2}),'calm');assert.equal(quality({memory:2}),'calm');
 result.gzipBytes=sizes;assert.deepEqual(result.errors,[]);assert.deepEqual(result.consoleErrors,[]);result.passed=true;
 await writeFile('work/living-festival/browser-results.json',JSON.stringify(result,null,2));console.log('PASS V2 browser fixtures, offline fallback and byte budgets; dates/art/cultural review remain incomplete');
}finally{await browser.close();server.kill();}
