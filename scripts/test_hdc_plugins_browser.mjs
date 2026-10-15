import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';

const site=path.resolve('site'), brand='HDC — Hindu Devotional Collection';
const shots=process.env.HDC_SCREENSHOTS || 'work/hdc-plugin-audit';
await mkdir(shots,{recursive:true});
const scripts=['universal-search','section-pager','navigation','abp-transliterate','abp-i18n','abp-firebase-config','abp-firebase','abp-favourites','abp-auth','abp','abp-directory','abp-japa','abp-panchang','abp-ephemeris','abp-pwa','abp-a11y','feedback'];
const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  assert.ok(url.pathname.startsWith('/devotional/'));
  let file=path.resolve(site,decodeURIComponent(url.pathname.slice(12)));
  assert.ok(file===site || file.startsWith(site+path.sep));
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream'}).end(await readFile(file));
}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/devotional/`;
const browser=await chromium.launch();
try {
 for(const width of [390,1440]) {
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce',isMobile:width<600,hasTouch:width<600});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  // Exercise the real offline/guest path, not a fabricated Firebase user or
  // replacement plugin. Real provider handoff is audited separately, manually.
  await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  await page.goto(base);
  assert.equal(await page.title(),brand);
  for(const name of scripts)assert.equal(await page.locator(`script[src$="javascripts/${name}.js"]`).count(),1,`connected once: ${name}`);
  assert.equal(await page.locator('.md-header__topic').first().innerText(),brand);
  assert.doesNotMatch(await page.locator('body').innerText(),/\b(?:UDHC|UHDC)\b|Ultimate Hindu Devotional/i);
  await page.evaluate(()=>localStorage.setItem('abp-japa-state-v1',JSON.stringify({name:'Preserved practice',count:12,target:108,today:12,day:[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,'0'),String(new Date().getDate()).padStart(2,'0')].join('-')})));
  await page.goto(base+'japa-counter/');
  assert.equal(await page.locator('#abp-japa-count').textContent(),'12','legacy Japa data retained');
  await page.locator('#abp-japa-tap').click();
  assert.equal(await page.locator('#abp-japa-count').textContent(),'13');
  await page.locator('#abp-japa-undo').click();
  await page.reload();
  assert.equal(await page.locator('#abp-japa-count').textContent(),'12','Japa undo and reload persist');
  assert.equal(await page.locator('#abp-japa-name').inputValue(),'Preserved practice');
  await page.goto(base+'categories/01-deities-sub-deities-and-divine-forms/ganesha/');
  const heart=page.locator('.abp-favourite').first();
  await page.waitForFunction(()=>Boolean(window.abpFavourites));
  await heart.click();
  await page.waitForFunction(()=>document.querySelector('.abp-favourite')?.getAttribute('aria-pressed')==='true');
  await page.reload();
  await page.waitForFunction(()=>document.querySelector('.abp-favourite')?.getAttribute('aria-pressed')==='true');
  await page.goto(base+'favourites/');
  await page.waitForFunction(()=>document.querySelectorAll('#abp-favourites-list li').length===1);
  assert.ok(await page.evaluate(async()=>(await indexedDB.databases()).some(db=>db.name==='udhc-favourites')),'legacy favourites DB retained');
  await page.locator('.abp-language-btn').click();
  await page.locator('[data-lang="hi"]').click();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'),'hi');
  assert.equal(await page.evaluate(()=>localStorage.getItem('abp-language')),'hi');
  await page.locator('.abp-language-btn').click();
  await page.locator('[data-lang="en"]').click();
  await page.locator('.abp-a11y-btn').click();
  await page.locator('.abp-a11y-dialog [name="motion"]').check();
  await page.locator('.abp-a11y-dialog [data-close]').click();
  await page.reload();
  assert.ok(await page.locator('html').evaluate(el=>el.classList.contains('abp-still')));
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('abp-a11y')).motion),true);
  await page.locator('label[title="Switch to dark (lamp-light) mode"]').click();
  await page.reload();
  assert.equal(await page.locator('body').getAttribute('data-md-color-scheme'),'abp-dark','theme choice survives reload');
  await page.locator('label[title="Switch to light (parchment) mode"]').click();
  await page.reload();
  assert.equal(await page.locator('body').getAttribute('data-md-color-scheme'),'abp-light');
  if(width===1440) {
    await page.goto(base+'date-converter/');
    await page.waitForFunction(()=>Boolean(document.querySelector('[data-panchang-view="converter"]')?._panchangSettings));
    await page.locator('[data-convert-gregorian]').fill('2026-10-15');
    await page.locator('[data-convert-gregorian-button]').click();
    await page.waitForFunction(()=>document.querySelector('[data-panchang-status]')?.textContent==='Date conversion complete.',null,{timeout:60000});
    assert.ok(await page.locator('[data-converter-output]').isVisible(),'existing converter produces output');
    await page.goto(base+'tools/indian-ephemeris/');
    await page.waitForFunction(()=>document.querySelector('.eph [data-status]')?.textContent.startsWith('Calculation complete.'),null,{timeout:60000});
    const coordinates=await page.locator('.eph [name="latitude"],.eph [name="longitude"],.eph [name="timezone"]').evaluateAll(fields=>fields.map(f=>f.value));
    assert.equal(coordinates.length,3);
    await page.locator('.eph [data-mode="date"]').click();
    await page.locator('.eph [name="date"]').fill('2026-10-15');
    await page.locator('.eph [data-calculate]').click();
    await page.waitForFunction(()=>document.querySelector('.eph [data-status]')?.textContent.startsWith('Calculation complete.'),null,{timeout:60000});
    await page.locator('.eph [data-mode="month"]').click();
    await page.locator('.eph [name="month"]').fill('2026-10');
    await page.locator('.eph [data-calculate]').click();
    await page.waitForFunction(()=>document.querySelector('.eph [data-status]')?.textContent.startsWith('Monthly calculation complete.'),null,{timeout:60000});
    assert.ok(await page.locator('.eph [data-results]').isVisible(),'existing monthly ephemeris produces output');
    assert.deepEqual(await page.locator('.eph [name="latitude"],.eph [name="longitude"],.eph [name="timezone"]').evaluateAll(fields=>fields.map(f=>f.value)),coordinates,'all three Ephemeris modes retain the same coordinates/timezone');
  }
  for(const route of ['library/','foreword/']) {
    await page.goto(base+route);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'locked layout remains contained');
    for(const cls of ['.abp-account','.abp-language-btn','.abp-a11y-btn'])assert.equal(await page.locator(cls).count(),1,'no duplicate controls after navigation');
    await page.mouse.move(0,0);
    await page.screenshot({path:path.join(shots,`${route.replace('/','')}-${width}.jpg`),type:'jpeg',quality:85});
  }
  assert.deepEqual(errors,[]);
  await context.close();
  console.log(`PASS HDC plugins ${width}px: imports, guest favourites/legacy DB, Japa/legacy state, language, accessibility, persistent theme, navigation, console`);
 }
 const context=await browser.newContext({serviceWorkers:'allow'}),page=await context.newPage();
 await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
 await page.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
 await page.goto(base);
 await page.evaluate(()=>navigator.serviceWorker.ready);
 await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller));
 for(const file of ['navigation.css','royal-home.css','sacred-site.css']) {
   assert.ok(await page.evaluate(async url=>Boolean(await caches.match(url)),base+'stylesheets/'+file),`makeover stylesheet in first-install shell: ${file}`);
 }
 assert.ok(await page.evaluate(async()=>(await caches.keys()).some(key=>key.startsWith('udhc-shell-'))),'legacy cache protocol retained');
 await context.setOffline(true);await page.reload();
 assert.equal(await page.title(),brand);
 assert.equal(await page.locator('.abp-navigation').evaluate(el=>getComputedStyle(el).borderBottomStyle),'double','sacred navigation style available offline');
 await page.goto(base+'offline/');
 assert.equal(await page.title(),'You are offline | '+brand);
 await context.close();
 console.log('PASS HDC PWA: real first-install precache includes makeover styles; offline homepage, fallback and canonical branding');
}finally{await browser.close();await new Promise(r=>server.close(r));}
