import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const KEY='hdc-japa-history-v1',COUNTER='abp-japa-state-v1',enabled=process.argv[2]!=='default';
const site=process.env.HDC_SITE_DIR||'site',home=await readFile(site+'/index.html','utf8'),worker=await readFile(site+'/sw.js','utf8');
const counterHTML=await readFile(site+'/japa-counter/index.html','utf8');
assert.equal(home.includes('javascripts/abp-japa-history.js'),enabled,'activation follows staging flag');
assert.equal(worker.includes('javascripts/abp-japa-history.js'),enabled,'offline shell follows staging flag');
assert.equal(counterHTML.includes('data-japa-history-enabled'),enabled,'counter numeric bridge follows staging flag');
assert.equal(counterHTML.includes('data-japa-history aria-label'),enabled,'history controls follow staging flag');
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4352'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4352/devotional/';
await mkdir('work/japa-history',{recursive:true});
const history=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const count=page=>page.locator('#abp-japa').evaluate(el=>Number(el.dataset.japaCount));
const legacy=page=>page.evaluate(key=>localStorage.getItem(key),COUNTER);
const tap=async(page,n=1)=>{for(let i=0;i<n;i++)await page.locator('#abp-japa-tap').click();};
const start=page=>page.locator('[data-japa-session-start]').click();
const finish=page=>page.locator('[data-japa-session-finish]').click();
const rows=page=>page.locator('[data-japa-history-list] li');
const seed=async context=>context.addInitScript(()=>{
 if(location.origin!=='http://127.0.0.1:4352')return;
 const date=new Date(),day=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
 if(!localStorage.getItem('abp-japa-state-v1'))localStorage.setItem('abp-japa-state-v1',JSON.stringify({name:'Private prayer fixture — never copy',count:7,target:108,today:7,day,haptic:false,sound:false,canUndo:true}));
 if(!localStorage.getItem('hdc-journey-state-v1'))localStorage.setItem('hdc-journey-state-v1','{"name":"Saved routine fixture","journal":"Private journey fixture","sessions":[]}');
 if(!localStorage.getItem('hdc-reader-v1'))localStorage.setItem('hdc-reader-v1','{"bookmark":true}');
});
try{
 for(const [width,theme] of enabled?[[320,'abp-light'],[375,'abp-dark'],[1440,'abp-light'],[1440,'abp-dark']]:[[375,'abp-light']]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await context.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  await seed(context);const page=await context.newPage();await page.goto(base+'japa-counter/');
  await page.locator('#abp-japa').waitFor();await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  if(!enabled){
   assert.equal(await page.locator('[data-japa-history]').count(),0);await tap(page);
   assert.equal(JSON.parse(await legacy(page)).count,8,'ordinary production counter remains functional');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),null);
   assert.equal(await page.locator('#abp-japa').getAttribute('data-japa-count'),null);
   assert.deepEqual(errors,[]);await context.close();console.log('PASS default build: no history UI/activation/cache entries or metadata; original counter counts');continue;
  }
  const journey=await page.evaluate(()=>localStorage.getItem('hdc-journey-state-v1')),reader=await page.evaluate(()=>localStorage.getItem('hdc-reader-v1'));
  assert.equal(await count(page),7);const original=await legacy(page);
  await start(page);assert.equal(await legacy(page),original,'Start is read-only');
  await finish(page);assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),null,'zero-delta Finish does not invent a session');
  await tap(page,3);await page.locator('#abp-japa-undo').click();assert.equal(await count(page),9);
  await page.locator('#abp-japa-custom').fill('21');await page.locator('#abp-japa-set-target').click();
  assert.equal(await page.locator('#abp-japa-progress').getAttribute('max'),'21','existing target control remains independent of history');
  const afterTaps=await legacy(page);await finish(page);assert.equal(await legacy(page),afterTaps,'Finish never rewrites counter');
  let value=await history(page);assert.equal(value.sessions.length,1);assert.equal(value.sessions[0].count,2,'ordinary Undo produces the corrected delta');
  assert.deepEqual(Object.keys(value.sessions[0]).sort(),['count','finishedAt','startedAt']);
  assert.ok(!JSON.stringify(value).includes('Private'),'history never copies prayer names or journey notes');
  assert.equal(await page.locator('[data-japa-session-finish]').isEnabled(),false);
  // Undo a tap that preceded Start: this goes below the baseline and must invalidate it.
  await tap(page);await start(page);await page.locator('#abp-japa-undo').click();
  await page.waitForFunction(()=>document.querySelector('[data-japa-session-finish]').disabled,null,{polling:100});
  assert.match(await page.locator('[data-japa-history-status]').textContent(),/continuity changed/);assert.equal((await history(page)).sessions.length,1);
  for(const id of ['abp-japa-fresh','abp-japa-reset']){
   await start(page);await page.locator('#'+id).click();await page.locator('#abp-japa-dialog [data-confirm]').click();
   await page.waitForFunction(()=>document.querySelector('[data-japa-session-finish]').disabled,null,{polling:100});
   assert.equal(await count(page),0);assert.equal((await history(page)).sessions.length,1,'confirmed restart cancels even a zero baseline');
  }
  await start(page);await tap(page);await page.locator('#abp-japa-undo').click();assert.equal(await count(page),0);
  assert.equal(await page.locator('[data-japa-session-finish]').isEnabled(),true,'Undo to the exact baseline keeps the recording valid');
  await page.locator('[data-japa-session-cancel]').click();
  await start(page);await tap(page);await page.locator('[data-japa-session-cancel]').click();assert.equal((await history(page)).sessions.length,1);assert.equal(await count(page),1,'Cancel preserves real counter');
  // Counter save failures must not cause history to baseline from stale persistent state.
  const diskCounter=await legacy(page);
  await page.evaluate(key=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new Error('counter write fixture');return set.call(this,k,v);};},COUNTER);
  await tap(page,2);const inMemory=await count(page);assert.equal(await legacy(page),diskCounter);
  await start(page);await tap(page,3);await page.locator('#abp-japa-undo').click();await finish(page);
  value=await history(page);assert.equal(value.sessions.at(-1).count,2,'baseline uses actual in-memory count despite rejected counter writes');
  assert.equal(await count(page),inMemory+2);assert.equal(await legacy(page),diskCounter);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hdc-journey-state-v1')),journey);assert.equal(await page.evaluate(()=>localStorage.getItem('hdc-reader-v1')),reader);
  // Native other-tab history changes, malformed records and unknown formats.
  const other=await context.newPage();await other.goto(base+'japa-counter/');
  const valid=await page.evaluate(key=>localStorage.getItem(key),KEY);
  for(const raw of ['{bad-json',JSON.stringify({schema:2,sessions:[]})]){
   await other.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:KEY,raw});await page.bringToFront();
   await start(page);await tap(page);await finish(page);
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),raw);assert.match(await page.locator('[data-japa-history-status]').textContent(),/unsupported format/);
   await page.locator('[data-japa-session-cancel]').click();
   await other.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key:KEY,raw:valid});
  }
  await other.locator('[data-japa-session-start]').click();await tap(other);await finish(other);await page.bringToFront();
  await page.waitForFunction(n=>document.querySelectorAll('[data-japa-history-list] li').length===n,3,{polling:100});
  assert.equal((await history(page)).sessions.at(-1).count,1,'real storage event updates the other tab');
  // Scope the confirmed erase to this store, preserving unknown fields in its known schema.
  await other.evaluate(key=>{const v=JSON.parse(localStorage.getItem(key));localStorage.setItem(key,JSON.stringify({...v,futureField:'keep'}));},KEY);
  const beforeEraseCounter=await legacy(page);
  await page.locator('[data-japa-history-erase] summary').click();assert.equal(await page.locator('[data-japa-history-erase-confirm]').isEnabled(),false);
  await page.locator('[data-japa-history-erase-consent]').check();await page.locator('[data-japa-history-erase-confirm]').click();
  assert.deepEqual(await history(page),{schema:1,sessions:[],futureField:'keep'});assert.equal(await legacy(page),beforeEraseCounter);
  assert.equal(await page.evaluate(()=>localStorage.getItem('hdc-journey-state-v1')),journey);assert.equal(await page.evaluate(()=>localStorage.getItem('hdc-reader-v1')),reader);
  // Failed history writes keep successive records for this visit and do not wipe the prior saved value.
  await start(page);await tap(page);await finish(page);
  const diskHistory=await page.evaluate(key=>localStorage.getItem(key),KEY);
  await page.evaluate(key=>{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new Error('history write fixture');return set.call(this,k,v);};},KEY);
  for(const n of [1,2]){await start(page);await tap(page,n);await finish(page);}
  assert.equal(await rows(page).count(),3);assert.match(await page.locator('[data-japa-history-status]').textContent(),/this visit only/);
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),diskHistory);
  await page.locator('[data-japa-history-erase] summary').click();await page.locator('[data-japa-history-erase-consent]').check();await page.locator('[data-japa-history-erase-confirm]').click();
  assert.equal(await rows(page).count(),0);assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),diskHistory,'blocked erase leaves saved history intact');
  // Reload starts from authoritative saved state; in-progress sessions never survive navigation.
  await page.reload();await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  await start(page);await tap(page);await page.locator('[data-japa-history]').getByRole('link',{name:'My Devotional Journey',exact:true}).click();await page.waitForURL(/journeys\/$/);
  await page.getByRole('link',{name:'View local Japa session history and record a session with the existing counter'}).click();await page.waitForURL(/japa-counter\/#japa-history$/);
  assert.equal(await page.locator('[data-japa-session-finish]').isEnabled(),false,'instant navigation discards only the unfinished recording');
  await page.evaluate(key=>{window.qaHistoryWrites=0;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)window.qaHistoryWrites++;return set.call(this,k,v);};},KEY);
  await start(page);await tap(page);await finish(page);assert.equal(await page.evaluate(()=>window.qaHistoryWrites),1,'one active history controller after navigation');
  assert.equal((await history(page)).sessions.length,2);
  const activeCount=await count(page);await start(page);
  await other.evaluate(key=>{const v=JSON.parse(localStorage.getItem(key));localStorage.setItem(key,JSON.stringify({...v,count:v.count+1}));},COUNTER);
  await page.waitForFunction(()=>document.querySelector('[data-japa-session-finish]').disabled,null,{polling:100});
  assert.match(await page.locator('[data-japa-history-status]').textContent(),/Another tab changed the counter/);assert.equal(await count(page),activeCount,'history does not reset or replace the existing in-memory counter');
  await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.ok(await page.locator('[data-japa-history] button:visible').evaluateAll(nodes=>nodes.every(n=>n.getBoundingClientRect().height>=44)));
  await page.locator('[data-japa-history] .hdc-practice-controls').scrollIntoViewIfNeeded();
  await page.screenshot({path:`work/japa-history/${width}-${theme}.png`});
  const beforeBlockedRead=await page.evaluate(key=>localStorage.getItem(key),KEY);
  await page.evaluate(key=>{window.originalJapaGet=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k===key)throw new Error('blocked read fixture');return window.originalJapaGet.call(this,k);};},KEY);
  await start(page);await tap(page);await finish(page);assert.match(await page.locator('[data-japa-history-status]').textContent(),/unsupported format/);
  await page.locator('[data-japa-session-cancel]').click();await page.evaluate(()=>{Storage.prototype.getItem=window.originalJapaGet;});
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),beforeBlockedRead,'blocked reads never overwrite saved history');
  await other.evaluate(key=>{const sessions=Array.from({length:50},(_,i)=>({startedAt:'2026-01-01T00:00:00.000Z',finishedAt:'2026-01-01T00:01:00.000Z',count:i+1}));localStorage.setItem(key,JSON.stringify({schema:1,sessions,futureField:'keep'}));},KEY);
  await start(page);await tap(page);await finish(page);value=await history(page);
  assert.equal(value.sessions.length,50);assert.equal(value.sessions[0].count,2);assert.equal(value.sessions.at(-1).count,1);assert.equal(value.futureField,'keep','bounded append preserves known-schema future fields');
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS Japa history ${width}px ${theme}: corrected deltas, continuity, persistence, privacy, cross-tab and cleanup`);
 }
 if(enabled){
  const offline=await browser.newContext({serviceWorkers:'allow'});await seed(offline);const page=await offline.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await offline.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller),null,{polling:100});
  assert.ok(await page.evaluate(async url=>Boolean(await caches.match(url)),base+'javascripts/abp-japa-history.js'),'real worker precaches the gated controller');
  assert.ok(await page.evaluate(async url=>Boolean(await caches.match(url)),base+'japa-counter/'),'real worker precaches the gated counter page for first offline use');
  await offline.setOffline(true);await page.goto(base+'japa-counter/');await start(page);await tap(page,2);await finish(page);
  assert.equal((await history(page)).sessions[0].count,2);assert.equal(await count(page),9);assert.deepEqual(errors,[]);await offline.close();
  console.log('PASS real first-install offline Japa recording, Finish and unchanged authoritative counter');
 }
}finally{await browser.close();server.kill();}
