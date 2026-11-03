import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4359'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4359/devotional/',key='hdc-journey-state-v1',libraryKey='hdc-journey-routines-v1';
const compact=JSON.parse(await readFile('site/assets/works-index.json','utf8'));
try{
 for(const width of [375,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),errors=[];
  context.on('page',p=>p.on('pageerror',e=>errors.push(e.message)));
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  const page=await context.newPage();await page.goto(base+'journeys/');
  await page.locator('[data-routine-name]').fill('Synthetic selected-work routine');
  await page.locator('[data-routine-work-query]').fill('Hanuman Chalisa');await page.locator('[data-routine-work-search]').click();
  const results=page.locator('[data-routine-result-id]');await results.first().waitFor();
  const ids=[await results.nth(0).getAttribute('data-routine-result-id'),await results.nth(1).getAttribute('data-routine-result-id')];
  assert.notEqual(ids[0],ids[1]);for(const id of ids)assert.ok(compact.works.some(w=>w[6]===id));
  await results.nth(0).click();await results.nth(1).click();await page.locator('[data-routine-passage-add]').click();
  await page.locator('[data-routine-references] li').nth(2).waitFor();
  assert.equal(await page.locator('[data-routine-references] li').count(),3);
  await page.locator('[data-routine-library-save]').click();await page.locator('[data-journey-save]').click();
  let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  assert.deepEqual(saved.references.map(r=>r.id),[...ids,'gita-2-47']);
  let library=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),libraryKey);
  assert.deepEqual(library.routines[0].references,saved.references);
  assert.equal(Object.hasOwn(library.routines[0],'journal'),false);
  await page.reload();await page.locator('[data-routine-references] li').nth(2).waitFor();
  for(const id of ids){
   const work=compact.works.find(w=>w[6]===id),link=page.locator(`[data-routine-work-id="${id}"]`);
   assert.equal(await link.textContent(),'Open '+work[0]);assert.equal(await link.getAttribute('href'),new URL(compact.places[work[5]][0].split('#')[0]+'#work-'+id,base).href);
  }
  const completed=page.locator('[data-reference-done]').first();
  await completed.focus();await page.keyboard.press('Space');
  assert.equal(await completed.isChecked(),true);assert.equal(await completed.evaluate(el=>el===document.activeElement),true,'completion toggle retains visible keyboard focus');
  await page.keyboard.press('Space');
  assert.equal(await completed.isChecked(),false);assert.equal(await completed.evaluate(el=>el===document.activeElement),true,'Space reverses completion without navigating back');
  await completed.check();await page.locator('[data-journey-save]').click();await page.locator('[data-session-record]').click();
  saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  assert.equal(saved.references[0].done,true);assert.equal(saved.references[1].done,false);assert.deepEqual(saved.sessions.at(-1).references,saved.references);
  await page.locator('[data-routine-library]').selectOption(library.routines[0].id);assert.equal(await page.locator('[data-reference-done]').first().isChecked(),false,'saved library routine and active progress stay independent');
  // Explicit load is the only action that replaces an unsaved routine draft.
  await page.locator('[data-routine-work-query]').fill('Private draft query');
  const other=await context.newPage();await other.goto(base);
  const future=JSON.stringify({...saved,schema:2});await other.evaluate(({key,future})=>localStorage.setItem(key,future),{key,future});
  await page.locator('[data-journey-load]:visible').waitFor();await page.locator('[data-journey-save]').click();
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),future);assert.equal(await page.locator('[data-routine-work-query]').inputValue(),'Private draft query');
  const remove=page.locator('[data-reference-remove]'),nextToken=await remove.nth(1).getAttribute('data-reference-remove');
  await remove.first().focus();await page.keyboard.press('Enter');
  await page.waitForFunction(token=>document.activeElement?.dataset.referenceRemove===token,nextToken);
  assert.equal(await remove.count(),2,'removed only the chosen draft reference');
  await remove.last().focus();await page.keyboard.press('Enter');
  await page.waitForFunction(token=>document.activeElement?.dataset.referenceRemove===token,nextToken);
  assert.equal(await remove.count(),1,'last-row removal focuses the surviving previous control');
  await remove.first().focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.activeElement===document.querySelector('[data-routine-passage-add]'));
  assert.equal(await remove.count(),0,'final removal focuses the surviving add-passage control');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),key),future,'draft focus repair never overwrites future saved data');
  assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await context.close();console.log(`PASS canonical routine references, independent completion, reload, session snapshot and future-record preservation ${width}px`);
 }
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 await page.goto(base+'journeys/');await page.locator('[data-routine-name]').fill('Offline synthetic routine');
 await page.locator('[data-routine-work-query]').fill('Hanuman');await page.locator('[data-routine-work-search]').click();
 await page.locator('[data-routine-result-id]').first().waitFor();await context.setOffline(true);
 await page.locator('[data-routine-result-id]').first().click();await page.locator('[data-routine-library-save]').click();await page.reload();
 const library=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),libraryKey);assert.equal(library.routines[0].references[0].type,'work');
 await page.locator('[data-routine-library]').selectOption(library.routines[0].id);await page.locator('[data-routine-work-id]').waitFor();
 await context.close();console.log('PASS real worker cached on-demand catalogue, offline reference save and routine reopening');
}finally{await browser.close();server.kill();}
