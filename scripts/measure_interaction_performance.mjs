// Explicit finite lab experiment; never production analytics or field CWV.
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {chromium} from 'playwright';
import {layoutMetrics,interactionMetrics} from './lab_metrics.mjs';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4360',HDC_PREVIEW_GZIP:'1'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4360/devotional/';
const baseline=process.env.HDC_PERFORMANCE_VARIANT==='baseline',legacy=process.env.HDC_PERFORMANCE_VARIANT==='legacy-control',livingOriginal=process.env.HDC_PERFORMANCE_VARIANT==='living-original',living=process.env.HDC_PERFORMANCE_VARIANT==='living'||livingOriginal,siteDir=process.env.HDC_SITE_DIR||'site';
const output=process.env.HDC_PERFORMANCE_OUTPUT||'work/performance-input/report.json';
const report={method:'Chromium CDP: cold contexts, real font requests, gzip text transport matching public Pages, disabled HTTP cache and worker, 4x CPU, 150ms latency, 1.6Mbps download/750Kbps upload. Finite real click/key tasks; Event Timing p98 candidate, not field INP.',limitations:['One local host, not physical Android/iOS','No field RUM or CrUX','Separate baseline/candidate reports; no production-origin field comparison','External request failures are reported, not stubbed or treated as successful font loads'],samples:[]};
report.taskRevision='native-search-real-advancing-clock-v3';
// Keep the browser's real advancing Date/timers. A fixed Date.now with real
// timers can stall Material/RxJS focus scheduling and invalidate this lab.
// Only synthetic fixture boundaries move; no published dates are altered.
const referenceDate=new Date(),dayAt=delta=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(referenceDate.getTime()+delta*86400000));
report.clockPolicy='Unmodified advancing browser clock; synthetic celebration spans reference IST day minus/plus one';
report.fixtureReferenceDay=living?dayAt(0):null;
report.variant=legacy?'legacy-matched-control':livingOriginal?'living-original-control':living?'living-festival-fixture':baseline?'baseline':'candidate';
if(living)report.limitations.push('Synthetic V2 celebration fixture, reduced motion to match the baseline; no religious date approval or physical-device animation certification. Single-run values are indicative, not a regression/CWV certificate.');
report.benchmarkCommit=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
report.sourceCommit=execFileSync('git',['-C',process.env.HDC_PERFORMANCE_SOURCE_DIR||'.','rev-parse','HEAD'],{encoding:'utf8'}).trim();
report.builtSourceCommit=process.env.HDC_PERFORMANCE_BUILD_COMMIT||report.sourceCommit;
report.sourceStatus=execFileSync('git',['-C',process.env.HDC_PERFORMANCE_SOURCE_DIR||'.','status','--short'],{encoding:'utf8'});
report.browser=browser.version();report.builtAssets={};
for(const file of ['javascripts/abp-practice.js','javascripts/abp-journeys.js','javascripts/abp-local-state.js','sw.js',...(living?['javascripts/abp-living-festivals.js','assets/festivals/living-scheduler.mjs','assets/festivals/living-presentation.mjs','assets/festivals/living-registry.json','assets/festivals/living-policy.json']:[])]){
 try{report.builtAssets[file]=createHash('sha256').update(await readFile(path.join(siteDir,file))).digest('hex');}
 catch(error){if(!baseline||error.code!=='ENOENT')throw error;report.builtAssets[file]=null;}
}
if(baseline)report.limitations.push('Only existing home/find tasks have a production baseline; the new Reader/Journey have no equivalent old interface.');
try{
 const manifest=JSON.parse(await readFile(path.join(siteDir,'assets/stylesheet-bundle.json'),'utf8'));
 report.stylesheetBundle={...manifest,sha256:createHash('sha256').update(await readFile(path.join(siteDir,manifest.bundle))).digest('hex')};
}catch(error){if(error.code!=='ENOENT')throw error;}
await mkdir(path.dirname(output),{recursive:true});
try{
 for(const width of [375,1440])for(const route of baseline||living||legacy?['','find/']:['','find/','reader/bhagavad-gita/chapter-2/','journeys/']){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),failed=[],errors=[];
  if(living||legacy){
   const registry=JSON.parse(await readFile('docs/assets/festivals/living-registry.json','utf8'));
   registry.windows=[{id:'synthetic-performance',family:'diwali',theme:'diwali',name:'Synthetic performance fixture — not a festival date',tradition:'Lab only',regions:['IN'],priority:1,start:dayAt(-1),end:dayAt(1),status:'verified',approval:{approved:true,reviewer:'Lab fixture only',reviewedOn:'2026-01-01'},sources:[{url:'https://example.invalid/lab-only',label:'Synthetic performance evidence',reviewedOn:'2026-01-01'}]}];
   await context.route('**/assets/festivals/living-registry.json',r=>r.fulfill({json:registry}));
   await context.route('**/assets/festivals/living-policy.json',r=>r.fulfill({json:{schema:1,enabled:true,previewEnabled:false}}));
   if(livingOriginal)await page.addInitScript(()=>localStorage.setItem('hdc-living-festival-preferences-v2',JSON.stringify({schema:2,mode:'original',region:'IN',effects:'auto'})));
  }
  page.on('requestfailed',request=>failed.push({url:request.url(),error:request.failure()?.errorText}));page.on('pageerror',error=>errors.push(error.message));
  const session=await context.newCDPSession(page);
  await session.send('Network.enable');await session.send('Network.setCacheDisabled',{cacheDisabled:true});
  await session.send('Network.emulateNetworkConditions',{offline:false,latency:150,downloadThroughput:1.6*1e6/8,uploadThroughput:750000/8});
  await session.send('Emulation.setCPUThrottlingRate',{rate:4});
  await page.addInitScript(()=>{
   window.hdcLab={lcp:null,lcpElement:null,shifts:[],events:[],gestures:0,inputTimes:[],supported:PerformanceObserver.supportedEntryTypes};
   for(const name of ['click','keydown'])document.addEventListener(name,e=>{if(e.isTrusted){hdcLab.gestures++;hdcLab.inputTimes.push(performance.now());}},{capture:true});
   try{new PerformanceObserver(list=>{for(const e of list.getEntries()){hdcLab.lcp=e.startTime;hdcLab.lcpElement={tag:e.element?.tagName,id:e.element?.id,className:e.element?.className,url:e.url,loadTime:e.loadTime,renderTime:e.renderTime,size:e.size};}}).observe({type:'largest-contentful-paint',buffered:true});}catch(_){}
   try{new PerformanceObserver(list=>{for(const e of list.getEntries())hdcLab.shifts.push({startTime:e.startTime,value:e.value,hadRecentInput:e.hadRecentInput,sources:e.sources?.map(s=>({node:s.node?.outerHTML?.slice(0,180),previous:s.previousRect.toJSON(),current:s.currentRect.toJSON()}))});}).observe({type:'layout-shift',buffered:true});}catch(_){}
   try{new PerformanceObserver(list=>{for(const e of list.getEntries())hdcLab.events.push({interactionId:e.interactionId,duration:e.duration,name:e.name});}).observe({type:'event',buffered:true,durationThreshold:16});}catch(_){}
  });
  await page.goto(base+route,{timeout:120000});await page.evaluate(()=>document.fonts.ready);
  if(living)await page.waitForFunction(original=>original?document.querySelector('[data-living-status]')?.textContent.includes('appearance selected'):document.documentElement.dataset.hdcStage==='celebration',livingOriginal);
  if(!route)await page.locator('.udhc-hero-art img').evaluate(img=>img.decode());
  // Defined quiet observation period before input; not a substitute for readiness.
  await page.waitForTimeout(3000);
  let taskError=null;
  try{if(route.startsWith('reader/')){
   await page.locator('[data-reader-options] > summary').click();
   await page.locator('[data-bookmark]').click();await page.locator('[data-read]').click();
   await page.locator('[data-reader-query]').pressSequentially('2.47',{delay:80});await page.locator('[data-reader-query]').fill('');
   await page.locator('[data-reader-size]').selectOption('1.5');
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
   // Desktop's existing lazy search reacts to key input as its worker/index
   // becomes ready. Requiring an expanded overlay BEFORE typing can deadlock
   // this lab despite a usable search field. Keep the actual seven key presses,
   // then require the open overlay and real results; never toggle DOM state.
   await native.pressSequentially('Ganesha',{delay:80});
   await page.waitForFunction(()=>document.querySelector('#__search')?.checked===true,null,{polling:100});
   await page.waitForFunction(()=>{const e=document.querySelector('.md-search__inner');return e.getBoundingClientRect().width>0&&getComputedStyle(e).opacity!=='0';},null,{timeout:5000});
   await page.locator('.md-search-result__list a[href]').first().waitFor({timeout:120000});
   await page.keyboard.press('Escape');if(await page.locator('#__search').isChecked())await page.keyboard.press('Escape');
  }}catch(error){
   // A broken baseline task must remain a failure, without losing its load trace
   // or preventing the other comparable routes from being measured.
   taskError=error.message;
   await page.screenshot({path:path.join(path.dirname(output),`${baseline?'baseline':'candidate'}-${width}-${route.replaceAll('/','')||'home'}-task-failure.png`)});
  }
  await page.waitForTimeout(1500); // Flush Event Timing entries after the final painted interaction.
  const sample=await page.evaluate(()=>({...hdcLab,interactionCount:performance.interactionCount??null,visible:document.visibilityState,fonts:document.fonts.status,paintResources:performance.getEntriesByType('resource').filter(r=>r.name===hdcLab.lcpElement?.url||/fonts\.(googleapis|gstatic)\.com/.test(r.name)).map(r=>({url:r.name,duration:r.duration,responseEnd:r.responseEnd,transferSize:r.transferSize}))}));
  assert.ok(sample.gestures>0,'real browser gestures were required');assert.ok(sample.lcp!==null,'LCP must be observed');assert.deepEqual(errors,[]);
  const metrics={...layoutMetrics(sample.shifts),...interactionMetrics(sample.events,sample.interactionCount)};
  const inp=metrics.labInpCandidateMs??metrics.belowThresholdMs;
  report.samples.push({width,route:route||'home',...metrics,lcpMs:sample.lcp,lcpElement:sample.lcpElement,paintResources:sample.paintResources,gestures:sample.gestures,inputTimes:sample.inputTimes,nativeInteractionCount:sample.interactionCount,eventTimingSupported:sample.supported.includes('event'),fonts:sample.fonts,failedRequests:failed,taskError,targets:{task:taskError===null,lcp:sample.lcp<=2500,inpCandidate:sample.supported.includes('event')&&inp<=200,cls:metrics.labCls<=.1},events:sample.events,shifts:sample.shifts});
  await writeFile(output,JSON.stringify(report,null,2));
  await context.close();console.log(`MEASURED ${width}px ${route||'home'} LCP ${sample.lcp.toFixed(0)}ms, INP candidate ${metrics.labInpCandidateMs??'<16'}ms, CLS ${metrics.labCls.toFixed(4)}`);
 }
 report.allTargetsMet=report.samples.every(s=>Object.values(s.targets).every(Boolean));
 await writeFile(output,JSON.stringify(report,null,2));
 console.log('Finite lab targets all met: '+report.allTargetsMet+'; see limitations and per-task results.');
}finally{await browser.close();server.kill();}
