import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const live=process.argv.includes('--live');
const folder=`work/reader-cleanup/${live?'before':'after'}`;
await mkdir(folder,{recursive:true});
const server=live?null:spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4367'},stdio:['ignore','pipe','inherit']});
if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch();
const base=live?'https://ashishbharani.github.io/devotional/':'http://127.0.0.1:4367/devotional/';
try{
 for(const width of [375,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'reader/');
  if(!live){
   assert.equal(await page.locator('[data-reader]').count(),0);
   assert.equal(await page.getByRole('heading',{name:'Saved reading — Bhagavad Gita 2.47'}).count(),0);
   assert.equal(await page.locator('.hdc-reader-books article').count(),4);
  }
  await page.screenshot({path:`${folder}/hub-${width}.png`,fullPage:true});
  await page.goto(base+'reader/ramcharitmanas/chapter-7/part-6/');
  if(!live){
   assert.equal(await page.getByRole('heading',{name:'Text source and reuse'}).count(),0);
   assert.equal(await page.locator('.hdc-reader-credit').count(),1);
   assert.ok(await page.locator('[data-reader-passage]').count());
   assert.ok(await page.getByRole('link',{name:/Previous reading page/}).count());
  }
  await page.locator(live?'h2:has-text("Text source and reuse")':'.hdc-reader-credit').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${folder}/book-end-${width}.png`});
  if(!live){assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
  await page.close();console.log(`PASS ${live?'baseline capture':'reader cleanup'} ${width}px`);
 }
}finally{await browser.close();server?.kill();}
