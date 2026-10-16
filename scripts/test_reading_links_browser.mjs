import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, stat, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const site=path.resolve('site'), shots='work/reading-links';
const raw=JSON.parse(await readFile('data/collection.json','utf8'));
const readers=JSON.parse(await readFile('hooks/library_readers.json','utf8'));
const books=raw.library.flatMap(s=>s.books);
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 assert.ok(url.pathname.startsWith('/devotional/'));
 let file=path.resolve(site,decodeURIComponent(url.pathname.slice(12)));
 assert.ok(file===site||file.startsWith(site+path.sep));
 if((await stat(file)).isDirectory())file=path.join(file,'index.html');
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream'}).end(await readFile(file));
}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/devotional/`;
const browser=await chromium.launch({...(process.env.PANCHANG_BROWSER?{executablePath:process.env.PANCHANG_BROWSER}:{})});
await mkdir(shots,{recursive:true});
try {
 for(const width of [320,768,1440]) {
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
  // Real reading samples are separately verified by the opt-in live audit.
  // Here we test our handoff without external network/login dependencies.
  await context.route('https://**/*',r=>r.fulfill({contentType:'text/html; charset=utf-8',body:'<title>External destination fixture</title>'}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  for(const route of ['', 'library/']) {
   await page.goto(base+route);
   if(!route)await page.locator('.abp-home-library > summary').click();
   assert.equal(await page.locator('.abp-book').count(),24);
   for(const b of books) {
    const card=page.locator('.abp-book').filter({has:page.getByRole('heading',{name:b.title,exact:true})});
    assert.equal(await card.count(),1);
    assert.equal(await card.locator('a').count(),4);
    const override=readers[b.title]||{};
    for(const key of ['open','english','hindi','listen']) {
     const link=card.locator('a').filter({hasText:new RegExp(`^${key.toUpperCase()}$`)});
     const expected=override[key]||b.links[key];
     assert.equal(await link.getAttribute('href'),expected);
     assert.equal(await link.getAttribute('target'),'_blank');
     assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
     assert.match(await link.getAttribute('aria-label'),/opens in a new tab/);
     if(key==='english') {
      const pending=page.waitForEvent('popup');await link.click();const popup=await pending;
      await popup.waitForLoadState();assert.equal(popup.url(),expected);await popup.close();
      const box=await link.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1);
     }
    }
   }
   assert.equal(await page.locator('iframe,dialog.abp-library-reader').count(),0,'rejected in-page reader must not return');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   const card=page.locator('.abp-book').filter({has:page.getByRole('heading',{name:'Valmiki Ramayana',exact:true})});
   await card.screenshot({path:`${shots}/${route?'library':'home'}-${width}.png`});
   console.log(`PASS ${route||'home'} ${width}px: 24 books, 96 correct links, 24 safe English popups, Listen/Hindi preserved, no iframe or overflow`);
  }
  await page.goto(base);
  await page.locator('.udhc-category').filter({hasText:'Vrat Katha & Parayan'}).click();
  await page.waitForURL('**/vrat-katha-parayan/');
  for(const id of ['vrat-katha','parayan','vrata-observances']) {
   assert.ok(await page.locator('#'+id).isVisible());
  }
  const hubLinks=await page.locator('.abp-page .abp-cards a').evaluateAll(a=>a.map(x=>({text:x.textContent,url:x.href})));
  assert.ok(hubLinks.some(x=>x.text==='Parayan'));
  assert.ok(hubLinks.some(x=>x.text==='Katha / Vrat Katha'));
  assert.ok(await page.locator('.abp-page .abp-card h3').first().evaluate(el=>el.getBoundingClientRect().width>100),'card content must fill its column, not the icon column');
  assert.equal(await page.locator('.abp-reading-footer a.abp-reading-link').count(),3,'all three footer links use the accessible collection-link style');
  assert.ok(await page.locator('.abp-reading-link').evaluateAll(a=>a.every(el=>el.getBoundingClientRect().height>=44)),'new collection and footer links have 44px touch targets');
  for(const name of ['Parayan','Katha / Vrat Katha']) {
   const link=page.getByRole('link',{name,exact:true});
   const destination=new URL(await link.getAttribute('href'),page.url()).href;
   await link.click();await page.waitForURL(destination);
   await page.locator('tr[data-work-id]').first().waitFor();
   assert.ok(await page.locator('h1').isVisible());
   assert.ok((await page.locator('tr[data-work-id]').count())>0,'canonical catalogue rows actually load');
   await page.goBack();await page.locator('#vrat-katha').waitFor();
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.locator('.abp-page').screenshot({path:`${shots}/hub-${width}.png`});
  await page.locator('#vrat-katha').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${shots}/hub-top-${width}.png`});
  assert.deepEqual(errors,[]);await context.close();
  console.log(`PASS discovery hub ${width}px: homepage tile, both canonical reading groups, browser Back, no overflow/JS errors`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
