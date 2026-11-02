// Capture comparable header states; a multi-panel board is not a full-page target.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const live=process.argv.includes('--live');
const folder=`work/design-board-${live?'before':'after'}`;
await mkdir(folder,{recursive:true});
const server=live?null:spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4340'},stdio:['ignore','pipe','inherit']});
if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch();
try {
 for(const width of [320,390,768,1280,1536])for(const theme of ['abp-light','abp-dark']) {
  const context=await browser.newContext({viewport:{width,height:1024},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await context.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(live?'https://ashishbharani.github.io/devotional/':'http://127.0.0.1:4340/devotional/');
  await page.waitForSelector('.abp-language-btn',{state:'attached'});
  await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  await page.locator('.hdc-header img:visible').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  await page.locator('.abp-navigation-shell').screenshot({path:`${folder}/${width}-${theme}-header.png`});
  if(!live) {
   assert.deepEqual(errors,[]);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(width>=1200) {
    const logo=page.locator('.hdc-wordmark-desktop');
    assert.ok(await logo.isVisible());
    const b=await logo.boundingBox();
    assert.ok(b.width>=430,JSON.stringify(await logo.evaluate(el=>[el,el.parentElement].map(x=>({width:getComputedStyle(x).width,maxWidth:getComputedStyle(x).maxWidth,flex:getComputedStyle(x).flex,rect:x.getBoundingClientRect().toJSON()})))));
    assert.ok(Math.abs(b.width/b.height-562/75)<.01,'native board wordmark aspect ratio');
    const header=await page.locator('.hdc-header').boundingBox();
    assert.ok(Math.abs(header.height-78)<2,'78px board top bar');
   }
  }
  if(width===1536) {
   await page.locator('.abp-navigation__section').filter({hasText:'DEVOTIONAL WORKS'}).click();
   await page.screenshot({path:`${folder}/${width}-${theme}-menu.png`});
   await page.keyboard.press('Escape');
  } else if(width===390) {
   await page.locator('.hdc-bottom-navigation').screenshot({path:`${folder}/${width}-${theme}-dock.png`});
  }
  await context.close();
  console.log(`PASS ${live?'baseline capture':'board geometry'} ${width} ${theme}`);
 }
} finally {await browser.close();server?.kill();}
