// Targeted control/contrast checks, not a WCAG or assistive-technology certificate.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {THEMES} from '../docs/assets/festivals/living-presentation.mjs';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4382'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4382/devotional/',report={scope:'Targeted lab: control names, keyboard restore, measured solid-surface text contrast, touch sizes and containment. Not complete WCAG 2.2 AA/physical AT certification.',samples:[]};
try{
 for(const width of [320,768,1440])for(const scheme of ['abp-light','abp-dark']){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.goto(base);await page.waitForFunction(()=>document.querySelector('[data-living-status]')?.textContent.includes('disabled by'));
  await page.evaluate(scheme=>document.body.setAttribute('data-md-color-scheme',scheme),scheme);
  const summary=page.locator('.hdc-living > details > summary');await summary.focus();await summary.press('Enter');
  assert.equal(await page.locator('.hdc-living > details').getAttribute('open'),'');
  for(const name of ['Appearance','Region','Animation']){
   const control=page.getByRole('combobox',{name,exact:true});assert.equal(await control.count(),1);
   assert.equal(await control.evaluate(e=>e.labels.length),1,'one native label association');
  }
  await page.locator('[data-living-previews] > summary').click();
  for(const name of Object.values(THEMES).map(theme=>theme.name)){
   await page.getByRole('button',{name,exact:true}).click();
   const readings=await page.locator('.hdc-living').evaluate(root=>{
    const rgb=value=>{const m=value.match(/^rgba?\(([^)]+)\)$/);if(!m)throw Error('Unsupported measured colour '+value);return m[1].split(',').map(Number);};
    const luminance=rgb=>rgb.slice(0,3).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
    return [...root.querySelectorAll('summary,button,select,a,p')].filter(e=>e.getClientRects().length>0).map(e=>{
     const color=rgb(getComputedStyle(e).color);let node=e,background;
     while(node){const rgba=rgb(getComputedStyle(node).backgroundColor);if(rgba.length<4||rgba[3]===1){background=rgba;break;}node=node.parentElement;}
     if(!background)throw Error('No opaque reading surface');
     const f=luminance(color),b=luminance(background),rect=e.getBoundingClientRect();
     return {tag:e.tagName,ratio:(Math.max(f,b)+.05)/(Math.min(f,b)+.05),height:rect.height,name:e.textContent?.trim().slice(0,60)};
    });
   });
   for(const item of readings){assert.ok(item.ratio>=4.5,`${width} ${scheme} ${name}: ${item.name} contrast ${item.ratio}`);if(['SUMMARY','BUTTON','SELECT','A'].includes(item.tag))assert.ok(item.height>=44,`${item.name} touch target ${item.height}`);}
   assert.equal(await page.locator('h1').count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.equal(await page.locator('.hdc-living-scenery').getAttribute('aria-hidden'),'true');
   assert.equal(await page.locator('.hdc-living-scenery svg').first().evaluate(e=>getComputedStyle(e).animationName),'none');
   report.samples.push({width,scheme,theme:name,minimumMeasuredContrast:Math.min(...readings.map(r=>r.ratio)),controlsPassed:true});
  }
  const restore=page.getByRole('button',{name:'Restore original appearance now',exact:true});await restore.focus();
  await page.keyboard.press('Shift+Tab');await page.keyboard.press('Tab');
  assert.equal(await restore.evaluate(e=>e===document.activeElement),true,'keyboard reaches restore');
  assert.notEqual(await restore.evaluate(e=>getComputedStyle(e).outlineStyle),'none');await restore.press('Enter');
  assert.equal(await page.locator('[data-hdc-festival]').count(),0);assert.equal(await page.locator('.hdc-living-hero').count(),0);
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS V2 controls/contrast ${width}px ${scheme}`);
 }
 await writeFile('work/living-festival/accessibility.json',JSON.stringify(report,null,2));
}finally{await browser.close();server.kill();}
