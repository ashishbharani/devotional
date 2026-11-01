import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,stat,writeFile,readdir} from 'node:fs/promises';
import {chromium} from 'playwright';
import {layoutMetrics} from './lab_metrics.mjs';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4337'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4337/devotional/';
await mkdir('work/release-qa',{recursive:true});
const report={scope:'Local lab only. Not physical-device installation, field LCP/INP/CLS or authenticated sync certification.',bytes:0,lab:[]};
try{
 for(const path of ['docs/javascripts/abp-practice.js','docs/javascripts/abp-festivals.js','docs/javascripts/abp-journeys.js','docs/javascripts/abp-discovery.js','docs/javascripts/abp-sharing.js','docs/stylesheets/practice.css','docs/stylesheets/festivals.css','docs/assets/festivals/themes.mjs'])report.bytes+=(await stat(path)).size;
 assert.ok(report.bytes<100*1024,'incremental feature code stays below the explicit 100 KiB source budget');
 const helpers=['sitemap.xml','assets/i18n.json','search/search_index.json',...(await readdir('site/assets/javascripts/workers')).filter(n=>/^search\..*\.min\.js$/.test(n)).map(n=>'assets/javascripts/workers/'+n)];
 report.offlineHelperBytes=0;for(const path of helpers)report.offlineHelperBytes+=(await stat('site/'+path)).size;
 assert.ok(report.offlineHelperBytes<4*1024*1024,'native search/navigation/language cache additions stay below 4 MiB');
 for(const width of [375,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  const page=await context.newPage();await page.addInitScript(()=>{
   window.__lab={lcp:null,shifts:[],sources:[],supported:PerformanceObserver.supportedEntryTypes};
   try{new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__lab.lcp=entry.startTime;}).observe({type:'largest-contentful-paint',buffered:true});}catch(_){}
   try{new PerformanceObserver(list=>{for(const entry of list.getEntries()){
    window.__lab.shifts.push({startTime:entry.startTime,value:entry.value,hadRecentInput:entry.hadRecentInput});
    if(entry.value>.05&&window.__lab.sources.length<8)window.__lab.sources.push({startTime:entry.startTime,value:entry.value,nodes:entry.sources.map(s=>({tag:s.node?.nodeName,id:s.node?.id,class:s.node?.getAttribute?.('class'),previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))});
   }}).observe({type:'layout-shift',buffered:true});}catch(_){}
  });
  await page.goto(base);await page.locator('.udhc-hero-art img').evaluate(img=>img.decode());
  // A declared observation interval, not a readiness workaround. Snapshot before
  // screenshot capture so its instrumentation is outside the measurement.
  await page.waitForTimeout(1000);
  const sample=await page.evaluate(()=>({observedLcpMs:window.__lab.lcp,shifts:window.__lab.shifts,largeShiftSources:window.__lab.sources,supported:window.__lab.supported,visibility:document.visibilityState,domContentLoadedMs:performance.getEntriesByType('navigation')[0].domContentLoadedEventEnd,resources:performance.getEntriesByType('resource').length}));
  const {shifts,...values}=sample;
  report.lab.push({width,...values,...layoutMetrics(shifts),notes:'Unthrottled localhost; external font CSS stubbed; 1000ms observation after load/image decode, before capture. Session-window lab CLS, not field CWV. INP not measured.'});
  await page.screenshot({path:`work/release-qa/lab-${width}.png`});
  await context.close();
 }
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
 await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 for(const path of helpers)assert.ok(await page.evaluate(async url=>Boolean(await caches.match(url)),base+path),'offline Material/language helper installed: '+path);
 await page.evaluate(()=>{localStorage.setItem('abp-japa-state-v1','{"count":54}');localStorage.setItem('hdc-journey-state-v1','{"name":"Offline test routine","minutes":10,"journal":"","sessions":[]}');});
 for(const minutes of [5,10,20])assert.ok(await page.evaluate(async url=>Boolean(await caches.match(url)),base+`sanctuary/?minutes=${minutes}`),'preset installed without a prior visit');
 await context.setOffline(true);
 for(const minutes of [5,10,20]){
  await page.goto(base+`sanctuary/?minutes=${minutes}`);assert.equal(await page.locator('[data-duration]').inputValue(),String(minutes));
  await page.locator('[data-start]').click();assert.match(await page.locator('[data-session]').textContent(),/remaining/);await page.locator('[data-stop]').click();
 }
 await page.goto(base+'journeys/');await page.locator('[data-routine-start]').click();await page.waitForURL(/minutes=10$/);assert.equal(await page.locator('[data-duration]').inputValue(),'10');
 await page.waitForFunction(()=>document.querySelector('[data-sanctuary] img').naturalWidth>0);
 assert.equal(await page.evaluate(()=>localStorage.getItem('abp-japa-state-v1')),'{"count":54}');
 await context.setOffline(false);await page.goto(base+'reader/');assert.equal(await page.locator('[data-reader-passage]').isVisible(),true);
 await context.close();report.offlinePresets='PASS: first-install 5/10/20, actual journey handoff, image and online recovery; legacy counter intact';
 console.log('PASS first-install offline presets, journey handoff, online recovery, approved image and incremental source budget');
}finally{await writeFile('work/release-qa/performance.json',JSON.stringify(report,null,2));await browser.close();server.kill();}
