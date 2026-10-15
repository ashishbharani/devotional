import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, stat, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
import {devotionalContext, GENERAL_LINKS} from '../docs/assets/panchang/festival-links.mjs';

const site = path.resolve('site');
const shots = process.env.HOMEPAGE_SCREENSHOTS || 'work/royal-homepage';
await mkdir(shots, {recursive:true});
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm','.xml':'application/xml'};
const server = createServer(async (req,res) => {
  try {
    const url = new URL(req.url,'http://localhost');
    assert.ok(url.pathname.startsWith('/devotional/'));
    let file = path.resolve(site,decodeURIComponent(url.pathname.slice('/devotional/'.length)));
    assert.ok(file === site || file.startsWith(site+path.sep));
    if ((await stat(file)).isDirectory()) file = path.join(file,'index.html');
    let body = await readFile(file);
    if (file.endsWith('sitemap.xml')) body = body.toString().replaceAll('https://ashishbharani.github.io/devotional/',base);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(body);
  } catch {res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base = `http://127.0.0.1:${server.address().port}/devotional/`;
const browser = await chromium.launch({headless:true,...(process.env.PANCHANG_BROWSER?{executablePath:process.env.PANCHANG_BROWSER}:{})});
const luminance = color => {
  const rgb=color.match(/[\d.]+/g).slice(0,3).map(Number).map(c=>c/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
  return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
};
const checkContrast = (foreground,background,label) => {
  const a=luminance(foreground),b=luminance(background);
  assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,`normal-text contrast: ${label}`);
};
try {
  // Exercise every date-dependent devotional link, not only today's observance.
  const contexts=devotionalContext(['Ekadashi','Shivaratri','Navaratri','Janmashtami','Ram Navami','Ganesh Chaturthi','Hanuman','Purnima','Amavasya','Sankranti'].map(name=>({name}))).links;
  for (const link of [...contexts,...GENERAL_LINKS]) assert.ok((await stat(path.join(site,link.path,'index.html'))).isFile(),link.path);
  for (const [width,theme] of [[320,'abp-light'],[390,'abp-light'],[768,'abp-light'],[1440,'abp-light'],[1920,'abp-light'],[390,'abp-dark'],[1440,'abp-dark']]) {
    const context = await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce',serviceWorkers:'block'});
    const page = await context.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({contentType:'text/css',body:''}));
    await page.goto(base);
    await page.locator('details.abp-home-index > summary').filter({hasText:'TODAY PANCHANG'}).click();
    await page.waitForFunction(()=>document.querySelector('[data-panchang-status]')?.dataset.state==='ready',null,{timeout:60000});
    await page.locator('details.abp-home-index > summary').filter({hasText:'TODAY PANCHANG'}).click();
    await page.locator('body').evaluate((el,t)=>el.setAttribute('data-md-color-scheme',t),theme);
    await page.locator('.udhc-home img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager'; return img.decode();})));
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('h1').innerText(),'HINDU DEVOTIONAL COLLECTION');
    assert.equal(await page.locator('.udhc-path').count(),4);
    assert.equal(await page.locator('.udhc-category').count(),9);
    assert.equal(await page.locator('.udhc-deities a').count(),10);
    assert.equal(await page.locator('.udhc-home .abp-stats li').nth(1).locator('b').innerText(),'42');
    assert.equal(await page.locator('.udhc-home details.abp-home-index').count(),3);
    const tabLayout = await page.locator('.abp-home-actions').evaluate(nav => {
      const box = nav.getBoundingClientRect(), parent = nav.parentElement.getBoundingClientRect();
      return {
        centerOffset: Math.abs((box.left + box.right - parent.left - parent.right) / 2),
        links: [...nav.querySelectorAll('a')].map(a => ({
          path: new URL(a.href).pathname,
          textAlign: getComputedStyle(a).textAlign,
          justify: getComputedStyle(a).justifyContent,
        })),
      };
    });
    assert.ok(tabLayout.centerOffset <= 1, `homepage tabs centered at ${width}px: ${tabLayout.centerOffset}`);
    assert.deepEqual(tabLayout.links.map(a=>a.path), ['foreword/','disclaimer/','find/','a-z/'].map(p=>'/devotional/'+p));
    assert.ok(tabLayout.links.every(a=>a.textAlign==='center' && a.justify==='center'),'tab labels centered, including wrapped lines');
    assert.equal(await page.locator('.udhc-hero-art a,.udhc-hero-art [onclick],.udhc-hero-art [tabindex]').count(),0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),'no horizontal overflow');
    assert.deepEqual(await page.locator('.udhc-home img').evaluateAll(images=>images.filter(img=>!img.complete||!img.naturalWidth).map(img=>img.src)),[]);
    for (const sample of await page.locator('.udhc-category h3').evaluateAll(headings=>headings.map(h=>({name:h.textContent,fg:getComputedStyle(h).color,bg:getComputedStyle(h.parentElement).backgroundColor})))) checkContrast(sample.fg,sample.bg,sample.name);
    for (const selector of ['.udhc-section-intro','.udhc-section > .udhc-kicker','.abp-stats span','.udhc-quick-nav a']) {
      const color=await page.locator('.udhc-home '+selector).first().evaluate(el=>getComputedStyle(el).color);
      checkContrast(color,'rgb(255,245,221)',selector);
    }
    assert.ok(await page.locator('.abp-stats b').first().evaluate(el=>el.scrollWidth<=el.clientWidth+1),'work count fits without clipping');
    for (const link of await page.locator('.udhc-home a').evaluateAll(links=>[...new Set(links.map(a=>a.href))])) {
      const url=new URL(link);
      if (url.origin !== new URL(base).origin) {assert.equal(url.protocol,'https:');continue;}
      let file=path.join(site,decodeURIComponent(url.pathname.slice('/devotional/'.length)));
      let info;
      try { info=await stat(file); } catch (error) {
        console.log('Missing homepage destination',link,await page.locator('.udhc-home a').evaluateAll((links,href)=>links.filter(a=>a.href===href).map(a=>a.outerHTML),link));
        throw error;
      }
      if (info.isDirectory()) file=path.join(file,'index.html');
      if (url.hash) {
        const html=await readFile(file,'utf8');
        assert.ok(html.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`),`fragment exists: ${url}`);
      }
    }
    // Native GET submission exercises the existing universal search, not a mock.
    await page.locator('#udhc-query').fill('Hanuman Chalisa');
    await page.locator('#udhc-query').press('Enter');
    await page.waitForURL(/\/find\/\?w=Hanuman\+Chalisa/);
    await page.waitForFunction(()=>document.querySelector('#abp-results')?.textContent.includes('Hanuman Chalisa'));
    await page.goBack(); await page.locator('#udhc-title').waitFor();
    // Back may create a new document. Decode the newly mounted lazy portraits
    // before a full-page screenshot (ordinary visitors load them while scrolling).
    await page.locator('.udhc-home img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager';return img.decode();})));
    assert.ok(await page.locator('#abp-navigation').isVisible() || width <1200);
    await page.locator('#udhc-title').focus(); await page.keyboard.press('Tab');
    assert.equal(await page.locator('#udhc-query').evaluate(el=>el===document.activeElement),true);
    if (width===390) {
      await page.locator('html').evaluate(el=>el.classList.add('abp-hc','abp-text-2','abp-still'));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),'large text/high contrast stays contained');
      await page.locator('html').evaluate(el=>el.classList.remove('abp-hc','abp-text-2','abp-still'));
    }
    await page.locator('#udhc-query').fill('');
    await page.evaluate(()=>{document.activeElement.blur();scrollTo(0,0);});
    await page.screenshot({path:path.join(shots,`homepage-${width}-${theme}.png`),fullPage:true});
    assert.deepEqual(errors,[]);
    await context.close();
    console.log(`PASS royal homepage ${width}px ${theme}: real search, all local links/fragments, images, keyboard, responsive layout`);
  }
} finally {
  await browser.close(); await new Promise(resolve=>server.close(resolve));
}
