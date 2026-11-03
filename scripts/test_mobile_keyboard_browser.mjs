// Reduced-viewport regression; not physical Android/iOS keyboard certification.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4351'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser=await chromium.launch(),base='http://127.0.0.1:4351/devotional/';await mkdir('work/mobile-keyboard',{recursive:true});
try{
 for(const width of [320,375,768,1024,1440])for(const theme of ['abp-light','abp-dark']){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<=768,hasTouch:width<=1024,serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await page.goto(base);await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
  assert.equal(await page.locator('#__search').count(),1,'reuse the original toggle, never duplicate IDs');
  assert.equal(await page.locator('[data-md-toggle=search]').evaluate(el=>el.parentElement===document.querySelector('.hdc-header').parentElement),true,'native search CSS sibling contract');
  const input=page.locator('.md-search__input'),opener=page.locator('.hdc-header .md-header__button[for="__search"]');
  if(await opener.isVisible())await opener.click();else await input.click();
  await input.fill('Ganesha');
  // Material's reactive focus stream updates the native toggle asynchronously.
  // Wait for that actual state; keep the checked/focus/viewport assertions below.
  await page.waitForFunction(()=>document.querySelector('#__search')?.checked===true,null,{polling:100,timeout:5000});
  assert.equal(await page.locator('#__search').isChecked(),true);
  await page.setViewportSize({width,height:430});
  await page.waitForFunction(width=>{
   const r=document.querySelector('.md-search__input').getBoundingClientRect();
   return r.top>=0&&r.bottom<=visualViewport.height+1&&r.left>=0&&r.right<=width+1&&Math.abs(innerWidth-width)<=1&&document.documentElement.scrollWidth<=width+1;
  },width,{polling:100});
  assert.equal(await input.inputValue(),'Ganesha');assert.equal(await input.evaluate(el=>el===document.activeElement),true,'search focus survives keyboard-sized viewport reduction');
  await page.locator('.md-search-result__list a[href]').first().waitFor();
  await page.screenshot({path:`work/mobile-keyboard/search-${width}-${theme}.png`});
  await page.keyboard.press('Escape');if(await page.locator('#__search').isChecked())await page.keyboard.press('Escape');assert.equal(await page.locator('#__search').isChecked(),false);
  const compact=await page.locator('.abp-menu-toggle').isVisible();
  if(compact){await page.locator('.abp-menu-toggle').click();assert.equal(await page.locator('.abp-menu-toggle').getAttribute('aria-expanded'),'true');await page.locator('#abp-navigation .abp-menu-close').click();assert.equal(await page.locator('.abp-menu-toggle').getAttribute('aria-expanded'),'false');}
  await page.setViewportSize({width,height:900});
  if(await page.locator('.hdc-bottom-navigation').isVisible())await page.locator('.hdc-bottom-navigation a[href$="library/"]').click();
  else{await page.locator('#abp-navigation .abp-navigation__section').nth(2).click();await page.locator('#abp-navigation a[href$="library/"]').first().click();}
  await page.waitForURL(/\/library\/$/);assert.equal(await page.locator('#__search').count(),1);
  assert.deepEqual(errors,[]);await context.close();console.log(`PASS native header search/results, reduced viewport, focus, recovery and library navigation ${width} ${theme}`);
 }
}finally{await browser.close();server.kill();}
