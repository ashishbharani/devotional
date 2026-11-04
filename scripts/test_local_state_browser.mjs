import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4357'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4357/devotional/';
const fixtures={
 'hdc-sanctuary-v1':{effects:false},
 'hdc-reader-v1':{bookmark:false,read:false,size:1,spacing:1.8},
 'hdc-festival-preferences-v1':{mode:'original',region:'IN',effects:false},
 'hdc-journey-state-v1':{name:'Synthetic routine',minutes:5,journal:'Synthetic private note',sessions:[]},
 'hdc-journey-routines-v1':{schema:1,routines:[{id:'fixture',name:'Synthetic routine',minutes:5,extra:{keep:true}}]},
 'hdc-japa-history-v1':{schema:1,sessions:[]},
 'hdc-section-shortcuts-v1':{schema:1,paths:[]},
};
try{
 const context=await browser.newContext({serviceWorkers:'block'}),errors=[];
 context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 const page=await context.newPage(),other=await context.newPage();
 await page.goto(base);await other.goto(base);
 for(const [key,fixture] of Object.entries(fixtures)){
  const value={...fixture,extraEnvelope:{keep:['unknown nested data']}};
  // Exercise the real consumer's validator, not a permissive testing substitute.
  await page.evaluate(({key,value})=>{
   localStorage.setItem(key,JSON.stringify(value));const record=hdcLocalState.create({key});record.reload();
   const read=record.get();read.extraEnvelope.keep.push('must not mutate stored snapshot');
   const saved=record.write({...record.get(),testEdit:1});if(!saved.persisted)throw Error('Expected persistence');
  },{key,value});
  const valid={...value,testEdit:1};
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),valid);
  for(const raw of ['{malformed','null','[]',JSON.stringify({...valid,schema:2})]){
   assert.deepEqual(await page.evaluate(({key,raw,valid})=>{
    localStorage.setItem(key,raw);const record=hdcLocalState.create({key});let code;
    try{record.get();record.write(valid);}catch(error){code=error.code;}
    return {code,raw:localStorage.getItem(key)};
   },{key,raw,valid}),{code:'unsupported',raw});
  }
  await page.evaluate(({key,valid})=>{
   localStorage.setItem(key,JSON.stringify(valid));const record=hdcLocalState.create({key});record.reload();
   const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw Error('quota fixture');return set.call(this,k,v);};
   try{const result=record.write({...record.get(),visitOnly:true});if(result.persisted)throw Error('Expected visit only');}finally{Storage.prototype.setItem=set;}
   if(!record.get().visitOnly)throw Error('Visit-only draft was lost');
  },{key,valid});
  const future=JSON.stringify({...valid,schema:2,external:'keep future copy'});
  await other.evaluate(({key,future})=>localStorage.setItem(key,future),{key,future});
  await page.waitForFunction(key=>hdcLocalState.create({key}).conflicted,key);
  assert.deepEqual(await page.evaluate(({key,valid})=>{
   const record=hdcLocalState.create({key});let code;try{record.write(valid);}catch(error){code=error.code;}
   return {code,raw:localStorage.getItem(key),visitOnly:record.snapshot().visitOnly};
  },{key,valid}),{code:'conflict',raw:future,visitOnly:true});
  // Invalid explicit reload must preserve the private in-memory draft.
  assert.equal(await page.evaluate(key=>{const r=hdcLocalState.create({key});try{r.reload();}catch(_){}return r.snapshot().visitOnly;},key),true);
  await other.evaluate(({key,valid})=>localStorage.setItem(key,JSON.stringify(valid)),{key,valid});
  await page.evaluate(key=>hdcLocalState.create({key}).reload(),key);
  // Removal is an external change too; never resurrect a stale dirty record.
  await page.evaluate(key=>{const r=hdcLocalState.create({key}),set=Storage.prototype.setItem;Storage.prototype.setItem=()=>{throw Error('quota');};try{r.write({...r.get(),visitOnly:true});}finally{Storage.prototype.setItem=set;}},key);
  await other.evaluate(key=>localStorage.removeItem(key),key);
  await page.waitForFunction(key=>hdcLocalState.create({key}).conflicted,key);
  assert.equal(await page.evaluate(key=>{try{hdcLocalState.create({key}).write(hdcLocalState.create({key}).snapshot());return 'wrote';}catch(e){return e.code;}},key),'conflict');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),null);
  console.log('PASS real consumer compatibility, unknown fields, malformed/future formats, blocked writes, cross-tab recovery/removal: '+key);
 }
 // Actual UI regression for AF1: preserve both library envelope and row fields.
 const libraryKey='hdc-journey-routines-v1';
 await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:libraryKey,value:{...fixtures[libraryKey],extraEnvelope:{keep:true}}});
 await page.goto(base+'journeys/');await page.locator('[data-routine-name]').fill('New synthetic routine');await page.locator('[data-routine-library-save]').click();
 let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),libraryKey);
 assert.deepEqual(saved.extraEnvelope,{keep:true});assert.deepEqual(saved.routines[0].extra,{keep:true});assert.equal(saved.routines.length,2);
 // Actual UI regression for AF2: unfamiliar reader fields survive bookmark edits.
 const readerKey='hdc-reader-v1';
 await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:readerKey,value:{...fixtures[readerKey],sourceMetadata:{keep:true}}});
 await page.goto(base+'reader/bhagavad-gita/chapter-2/#gita-2-47');await page.locator('[data-bookmark]').click();
 saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),readerKey);
 assert.deepEqual(saved.sourceMetadata,{keep:true});assert.equal(saved.bookmark,true);
 // Actual UI regression for AF3: failed Finish then newer external history.
 const historyKey='hdc-japa-history-v1';
 await page.evaluate(({key,value})=>localStorage.setItem(key,JSON.stringify(value)),{key:historyKey,value:fixtures[historyKey]});
 await page.goto(base+'japa-counter/');
 await page.evaluate(key=>{const set=Storage.prototype.setItem;window.restoreHistoryWrite=()=>{Storage.prototype.setItem=set;};Storage.prototype.setItem=function(k,v){if(k===key)throw Error('quota fixture');return set.call(this,k,v);};},historyKey);
 await page.locator('[data-japa-session-start]').click();await page.locator('#abp-japa-tap').click();await page.locator('[data-japa-session-finish]').click();
 assert.match(await page.locator('[data-japa-history-status]').textContent(),/this visit only/);
 const future=JSON.stringify({schema:2,sessions:[],external:'must survive'});
 await other.evaluate(({key,future})=>localStorage.setItem(key,future),{key:historyKey,future});
 await page.waitForFunction(key=>hdcLocalState.create({key}).conflicted,historyKey);
 await page.evaluate(()=>window.restoreHistoryWrite());
 await page.locator('[data-japa-session-start]').click();await page.locator('#abp-japa-tap').click();await page.locator('[data-japa-session-finish]').click();
 assert.equal(await page.evaluate(key=>localStorage.getItem(key),historyKey),future);
 assert.deepEqual(errors,[]);await context.close();
 console.log('PASS AF1/AF2/AF3 real UI regressions and no page exceptions');
}finally{await browser.close();server.kill();}
