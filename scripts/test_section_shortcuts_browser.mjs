import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const data=JSON.parse(await readFile('site/assets/section-shortcuts.json','utf8')),map=new Map(data.sections.map(s=>[s.path,s.title]));
const root='categories/01-deities-sub-deities-and-divine-forms/',ganesha=root+'ganesha/',shiva=root+'shiva-mahesh/',pager=data.sections.find(s=>s.path.endsWith('/part-2/')).path;
assert.ok(map.has(ganesha)&&map.has(shiva)&&map.get(ganesha)!==map.get(shiva));
const key='hdc-section-shortcuts-v1',legacy={'abp-japa-state-v1':'{"count":108,"name":"Private synthetic prayer"}','hdc-reader-v1':'{"bookmark":true}','hdc-journey-state-v1':'{"journal":"Private synthetic note","sessions":[]}','hdc-journey-routines-v1':'{"schema":1,"routines":[]}'};
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4353'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4353/devotional/';await mkdir('work/section-shortcuts',{recursive:true});
const stored=page=>page.evaluate(key=>localStorage.getItem(key),key);
const savedWorks=page=>page.evaluate(async()=>{
 const db=await new Promise((resolve,reject)=>{const request=indexedDB.open('udhc-favourites');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
 try{return await Promise.all(['favourites','pending'].map(name=>new Promise((resolve,reject)=>{const tx=db.transaction(name,'readonly'),request=tx.objectStore(name).getAll();tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);})));}finally{db.close();}
});
async function pin(page){const details=page.locator('[data-section-shortcut-control] details');if(!await details.evaluate(el=>el.open))await details.locator('summary').click();await page.locator('[data-shortcut-save]').click();}
try{
 // A duplicate lifecycle notification must not cancel a user's Save while
 // the first registry request is still in flight (the CI first-save race).
 const startup=await browser.newContext({serviceWorkers:'block'}),startupPage=await startup.newPage();
 await startup.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 let releaseRegistry,seenRegistry;
 const registryGate=new Promise(resolve=>{releaseRegistry=resolve;}),registryRequested=new Promise(resolve=>{seenRegistry=resolve;});
 await startup.route('**/assets/section-shortcuts.json',async route=>{seenRegistry();await registryGate;await route.fulfill({json:data});});
 await startupPage.goto(base+ganesha);await pin(startupPage);await registryRequested;
 await startupPage.evaluate(()=>window.dispatchEvent(new Event('pageshow')));releaseRegistry();
 await startupPage.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.paths.includes('categories/01-deities-sub-deities-and-divine-forms/ganesha/'),key,{timeout:5000});
 assert.deepEqual(JSON.parse(await stored(startupPage)),{schema:1,paths:[ganesha]});await startup.close();
 console.log('PASS duplicate pageshow preserves a pending first section save');
 for(const [width,theme] of [[375,'abp-light'],[1440,'abp-dark']]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.goto(base+ganesha);await page.evaluate(legacy=>{for(const [key,value]of Object.entries(legacy))localStorage.setItem(key,value);},legacy);
  await page.locator('.abp-favourite').first().click();await page.waitForFunction(()=>document.querySelector('.abp-favourite')?.getAttribute('aria-pressed')==='true');const favouriteRecords=await savedWorks(page);assert.equal(favouriteRecords[0].length,1,'one actual canonical work saved through the original guest favourites implementation');
  await pin(page);await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key))?.paths.length===1,key);
  assert.deepEqual(JSON.parse(await stored(page)),{schema:1,paths:[ganesha]},'persist route only, no translated labels or private data');
  await page.locator('.abp-crumbs a[href$="'+root+'"]').click();await page.waitForURL(base+root);
  await page.locator('main a[href$="shiva-mahesh/"]').first().click();await page.waitForURL(base+shiva);
  await page.evaluate(key=>{window.shortcutWrites=0;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)window.shortcutWrites++;return set.call(this,k,v);};},key);
  await pin(page);await page.waitForFunction(()=>window.shortcutWrites===1);assert.equal(await page.evaluate(()=>window.shortcutWrites),1,'one active save listener after instant navigation');
  await pin(page);assert.equal(await page.evaluate(()=>window.shortcutWrites),1,'duplicate saving is idempotent');
  await page.goto(base+pager);await pin(page);await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).paths.length===3,key);
  assert.ok(JSON.parse(await stored(page)).paths.includes(pager),'preserve exact paginated route');
  await page.goto(base+'journeys/');await page.locator('[data-shortcut-items] a').nth(2).waitFor();
  assert.deepEqual(await page.locator('[data-shortcut-items] a').allTextContents(),[ganesha,shiva,pager].map(p=>map.get(p)),'resolve canonical raw source labels');
  await page.reload();await page.locator('[data-shortcut-items] a').nth(2).waitFor();
  const other=await context.newPage(),extra=data.sections.find(s=>![ganesha,shiva,pager].includes(s.path)).path;await other.goto(base+extra);await pin(other);
  await page.bringToFront();await page.locator('[data-shortcut-items] a').nth(3).waitFor();
  const valid=await stored(page);
  await other.evaluate(key=>{const value=JSON.parse(localStorage.getItem(key));localStorage.setItem(key,JSON.stringify({...value,extraSentinel:'preserve unknown fields'}));},key);
  await page.locator('[data-shortcut-items] button').first().click();await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).paths.length===3,key);
  assert.equal(JSON.parse(await stored(page)).extraSentinel,'preserve unknown fields');
  assert.ok(!JSON.stringify(JSON.parse(await stored(page))).includes('Private synthetic'));
  for(const [name,value] of Object.entries(legacy))assert.equal(await page.evaluate(key=>localStorage.getItem(key),name),value,'other stores unchanged');
  assert.deepEqual(await savedWorks(page),favouriteRecords,'section preferences never modify the original guest favourites database');
  const beforeClear=JSON.parse(await stored(page));await page.locator('[data-shortcut-erase-consent]').locator('..').locator('..').locator('summary').click();
  assert.equal(await page.locator('[data-shortcut-erase]').isDisabled(),true);await page.locator('[data-shortcut-erase-consent]').check();await page.locator('[data-shortcut-erase]').click();
  await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)).paths.length===0,key);assert.deepEqual(JSON.parse(await stored(page)),{...beforeClear,paths:[]},'erase only shortcut paths');
  await other.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value:valid});await page.locator('[data-shortcut-items] a').nth(3).waitFor();
  await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`work/section-shortcuts/journey-${width}.png`});
  await page.evaluate(key=>{const set=Storage.prototype.setItem;window.restoreShortcutStorage=()=>{Storage.prototype.setItem=set;};Storage.prototype.setItem=function(k,v){if(k===key)throw new Error('blocked shortcut fixture');return set.call(this,k,v);};},key);
  await page.locator('[data-shortcut-items] button').first().click();await page.locator('[data-shortcut-items] button').first().click();assert.equal(await page.locator('[data-shortcut-items] a').count(),2,'failed writes retain successive visit-only removals');assert.equal(await stored(page),valid);
  assert.match(await page.locator('[data-section-shortcut-list] [data-shortcut-status]').textContent(),/this visit only/);
  const future='{"schema":2,"paths":[]}';await other.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value:future});await page.bringToFront();await page.locator('[data-section-shortcut-list] [data-shortcut-status]').filter({hasText:'Another tab'}).waitFor();
  await page.evaluate(()=>window.restoreShortcutStorage());await page.locator('[data-shortcut-items] button').first().click();assert.equal(await page.locator('[data-shortcut-items] a').count(),2,'keep visit-only edits until an explicit reload after external changes');assert.equal(await stored(page),future,'permission recovery must not overwrite another tab future-format state');
  await other.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value:valid});
  await page.reload();await page.locator('[data-shortcut-items] a').nth(3).waitFor();
  for(const invalid of ['{"schema":2,"paths":[]}',JSON.stringify({schema:1,paths:['https://example.com/']}),JSON.stringify({schema:1,paths:['categories/not-an-existing-section/']})]){
   await other.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value:invalid});await page.goto(base+ganesha);await pin(page);await page.locator('[data-shortcut-status]').filter({hasText:'kept'}).waitFor();assert.equal(await stored(page),invalid,'malformed/future/unregistered records are not overwritten');
  }
  const ten={schema:1,paths:data.sections.filter(s=>s.path!==ganesha).slice(0,10).map(s=>s.path)};
  await other.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:ten});await pin(page);await page.locator('[data-shortcut-status]').filter({hasText:'Ten section'}).waitFor();assert.deepEqual(JSON.parse(await stored(page)),ten,'bounded library rejects an eleventh path without replacing earlier choices');
  await other.evaluate(({key,value})=>localStorage.setItem(key,value),{key,value:valid});
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS exact section identities, pagination, local/cross-tab persistence, scoped erase, blocked/corrupt storage and legacy preservation ${width} ${theme}`);
 }
 for(const invalid of [null,{schema:2,sections:[]}]){
  const unavailable=await browser.newContext({serviceWorkers:'block'}),page=await unavailable.newPage();
  await unavailable.route('**/assets/section-shortcuts.json',r=>r.fulfill({status:invalid?200:404,body:invalid?JSON.stringify(invalid):'unavailable',contentType:'application/json'}));await page.goto(base+ganesha);await page.evaluate(({key,path})=>localStorage.setItem(key,JSON.stringify({schema:1,paths:[path]})),{key,path:ganesha});const saved=await stored(page);await pin(page);await page.locator('[data-shortcut-status]').filter({hasText:'kept'}).waitFor();assert.equal(await stored(page),saved);await page.goto(base+'journeys/');await page.locator('[data-section-shortcut-list] [data-shortcut-status]').filter({hasText:'kept'}).waitFor();assert.equal(await page.locator('[data-shortcut-items] a').count(),0);assert.equal(await stored(page),saved);await unavailable.close();
 }
 const literal=await browser.newContext({serviceWorkers:'block'}),literalPage=await literal.newPage(),fixture=structuredClone(data),label='<img src=x onerror=window.shortcutInjected=true>';
 fixture.sections.find(s=>s.path===ganesha).title=label;await literal.route('**/assets/section-shortcuts.json',r=>r.fulfill({body:JSON.stringify(fixture),contentType:'application/json'}));await literalPage.goto(base+ganesha);await pin(literalPage);await literalPage.waitForFunction(key=>Boolean(localStorage.getItem(key)),key);await literalPage.goto(base+'journeys/');await literalPage.locator('[data-shortcut-items] a').waitFor();assert.equal(await literalPage.locator('[data-shortcut-items] a').textContent(),label);assert.equal(await literalPage.locator('[data-shortcut-items] img').count(),0);assert.equal(await literalPage.evaluate(()=>window.shortcutInjected),undefined);await literal.close();
 console.log('PASS unavailable registry fails closed without deleting saved paths');
}finally{await browser.close();server.kill();}
