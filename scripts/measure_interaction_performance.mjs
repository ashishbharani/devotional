// Explicit finite lab experiment; never production analytics or field CWV.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {layoutMetrics,interactionMetrics} from './lab_metrics.mjs';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4360'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4360/devotional/';
const report={method:'Chromium CDP: cold contexts, real font requests, disabled HTTP cache and worker, 4x CPU, 150ms latency, 1.6Mbps download/750Kbps upload. Finite real click/key tasks; Event Timing p98 candidate, not field INP.',limitations:['One local host, not physical Android/iOS','No field RUM or CrUX','No production-origin/baseline comparison yet','External request failures are reported, not stubbed or treated as successful font loads'],samples:[]};
report.sourceCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
report.sourceStatus=execFileSync('git',['status','--short'],{encoding:'utf8'});
report.browser=browser.version();report.builtAssets={};
for(const path of ['javascripts/abp-practice.js','javascripts/abp-journeys.js','javascripts/abp-local-state.js','sw.js'])report.builtAssets[path]=createHash('sha256').update(await readFile('site/'+path)).digest('hex');
await mkdir('work/performance-input',{recursive:true});
try{
 for(const width of [375,1440])for(const route of ['','find/','reader/','journeys/']){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),failed=[],errors=[];
  page.on('requestfailed',request=>failed.push({url:request.url(),error:request.failure()?.errorText}));page.on('pageerror',error=>errors.push(error.message));
  const session=await context.newCDPSession(page);
  await session.send('Network.enable');await session.send('Network.setCacheDisabled',{cacheDisabled:true});
  await session.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1e6/8,uploadThroughput:750000/8});
  await session.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.addInitScript(()=>{
   window.hdcLab={lcp:null,shifts:[],events:[],gestures:0,supported:PerformanceObserver.supportedEntryTypes};
   for(const name of ['click','keydown'])document.addEventListener(name,e=>{if(e.isTrusted)hdcLab.gestures++;},{capture:true});
   try{new PerformanceObserver(list=>{for(const e of list.getEntries())hdcLab.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});}catch(_){}
   try{new PerformanceObserver(list=>{for(const e of list.getEntries())hdcLab.shifts.push({startTime:e.startTime,value:e.value,hadRecentInput:e.hadRecentInput});}).observe({type:'layout-shift',buffered:true});}catch(_){}
   try{new PerformanceObserver(list=>{for(const e of list.getEntries())hdcLab.events.push({interactionId:e.interactionId,duration:e.duration,name:e.name});}).observe({type:'event',buffered:true,durationThreshold:16});}catch(_){}
  });
  await page.goto(base+route,{timeout:120000});await page.evaluate(()=>document.fonts.ready);
  if(!route)await page.locator('.udhc-hero-art img').evaluate(img=>img.decode());
  // Defined quiet observation period before input; not a substitute for readiness.
  await page.waitForTimeout(3000);
  if(route==='reader/'){
   await page.locator('[data-bookmark]').click();await page.locator('[data-read]').click();
   await page.locator('[data-reader-query]').pressSequentially('śāntiḥ',{delay:80});await page.locator('[data-reader-query]').fill('');
   await page.locator('[data-reader-transliteration] summary').click();
  }else if(route==='journeys/'){
   await page.locator('[data-routine-name]').pressSequentially('Lab routine',{delay:80});
   await page.locator('[data-routine-passage-add]').click();await page.locator('[data-journey-save]').click();await page.locator('[data-session-record]').click();
  }else if(route==='find/'){
   const input=page.locator('#abp-q');await input.waitFor();
   await page.waitForFunction(()=>document.querySelector('#abp-lang')?.options.length>1,null,{timeout:120000});
   await input.pressSequentially('Hanuman',{delay:80});
   await page.waitForFunction(()=>document.querySelectorAll('#abp-results tr').length>0,null,{timeout:120000});
  }else{
   // Interact with the actual summary disclosure, retaining the current route.
   const disclosure=page.locator('main details > summary:visible').first();
   if(await disclosure.count()){await disclosure.click();await disclosure.click();}
   else{await page.locator('main h1').click();await page.keyboard.press('Tab');}
   const native=page.locator('.md-search__input'),opener=page.locator('.hdc-header .md-header__button[for="__search"]');
   if(await opener.isVisible())await opener.click();else await native.click();
   await page.waitForFunction(()=>document.querySelector('#__search')?.checked===true,null,{polling:100});
   await native.pressSequentially('Ganesha',{delay:80});
   await page.locator('.md-search-result__list a[href]').first().waitFor({timeout:120000});
   await page.keyboard.press('Escape');if(await page.locator('#__search').isChecked())await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(1500); // Flush Event Timing entries after the final painted interaction.
  const sample=await page.evaluate(()=>({...hdcLab,interactionCount:performance.interactionCount??null,visible:document.visibilityState,fonts:document.fonts.status}));
  assert.ok(sample.gestures>0,'real browser gestures were required');assert.ok(sample.lcp!==null,'LCP must be observed');assert.deepEqual(errors,[]);
  const metrics={...layoutMetrics(sample.shifts),...interactionMetrics(sample.events,sample.interactionCount)};
  const inp=metrics.labInpCandidateMs??metrics.belowThresholdMs;
  report.samples.push({width,route:route||'home',...metrics,lcpMs:sample.lcp,gestures:sample.gestures,nativeInteractionCount:sample.interactionCount,eventTimingSupported:sample.supported.includes('event'),fonts:sample.fonts,failedRequests:failed,targets:{lcp:sample.lcp<=2500,inpCandidate:sample.supported.includes('event')&&inp<=200,cls:metrics.labCls<=.1},events:sample.events});
  await writeFile('work/performance-input/report.json',JSON.stringify(report,null,2));
  await context.close();console.log(`MEASURED ${width}px ${route||'home'} LCP ${sample.lcp.toFixed(0)}ms, INP candidate ${metrics.labInpCandidateMs??'<16'}ms, CLS ${metrics.labCls.toFixed(4)}`);
 }
 report.allTargetsMet=report.samples.every(s=>Object.values(s.targets).every(Boolean));
 await writeFile('work/performance-input/report.json',JSON.stringify(report,null,2));
 console.log('Finite lab targets all met: '+report.allTargetsMet+'; see limitations and per-task results.');
}finally{await browser.close();server.kill();}
