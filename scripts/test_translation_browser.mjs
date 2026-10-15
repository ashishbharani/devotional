import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';

const site=path.resolve('site');
const catalogue=JSON.parse(await readFile('docs/assets/i18n.json','utf8'));
const strings=code=>Object.fromEntries(catalogue.sections.flatMap(section=>section.keys.map((key,i)=>[key,section.values[code][i]])));
const languages=Object.keys(catalogue.localeNames).filter(code=>code!=='en');
const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  assert.ok(url.pathname.startsWith('/devotional/'));
  let file=path.resolve(site,decodeURIComponent(url.pathname.slice(12)));
  assert.ok(file===site||file.startsWith(site+path.sep));
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream'}).end(await readFile(file));
}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}/devotional/`;
const browser=await chromium.launch();
try{
 await mkdir('work/translation-browser',{recursive:true});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce',isMobile:width<600,hasTouch:width<600});
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',error=>errors.push(error.stack||error.message));
  await context.route('https://fonts.googleapis.com/**',route=>route.fulfill({body:'',contentType:'text/css'}));
  await context.route('https://www.gstatic.com/firebasejs/**',route=>route.abort());
  // Test only our handoff, not Google's translation accuracy/availability.
  // No real public page, coordinates or query terms are sent by this test.
  await context.route('https://translate.google.com/**',route=>{
    external.push(route.request().url());
    return route.fulfill({body:'<title>External handoff test</title>',contentType:'text/html'});
  });
  await page.goto(base+'tools/indian-ephemeris/?lat=28.123456&lon=77.654321&timezone=Asia%2FKolkata#private-fragment');
  await page.evaluate(()=>window.abpI18n.ready);
  await page.locator('.abp-language-btn').click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.abp-language-dialog').count(),0,'Escape cleans up the picker');
  await page.locator('.abp-language-btn').click();
  const dialog=page.locator('.abp-language-dialog');
  assert.match(await dialog.locator('[data-local-language] summary').innerText(),/not every paragraph/,'local scope is disclosed separately');
  assert.equal(await dialog.locator('[data-local-language]').getAttribute('open'),null,'partial local translation is NOT the default choice');
  assert.match(await dialog.innerText(),/favourites and live calculations/,'provider limits disclosed');
  const link=dialog.locator('[data-full-language="hi"]');
  assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
  assert.equal(await link.getAttribute('referrerpolicy'),'no-referrer');
  for(const code of languages){
    const primary=dialog.locator(`[data-full-language="${code}"]`);
    assert.ok(await primary.isVisible(),'the main language choices are whole-page translation');
    const target=new URL(await primary.getAttribute('href'));
    assert.equal(target.origin,'https://translate.google.com');
    assert.equal(target.searchParams.get('tl'),code);
    assert.equal(target.searchParams.get('u'),'https://ashishbharani.github.io/devotional/tools/indian-ephemeris/','only published path; no localhost, query, GPS or fragment');
  }
  assert.deepEqual(external,[],'opening picker/selecting target makes NO provider request');
  const before=await page.evaluate(()=>localStorage.getItem('abp-language'));
  for(const [index,code] of languages.entries()){
    const popupPromise=page.waitForEvent('popup');
    await dialog.locator(`[data-full-language="${code}"]`).click();
    const popup=await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(external.length,index+1,'each main language click directly opens full-page translation');
    assert.equal(new URL(popup.url()).searchParams.get('tl'),code);
    assert.equal(await popup.evaluate(()=>window.opener),null);
    await popup.close();
  }
  assert.equal(await page.evaluate(()=>localStorage.getItem('abp-language')),before,'external mode never overwrites local preference');
  await dialog.locator('.abp-language-dialog__close').click();
  for(const code of languages){
    await page.locator('.abp-language-btn').click();
    await dialog.locator('[data-local-language] summary').click();
    await page.locator(`[data-lang="${code}"]`).click();
    await page.locator('.abp-language-btn').click();
    assert.equal(await dialog.locator('#abp-online-translation-title').innerText(),strings(code).wholePageTranslation);
    assert.equal(await dialog.locator('[data-full-language]').count(),9);
    assert.equal(await dialog.locator('#abp-online-translation-note').innerText(),strings(code).onlineTranslationNotice);
    assert.ok(await dialog.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'all-language dialog fits viewport');
    await dialog.locator('.abp-language-dialog__close').click();
  }
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'),'ta','legacy local preference still reloads');
  for(const route of ['','library/','categories/01-deities-sub-deities-and-divine-forms/ganesha/']){
    await page.goto(base+route);
    await page.locator('.abp-language-btn').click();
    assert.equal(new URL(await dialog.locator('[data-full-language="hi"]').getAttribute('href')).searchParams.get('u'),'https://ashishbharani.github.io/devotional/'+route,'handoff tracks the homepage, library and reported Ganesha page');
    await dialog.locator('.abp-language-dialog__close').click();
  }
  await page.locator('.abp-language-btn').click();
  await dialog.locator('[data-original-language]').click();
  assert.equal(await page.locator('html').getAttribute('lang'),'en','original-language action restores English');
  await page.locator('.abp-language-btn').click();
  assert.equal(await page.locator('.abp-language-btn').count(),1);
  await page.screenshot({path:`work/translation-browser/picker-${width}.png`});
  assert.deepEqual(errors,[]);
  await context.close();
  console.log(`PASS translation ${width}px: all nine targets, local persistence, clear scopes, private URL stripping, explicit isolated external handoff, route and layout`);
 }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
