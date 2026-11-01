// Computed-style regression for the shared system, including enhanced reading.
// This complements visual review; it is not a screen-reader certification.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4342'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4342/devotional/';
const routes=['library/','categories/01-deities-sub-deities-and-divine-forms/ganesha/','find/','panchang/','reader/','journeys/','sanctuary/','explore/'];
const report=[];await mkdir('work/design-system',{recursive:true});
try{
 for(const width of [320,768,1440])for(const theme of ['abp-light','abp-dark']){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let tokens;
  for(const route of routes){
   assert.equal((await page.goto(base+route)).status(),200,route);
   await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
   for(const enhanced of [false,true]){
    await page.evaluate(on=>{for(const c of ['abp-hc','abp-text-2','abp-cards','abp-spacing','abp-still'])document.documentElement.classList.toggle(c,on);},enhanced);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${route} ${width} ${theme} enhanced=${enhanced}: no overflow`);
    assert.ok(await page.locator('.hdc-bottom-navigation > :is(a,button) > span:visible').evaluateAll(nodes=>nodes.every(el=>{const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return r.left>=p.left-1&&r.right<=p.right+1&&r.bottom<=p.bottom+1&&r.bottom<=innerHeight&&el.scrollWidth<=el.clientWidth+1;})),'enlarged mobile labels remain inside their own touch targets and viewport');
    const controls=page.locator('main :is(button,select,input:not([type=hidden]),textarea,a[href]):visible');
    await controls.first().focus();await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(()=>{const el=document.activeElement,s=getComputedStyle(el);return el.matches(':focus-visible')&&((s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2)||s.boxShadow!=='none');}),'keyboard focus remains visibly painted');
    const link=page.locator('.hdc-practice a[href]:visible').first();
    if(await link.count()){await link.hover();await link.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished)));}
    const result=await page.evaluate(()=>{
     const rgb=c=>c.match(/[\d.]+/g)?.map(Number);
     const lum=c=>rgb(c).slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
     const background=el=>{for(let n=el;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor,a=rgb(c);if(a&&(a.length===3||a[3]===1))return c;}return null;};
     const failures=[];let checked=0;
     for(const el of document.querySelectorAll('.hdc-practice :is(p,label,button,select,textarea,a,h2,figcaption,summary),.hdc-festival :is(p,label,summary,select,a),.abp-sacred-intro p')){
      if(!el.getClientRects().length||el.closest('[hidden]')||el.disabled)continue;
      const s=getComputedStyle(el),bg=background(el);if(!bg)continue;
      const a=lum(s.color),b=lum(bg),ratio=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);checked++;
      if(ratio<4.5)failures.push({text:el.textContent.trim().slice(0,55),ratio,fg:s.color,bg});
     }
     const style=getComputedStyle(document.body),names=['--abp-paper','--abp-paper-2','--abp-ink','--abp-maroon','--abp-gold','--abp-serif','--abp-sans','--sacred-radius'];
     return {failures,checked,tokens:Object.fromEntries(names.map(k=>[k,style.getPropertyValue(k).trim()]))};
    });
    assert.deepEqual(result.failures,[],`${route} ${width} ${theme} enhanced=${enhanced}: text contrast`);
    assert.ok(result.checked>0);
    assert.ok(await page.locator('.hdc-practice :is(button,select,input:not([type=checkbox]),textarea):visible').evaluateAll(nodes=>nodes.every(el=>el.getBoundingClientRect().height>=44)),'preview form controls keep 44px touch height');
    if(!enhanced){if(!tokens)tokens=result.tokens;else assert.deepEqual(result.tokens,tokens,'one shared palette/type/radius contract across page types');}
    if(enhanced&&['reader/','library/','journeys/'].includes(route))await page.screenshot({path:`work/design-system/${route.replaceAll('/','_')}-${width}-${theme}-enhanced.png`});
    report.push({route,width,theme,enhanced,checkedText:result.checked});
   }
   if(route==='sanctuary/'){
    await page.evaluate(()=>document.documentElement.classList.remove('abp-still'));
    await page.locator('[data-light]').click();await page.locator('[data-effects]').check();
    assert.equal(await page.locator('[data-diya]').evaluate(el=>getComputedStyle(el).animationName),'none','reduced-motion preference suppresses optional effect');
    await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.documentElement.classList.add('abp-still'));
    assert.equal(await page.locator('[data-diya]').evaluate(el=>getComputedStyle(el).animationName),'none','saved stop-animation preference also suppresses the effect');
    await page.emulateMedia({reducedMotion:'reduce'});
   }
  }
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS shared tokens, contrast, enlarged high contrast and focus: ${width}px ${theme}`);
 }
}finally{await writeFile('work/design-system/report.json',JSON.stringify(report,null,2));await browser.close();server.kill();}
