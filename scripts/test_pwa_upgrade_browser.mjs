// Real worker lifecycle using the generated worker, with test-only old bytes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const root=path.resolve('site'),worker=await readFile('site/sw.js','utf8');
const version=worker.match(/const VERSION = "([^"]+)";/)?.[1];assert.ok(version);
const oldVersion='qa-previous-release',marker='/* QA previous release CSS */';let phase='old';
const oldWorker=worker.replace(`const VERSION = "${version}";`,`const VERSION = "${oldVersion}";`);
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.xml':'application/xml','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.wasm':'application/wasm','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');assert.ok(url.pathname.startsWith('/devotional/'));
 const relative=decodeURIComponent(url.pathname.slice(12));let file=path.resolve(root,relative);
 assert.ok(file===root||file.startsWith(root+path.sep));
 if(phase==='broken'&&relative==='stylesheets/practice.css')return res.writeHead(503,{'Cache-Control':'no-store'}).end('Intentional update fixture');
 if((await stat(file)).isDirectory())file=path.join(file,'index.html');
 let body=await readFile(file);
 if(relative==='sw.js')body=phase==='old'?oldWorker:worker;
 if(phase==='old'&&relative==='stylesheets/practice.css')body=Buffer.concat([body,Buffer.from('\n'+marker)]);
 res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);
}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/devotional/`,browser=await chromium.launch();
const evidence={scope:'Headless Chromium lifecycle; not native device installation or all historical worker formats.',oldVersion,newVersion:version};
await mkdir('work/pwa-upgrade',{recursive:true});
try{
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage(),errors=[];
 const failedRequests=[];page.on('requestfailed',r=>failedRequests.push({phase,type:r.resourceType(),url:r.url(),error:r.failure()?.errorText}));
 page.on('pageerror',e=>errors.push({phase,url:page.url(),message:e.message,stack:e.stack}));
 await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.goto(base+'sanctuary/');await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 const cacheText=()=>page.evaluate(async url=>(await caches.match(url))?.text(),base+'stylesheets/practice.css');
 assert.ok((await cacheText()).includes(marker),'old release actually cached before update');
 const saved={'abp-japa-state-v1':'{"count":108}','hdc-reader-v1':'{"bookmark":true}','hdc-journey-state-v1':'{"name":"Saved routine","minutes":10,"journal":"","sessions":[]}'};
 await page.evaluate(async data=>{for(const [k,v] of Object.entries(data))localStorage.setItem(k,v);await caches.open('unrelated-qa-cache');},saved);
 // A failed precache must not evict the working release or its offline view.
 phase='broken';
 const state=await page.evaluate(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  return new Promise(async(resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Update fixture timed out')),20000);
   registration.addEventListener('updatefound',()=>{const next=registration.installing;next.addEventListener('statechange',()=>{if(next.state==='redundant'||next.state==='activated'){clearTimeout(timer);resolve(next.state);}});},{once:true});
   try{await registration.update();}catch(error){clearTimeout(timer);reject(error);}
  });
 });
 assert.equal(state,'redundant','missing shell asset rejects the incomplete update');
 assert.ok((await cacheText()).includes(marker),'failed update keeps old cached styling');
 await context.setOffline(true);await page.reload();await page.locator('[data-light]').click();
 assert.equal(await page.locator('[data-light]').getAttribute('aria-pressed'),'true','old shell remains interactive offline');
 await context.setOffline(false);phase='current';
 await page.evaluate(async()=>{
  const registration=await navigator.serviceWorker.getRegistration();
  await new Promise(async(resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error('Successful activation timed out')),20000);
   registration.addEventListener('updatefound',()=>{const next=registration.installing;next.addEventListener('statechange',()=>{if(next.state==='activated'){clearTimeout(timer);resolve();}else if(next.state==='redundant'){clearTimeout(timer);reject(new Error('Restored update unexpectedly rejected'));}});},{once:true});
   try{await registration.update();}catch(error){clearTimeout(timer);reject(error);}
  });
 });
 evidence.cachesAfterUpdate=await page.evaluate(async url=>Promise.all((await caches.keys()).map(async name=>({name,oldCss:(await (await caches.open(name)).match(url))?await (await (await caches.open(name)).match(url)).text():null}))),base+'stylesheets/practice.css');
 evidence.cachesAfterUpdate=evidence.cachesAfterUpdate.map(c=>({name:c.name,hasOldCss:c.oldCss?.includes(marker),hasCss:c.oldCss!==null}));
 assert.ok(evidence.cachesAfterUpdate.every(c=>!c.name.includes(oldVersion)),'activation retires old caches');
 assert.ok(evidence.cachesAfterUpdate.some(c=>c.name===`udhc-shell-${version}`&&c.hasCss),'activated release has its complete shell');
 assert.ok(!(await cacheText()).includes(marker),'successful upgrade replaces old CSS bytes');
 assert.ok(await page.evaluate(async()=> (await caches.keys()).includes('unrelated-qa-cache')),'unrelated cache preserved');
 await context.setOffline(true);await page.goto(base+'sanctuary/?minutes=10');
 assert.equal(await page.locator('[data-duration]').inputValue(),'10');
 await page.locator('[data-start]').click();assert.match(await page.locator('[data-session]').textContent(),/remaining/);await page.locator('[data-stop]').click();
 await page.locator('[data-md-component="search-query"]').fill('Ganesha');
 await page.locator('.md-search-result__item').first().waitFor();
 assert.match(await page.locator('.md-search-result').textContent(),/Ganesha/i,'built-in Material search produces real offline results');
 await page.keyboard.press('Escape');
 assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),Object.keys(saved)),saved,'legacy Japa, reader and journey state survive failed and successful updates');
 evidence.errors=errors;evidence.failedRequests=failedRequests;assert.deepEqual(errors,[]);await context.close();evidence.result='PASS';
 console.log('PASS failed update retains offline shell; successful version transition replaces CSS, retires old caches, preserves unrelated cache and saved state');
}finally{await writeFile('work/pwa-upgrade/report.json',JSON.stringify(evidence,null,2));await browser.close();await new Promise(r=>server.close(r));}
