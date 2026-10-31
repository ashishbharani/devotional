// Geometry checks supplement manual comparison with the owner's actual board.
// Passing these checks alone is NOT a claim of pixel-identical artwork.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const preview=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4331'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{preview.stdout.once('data',resolve);preview.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4331/devotional/';
await mkdir('work/header-fidelity',{recursive:true});
try {
 for(const width of [320,390,768,1280,1440,1536])for(const theme of ['abp-light','abp-dark']){
  const context=await browser.newContext({viewport:{width,height:1024},serviceWorkers:'block',reducedMotion:'reduce'});
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await context.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.waitForFunction(()=>Boolean(document.querySelector('.abp-language-btn')));
  await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  const header=await page.locator('.abp-navigation-shell').boundingBox(),hero=await page.locator('.udhc-hero').boundingBox();
  assert.ok(hero.y-header.y-header.height<=28,'hero follows the shared header: no duplicate search/navigation stack');
  assert.equal(await page.locator('[data-universal-search-form]').count(),1,'one working homepage universal-search entry');
  assert.ok(await page.locator('.udhc-hero [data-universal-search-form]').count(),'search retained inside hero');
  assert.ok(await page.locator('.udhc-home-links').boundingBox().then(b=>b.y>=hero.y+hero.height),'all auxiliary homepage links retained below hero');
  if(width<1200){
   assert.ok(await page.locator('.hdc-bottom-navigation').isVisible());
   if(width<=650)assert.equal(await page.locator('.udhc-hero h1').evaluate(el=>getComputedStyle(el).textAlign),'center');
  }else{
   const ornament=await page.locator('.abp-navigation').evaluate(el=>getComputedStyle(el,'::after').backgroundImage);
   assert.match(ornament,/navigation-lotus/,'approved central lotus divider is actually rendered');
   assert.equal(await page.locator('.hdc-brand-long').evaluate(el=>getComputedStyle(el.parentElement).fontWeight),'400');
   assert.ok(await page.locator('.hdc-brand-long').evaluate(el=>{const range=document.createRange();range.selectNodeContents(el);const boxes=[...range.getClientRects()].filter(b=>b.width>0);return boxes.length>0&&Math.max(...boxes.map(b=>b.top))<Math.min(...boxes.map(b=>b.bottom));}),'both sizes of the desktop brand share one text line');
   if(theme==='abp-dark')assert.equal(await page.locator('.abp-navigation__item > a > .hdc-icon').first().evaluate(el=>getComputedStyle(el).color),'rgb(255, 223, 148)','dark-mode navigation icons use the approved bright gold');
   const list=await page.locator('.abp-navigation__list').boundingBox();
   assert.ok(list.width/header.width>.88,'secondary navigation fills the reference header width');
   if(width>=1440){
    assert.ok(await page.locator('.hdc-install-header .hdc-install-label').isVisible());
    assert.equal(await page.locator('.hdc-install-header .hdc-install-label').evaluate(el=>getComputedStyle(el).clipPath),'none');
    const alignment=await page.locator('.hdc-install-header').evaluate(el=>{const a=el.querySelector('.hdc-icon').getBoundingClientRect(),b=el.querySelector('.hdc-install-label').getBoundingClientRect();return Math.abs(a.y+a.height/2-b.y-b.height/2);});
    assert.ok(alignment<2,'Install App icon and caption are vertically aligned');
   }
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow');
  for(const control of await page.locator('.hdc-header .md-header__inner > :is(a,button,label)').all())if(await control.isVisible()){
   const box=await control.boundingBox();assert.ok(box.x>=0&&box.x+box.width<=width+1,'visible header controls are not clipped');
  }
  assert.match(await page.locator('.udhc-hero-art img').getAttribute('src'),/temple-ghat-hero.webp$/,'existing hero artwork preserved');
  await page.screenshot({path:'work/header-fidelity/'+width+'-'+theme+'.png'});
  if(width===390&&theme==='abp-light'){
   await page.locator('.udhc-home-links > summary').click();
   assert.equal(await page.locator('.udhc-quick-nav a:visible').count(),7,'all original auxiliary destinations remain accessible');
  }
  assert.deepEqual(errors,[]);
  await context.close();console.log('PASS reference geometry '+width+'px '+theme);
 }
  // Cover Android tablet side-by-side and stacked split windows, not only static widths.
  const tablet = await browser.newContext({viewport:{width:1360,height:860},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  await tablet.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await tablet.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  const pane=await tablet.newPage();
  await pane.goto(base);
  const dock=pane.locator('.hdc-bottom-navigation');
  for (const [width,height,visible] of [[1360,860,false],[1360,580,true],[710,860,true],[390,420,true],[1360,860,false]]) {
    await pane.setViewportSize({width,height});
    await pane.waitForFunction(shouldShow=>{
      const nav=document.querySelector('.hdc-bottom-navigation');
      return Boolean(nav) && (getComputedStyle(nav).display !== 'none') === shouldShow;
    },visible);
    assert.equal(await dock.isVisible(),visible,`tablet taskbar visibility ${width}x${height}`);
    if (visible) {
      const r=await dock.boundingBox();
      assert.ok(r && r.x>=0 && r.x+r.width<=width+1 && r.y>=0 && r.y+r.height<=height+1,`taskbar visible inside split-screen viewport ${width}x${height}`);
      assert.equal(await pane.locator('.hdc-bottom-navigation > a,.hdc-bottom-navigation > button').count(),6);
      assert.ok(await pane.locator('.abp-menu-toggle').isVisible(),'mobile drawer accessible in split-screen');
    } else assert.ok(await pane.locator('.abp-navigation').isVisible(),'desktop navigation preserved at full size');
  }
  await pane.setViewportSize({width:710,height:860});
  await pane.locator('.abp-menu-toggle').click();
  assert.ok(await pane.locator('#abp-navigation').evaluate(el=>el.classList.contains('is-open')));
  await pane.setViewportSize({width:390,height:420});
  await pane.waitForFunction(()=>!document.documentElement.classList.contains('abp-navigation-open'));
  assert.ok(await dock.isVisible(),'open drawer does not strand taskbar hidden on resize');
  await tablet.close();
  console.log('PASS tablet split-screen taskbar across width/height transitions and open-drawer resize');
}finally{await browser.close();preview.kill();}
