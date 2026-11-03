import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';
const key='hdc-journey-state-v1',base='http://127.0.0.1:4354/devotional/';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4354'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch();
try{
 const context=await browser.newContext({viewport:{width:375,height:1000},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.goto(base);
 const original={name:'Stored routine',minutes:5,journal:'Private synthetic note',sessions:[],extraSentinel:{keep:'unknown fields'}};
 await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:original});
 await page.goto(base+'journeys/');
 await page.locator('[data-routine-name]').fill('Edited routine');await page.locator('[data-journey-save]').click();
 let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 assert.deepEqual(saved.extraSentinel,original.extraSentinel,'routine save must preserve unknown saved fields');
 await page.locator('[data-journal-clear]').click();await page.locator('[data-session-record]').click();
 saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 assert.deepEqual(saved.extraSentinel,original.extraSentinel);assert.equal(saved.journal,'');assert.equal(saved.sessions.length,1);
 for(const raw of ['{broken','[]',JSON.stringify({...original,schema:2}),JSON.stringify({...original,sessions:[{at:'bad',minutes:5}]})]){
  await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});await page.reload();
  await page.locator('[data-routine-name]').fill('Unsaved draft');
  for(const selector of ['[data-journey-save]','[data-journal-clear]','[data-session-record]']){
   await page.locator(selector).click();assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),raw,'invalid/future records must not be overwritten');
  }
  await page.locator('[data-log-erase] summary').click();await page.locator('[data-log-erase-consent]').check();await page.locator('[data-log-erase-confirm]').click();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),raw,'scoped log erase must preserve unsupported records');
  assert.equal(await page.locator('[data-routine-name]').inputValue(),'Unsaved draft');
 }
 await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:original});await page.reload();
 await page.evaluate(key=>{window.originalJourneyGet=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k===key)throw new Error('blocked read fixture');return window.originalJourneyGet.call(this,k);};},key);
 await page.locator('[data-journey-save]').click();await page.locator('[data-session-record]').click();
 await page.evaluate(()=>{Storage.prototype.getItem=window.originalJourneyGet;});
 assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),original,'blocked reads must never overwrite existing data');
 await page.evaluate(key=>{const set=Storage.prototype.setItem;window.restoreJourneyWrites=()=>{Storage.prototype.setItem=set;};Storage.prototype.setItem=function(k,v){if(k===key)throw new Error('blocked fixture');return set.call(this,k,v);};},key);
 await page.locator('[data-session-record]').click();await page.locator('[data-session-record]').click();
 assert.match(await page.locator('[data-journey-summary]').textContent(),/2 self-reported/);
 assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),original);
 const other=await context.newPage();await other.goto(base);const future=JSON.stringify({...original,schema:2});
 await other.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw:future});await page.bringToFront();
 await page.locator('[data-journey-load]').waitFor();await page.evaluate(()=>window.restoreJourneyWrites());
 await page.locator('[data-session-record]').click();assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),future,'visit-only recovery must not overwrite another tab newer schema');
 await page.locator('[data-journey-load]').click();assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),future);
 assert.match(await page.locator('[data-journey-summary]').textContent(),/2 self-reported/,'failed explicit load keeps visit-only history');
 await other.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key,value:original});await page.bringToFront();
 await page.locator('[data-journey-load]').click();
 assert.equal(await page.locator('[data-routine-name]').inputValue(),original.name,'explicit valid load replaces draft only when requested');
 await page.locator('[data-journey-save]').click();
 assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),original);
 assert.deepEqual(errors,[]);await context.close();console.log('PASS Journey unknown fields, invalid/future records, scoped erase and cross-tab visit-only recovery');
}finally{await browser.close();server.kill();}
