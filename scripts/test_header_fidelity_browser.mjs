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
  await page.locator('.hdc-header img:visible').evaluateAll(images=>Promise.all(images.map(image=>image.decode())));
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
   const wordmark=await page.locator('.hdc-wordmark-desktop').boundingBox();
   assert.ok(wordmark.width>=430 && Math.abs(wordmark.width/wordmark.height-562/75)<.01,'approved desktop wordmark is full-size and not stretched');
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
  // Tablet navigation follows the available window, not the touch hardware identity.
  // These transitions cover full-screen, stacked split-screen, side-by-side and return to full.
  const tablet = await browser.newContext({viewport:{width:1360,height:860},isMobile:true,hasTouch:true,serviceWorkers:'block',reducedMotion:'reduce'});
  await tablet.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await tablet.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  const pane=await tablet.newPage();
  await pane.goto(base);
  const dock=pane.locator('.hdc-bottom-navigation'),topNav=pane.locator('.abp-navigation');
  for (const [width,height,layout] of [[1360,860,'top'],[1360,560,'bottom'],[710,860,'bottom'],[390,420,'bottom'],[1360,860,'top'],[1440,900,'top'],[1440,560,'bottom'],[1440,900,'top']]) {
    await pane.setViewportSize({width,height});
    await pane.waitForFunction(wantBottom=>{
      const nav=document.querySelector('.hdc-bottom-navigation');
      return Boolean(nav) && (getComputedStyle(nav).display !== 'none') === wantBottom;
    },layout==='bottom');
    assert.equal(await dock.isVisible(),layout==='bottom',`tablet ${layout} dock at ${width}x${height}`);
    const topVisible=await topNav.isVisible();
    assert.equal(topVisible,layout==='top',`tablet ${layout} horizontal navigation at ${width}x${height}`);
    assert.equal(await pane.locator('.hdc-bottom-navigation > a,.hdc-bottom-navigation > button').count(),6,'all six compact destinations retained');
    if(layout==='bottom') {
      const r=await dock.boundingBox();
      assert.ok(r && r.x>=0 && r.x+r.width<=width+1 && r.y>=0 && r.y+r.height<=height+1,`dock stays within split-screen viewport ${width}x${height}`);
      assert.ok(await pane.locator('.abp-menu-toggle').isVisible(),'compact drawer access remains visible');
      assert.equal(await pane.locator('.hdc-bottom-navigation').evaluate(el=>getComputedStyle(el).borderTopWidth),'2px','approved gold dock outline retained');
    } else {
      assert.equal(await pane.locator('.abp-menu-toggle').isVisible(),false,'no redundant hamburger on wide full-screen tablet');
      assert.ok(await pane.locator('.hdc-header .hdc-wordmark-desktop').isVisible(),'exact approved desktop wordmark is present');
    }
    assert.ok(await pane.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no horizontal overflow after window transition');
    await pane.screenshot({path:`work/header-fidelity/tablet-${width}x${height}-${layout}.png`});
  }
  await pane.setViewportSize({width:710,height:860});
  await pane.locator('.abp-menu-toggle').click();
  assert.ok(await topNav.evaluate(el=>el.classList.contains('is-open')),'drawer opens in split-screen');
  await pane.setViewportSize({width:390,height:420});
  await pane.waitForFunction(()=>!document.documentElement.classList.contains('abp-navigation-open'));
  assert.ok(await dock.isVisible(),'split-screen resizing never strands the dock hidden');
  await pane.setViewportSize({width:1360,height:860});
  await pane.waitForFunction(()=>getComputedStyle(document.querySelector('.hdc-bottom-navigation')).display==='none');
  assert.ok(await topNav.isVisible(),'horizontal navigation returns on restoring full-screen');
  await tablet.close();
  // Wide non-touch computers retain the approved desktop top navigation.
  const desktopContext=await browser.newContext({viewport:{width:1360,height:860},serviceWorkers:'block',reducedMotion:'reduce'});
  await desktopContext.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await desktopContext.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  const desktop=await desktopContext.newPage();
  await desktop.goto(base);
  assert.ok(await desktop.locator('.abp-navigation').isVisible(),'wide desktop top navigation retained');
  assert.equal(await desktop.locator('.hdc-bottom-navigation').isVisible(),false,'no duplicate dock on wide non-touch desktop');
  await desktop.setViewportSize({width:760,height:860});
  assert.ok(await desktop.locator('.hdc-bottom-navigation').isVisible(),'narrow desktop window uses bottom taskbar');
  await desktopContext.close();
  console.log('PASS adaptive tablet top navigation and split-screen dock, desktop fallback, and drawer-resize recovery');
}finally{await browser.close();preview.kill();}
