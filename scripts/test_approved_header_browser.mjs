import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const port=4327,base=`http://127.0.0.1:${port}/devotional/`;
const preview=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:String(port)},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{preview.stdout.once('data',resolve);preview.once('error',reject);});
const browser=await chromium.launch();
const shots='work/approved-header-staging';await mkdir(shots,{recursive:true});
async function setup(options={}){
  const context=await browser.newContext({serviceWorkers:'block',reducedMotion:'reduce',...options});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await context.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  return context;
}
async function offer(page,outcome){await page.evaluate(outcome=>{
  const event=new Event('beforeinstallprompt',{cancelable:true});
  event.prompt=async()=>{window.__installCalls=(window.__installCalls||0)+1;};
  event.userChoice=Promise.resolve({outcome,platform:'web'});
  dispatchEvent(event);window.__installPrevented=event.defaultPrevented;
},outcome);}
try{
 for(const width of [320,390,768,1024,1280,1440])for(const scheme of ['abp-light','abp-dark']){
  const context=await setup({viewport:{width,height:1000},isMobile:width<600,hasTouch:width<600});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.stack));
  await page.goto(base);await page.waitForFunction(()=>Boolean(window.abpI18n));
  await page.evaluate(s=>document.body.setAttribute('data-md-color-scheme',s),scheme);
  const mobile=width<1200,header=page.locator('#hdc-install-header'),menu=page.locator('#hdc-install-menu');
  assert.equal(await page.locator('[data-install-app]').count(),2,'one control per intended entry point');
  assert.equal(await header.getAttribute('aria-label'),'Install HDC App');
  assert.equal(await header.getAttribute('title'),'Install Hindu Devotional Collection');
  assert.equal(await header.isVisible(),!mobile,'desktop install icon always visible even unavailable');
  assert.ok(await header.isDisabled(),'no unsolicited or unsupported prompt');
  assert.equal(await page.locator('.hdc-bottom-navigation').isVisible(),mobile);
  assert.equal(await page.locator('.hdc-bottom-navigation > a,.hdc-bottom-navigation > button').count(),6);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await offer(page,'dismissed');
  assert.equal(await page.evaluate(()=>window.__installCalls||0),0,'offering install never prompts without a click');
  assert.equal(await page.evaluate(()=>window.__installPrevented),true);
  await page.screenshot({path:`${shots}/header-${width}-${scheme}.png`});
  if(mobile){
    await page.locator('[data-open-section]').click();
    assert.equal(await page.locator('[aria-controls="abp-menu-5"]').getAttribute('aria-expanded'),'true','Tools opens existing complete submenu');
    assert.equal(await page.locator('.abp-language-btn').count(),1);
    assert.equal(await page.locator('.abp-account').count(),1);
    assert.ok(await menu.isVisible());
    assert.equal(await menu.locator('.hdc-install-label').innerText(),'Install App');
    await page.screenshot({path:`${shots}/menu-${width}-${scheme}.png`});
  }
  const entry=mobile?menu:header;
  await entry.click();
  await page.waitForFunction(()=>document.querySelector('#hdc-install-header').dataset.installState==='unavailable');
  assert.equal(await page.evaluate(()=>window.__installCalls),1);
  assert.match(await page.locator('#hdc-install-announcement').textContent(),/dismissed/);
  await offer(page,'accepted');await entry.click();
  await page.waitForFunction(()=>document.querySelector('#hdc-install-header').dataset.installState==='requested');
  assert.notEqual(await header.getAttribute('hidden'),'','acceptance alone is not a claim of installation');
  await page.evaluate(()=>dispatchEvent(new Event('appinstalled')));
  assert.equal(await header.getAttribute('data-install-state'),'installed');
  assert.ok(await header.isHidden());assert.ok(await menu.isHidden());
  if(mobile){await page.locator('.abp-menu-close').click();
    const bottom=await page.locator('.hdc-bottom-navigation').boundingBox(),feedback=await page.locator('.abp-feedback-float').boundingBox();
    assert.ok(feedback.y+feedback.height<=bottom.y,'feedback is above, never covering bottom navigation');
  }
  await page.goto(base+'library/');
  assert.equal(await page.locator('.abp-language-btn').count(),1,'no duplicate controls after navigation');
  assert.deepEqual(errors,[]);
  await context.close();console.log(`PASS approved header ${width}px ${scheme}: real entries, states, bottom menu, no overlap or runtime errors`);
 }
 for(const ipad of [false,true]){
  const context=await setup({viewport:{width:ipad?1024:390,height:1000},userAgent:ipad?'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari/605.1.15':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile Safari/604.1'});
  if(ipad)await context.addInitScript(()=>{Object.defineProperty(navigator,'platform',{get:()=> 'MacIntel'});Object.defineProperty(navigator,'maxTouchPoints',{get:()=>5});});
  const page=await context.newPage();await page.goto(base);await page.locator('.abp-menu-toggle').click();
  await page.locator('#hdc-install-menu').click();assert.match(await page.locator('.hdc-install-help').innerText(),/Safari.*Share.*Add to Home Screen/s);
  await page.keyboard.press('Escape');assert.equal(await page.locator('.hdc-install-help').count(),0);
  await context.close();console.log(`PASS ${ipad?'iPad desktop-UA':'iPhone'} explicit installation instructions and Escape`);
 }
 const context=await setup({viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{const original=window.matchMedia;window.matchMedia=query=>query==='(display-mode: standalone)'?{matches:true,addEventListener(){},removeEventListener(){}}:original.call(window,query);});
 const page=await context.newPage();await page.goto(base);assert.ok(await page.locator('#hdc-install-header').isHidden());assert.ok(await page.locator('#hdc-install-menu').isHidden());await context.close();
 const manifest=JSON.parse(await readFile('site/manifest.webmanifest','utf8'));assert.equal(manifest.id,'/devotional/');assert.equal(manifest.scope,'/devotional/');assert.equal(manifest.start_url,'/devotional/');
 for(const icon of manifest.icons){const data=await readFile('site/'+icon.src);assert.equal(data.readUInt32BE(16)+'x'+data.readUInt32BE(20),icon.sizes);}
 console.log('PASS standalone controls and manifest identity/dimensions');
}finally{await browser.close();preview.kill();}
