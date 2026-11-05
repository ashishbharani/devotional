import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4368'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4368/devotional/';
await mkdir('work/reader-navigation',{recursive:true});
try{
 for(const width of [320,768,1440])for(const theme of ['abp-light','abp-dark']){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.goto(base+'reader/');await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  assert.equal(await page.locator('.hdc-reader-books article').count(),4);
  assert.equal(await page.locator('[data-reader]').count(),0,'removed demo does not clutter the book picker');
  await page.screenshot({path:`work/reader-navigation/books-${width}-${theme}.png`});
  for(const [title,id,groups,total,first,last] of [
   ['Mahabharata','mahabharata',18,1995,'नारायणं नमस्कृत्य','mbh-18-5'],
   ['Valmiki Ramayana','valmiki-ramayana',7,645,'तपः स्वाध्यायनिरतं','valmiki-7-111']]){
   await page.getByRole('link',{name:title,exact:true}).click();
   await page.waitForURL(base+`reader/${id}/`);
   await page.waitForFunction(n=>document.querySelectorAll('[data-book-contents] details').length===n,groups);
   assert.equal(await page.locator('[data-book-contents] details').count(),groups);
   assert.equal(await page.locator('[data-book-contents] details a').count(),total);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'book contents has no horizontal overflow');
   await page.locator('[data-book-contents] details > summary').first().click();
   await page.locator('[data-book-contents] details a').first().click();
   await page.waitForURL(base+`reader/${id}/chapter-1/`);
   await page.locator('.hdc-verse').waitFor({state:'visible'});
   await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
   assert.match(await page.locator('.hdc-verse').textContent(),new RegExp(first));
   assert.equal(await page.locator('[data-reader-share]').isVisible(),false,'advanced tools start collapsed');
   await page.locator('[data-bookmark]').click();assert.equal(await page.locator('[data-bookmark]').getAttribute('aria-pressed'),'true');
   await page.locator('[data-reader-options] > summary').click();await page.locator('[data-reader-size]').selectOption('1.25');
   await page.locator('[data-reader-query]').fill('not-in-this-chapter');assert.equal(await page.locator('[data-reader-empty]').isVisible(),true);
   await page.locator('[data-reader-query]').fill('');assert.equal(await page.locator('.hdc-verse').isVisible(),true);
   await page.screenshot({path:`work/reader-navigation/${id}-${width}-${theme}.png`});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.goto(base+`reader/${id}/chapter-${total}/#${last}`);assert.equal(await page.locator('#'+last).isVisible(),true);
   assert.equal(await page.getByRole('link',{name:/Next reading page/}).count(),0);
   await page.goto(base+'reader/');
  }
  await page.goto(base+'reader/#gita-2-47');await page.locator('#gita-2-47 a').click();await page.waitForURL(base+'reader/bhagavad-gita/chapter-2/#gita-2-47');assert.equal(await page.locator('[data-bookmark]').isVisible(),true,'old directory fragment links to the full chapter');
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS four-book navigation, epic endpoints, preserved deep links and decluttered controls ${width}px ${theme}`);
 }
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
 await page.goto(base+'reader/');await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 for(const id of ['mahabharata','valmiki-ramayana']){
  await page.getByRole('link',{name:id==='mahabharata'?'Mahabharata':'Valmiki Ramayana',exact:true}).click();
  await page.locator('[data-book-contents] details > summary').first().click();await page.locator('[data-book-contents] details a').first().click();
  const url=page.url();await page.waitForFunction(async url=>!!await caches.match(url),url);
  await page.locator('[data-bookmark]').click();await context.setOffline(true);await page.reload();
  assert.equal(await page.locator('[data-bookmark]').getAttribute('aria-pressed'),'true');assert.ok((await page.locator('.hdc-verse').textContent()).length>100);
  await context.setOffline(false);await page.goto(base+'reader/');
 }
 await context.close();console.log('PASS both epic visited chapters and bookmarks with real offline service worker');
}finally{await browser.close();server.kill();}
