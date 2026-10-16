import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, readdir, stat, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';

const site=path.resolve('site'), shots=process.env.SACRED_SCREENSHOTS || 'work/sacred-site';
await mkdir(shots,{recursive:true});
const categoryRoot='categories/01-deities-sub-deities-and-divine-forms/';
const categories=(await readdir(path.join(site,'categories'),{withFileTypes:true})).filter(x=>x.isDirectory());
assert.equal(categories.length,42,'all existing canonical categories retained');
let total=0, portraits=0;
async function audit(dir) {
  for(const entry of await readdir(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    if(entry.isDirectory()) await audit(file);
    else if(entry.name.endsWith('.html')) {
      const html=await readFile(file,'utf8');
      assert.ok(html.includes('stylesheets/sacred-site.css'),`shared theme: ${file}`);
      assert.ok(html.includes('data-sacred-kind='),`shared page shell: ${file}`);
      assert.equal((html.match(/<h1\b/g)||[]).length,1,`preserve one main heading: ${file}`);
      assert.ok(!/<use\b[^>]*\bhref=/.test(html),'no SVG href incompatible with Material instant navigation');
      if(html.includes('abp-sacred-intro')) {
        const intro=html.match(/<div class="abp-sacred-intro">([\s\S]*?)<\/div>/)?.[1] || '';
        const image=intro.match(/<img\b[^>]*\bsrc="([^"]+(?:royal-home|deities)\/[^"]+)"/);
        if(image) {
          assert.ok((await stat(path.resolve(path.dirname(file),image[1]))).isFile(),`portrait path: ${file}`);
          portraits++;
        }
      }
      total++;
    }
  }
}
await audit(site);
assert.ok(portraits>=7,'verified deity artwork propagated, including paginated groups');
console.log(`PASS shared theme on all ${total} HTML pages, 42 categories, ${portraits} portrait-bearing pages`);
const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  assert.ok(url.pathname.startsWith('/devotional/'));
  let file=path.resolve(site,decodeURIComponent(url.pathname.slice(12)));
  assert.ok(file===site || file.startsWith(site+path.sep));
  if((await stat(file)).isDirectory()) file=path.join(file,'index.html');
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream'}).end(await readFile(file));
}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/devotional/`;
const browser=await chromium.launch();
const routes=[categoryRoot,categoryRoot+'ganesha/',categoryRoot+'shiva-mahesh/','library/','master-index/','find/','a-z/','foreword/','disclaimer/','legend/','panchang/','hindu-calendar/','date-converter/','tools/indian-ephemeris/','japa-counter/','favourites/','tools/feedback/','404.html'];
routes.push(...['navagraha','brahma','chandra','rahu','shukra','lalita-tripurasundari'].map(slug=>categoryRoot+slug+'/'));
try {
  for(const [width,theme] of [[320,'abp-light'],[390,'abp-light'],[768,'abp-light'],[1440,'abp-light'],[390,'abp-dark'],[1440,'abp-dark']]) {
    const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce',isMobile:width<600,hasTouch:width<600});
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
    for(const route of routes) {
      assert.equal((await page.goto(base+route)).status(),200,route);
      await page.locator('body').evaluate((el,scheme)=>el.setAttribute('data-md-color-scheme',scheme),theme);
      assert.equal(await page.locator('.abp-sacred-intro').count(),1,route);
      assert.equal(await page.locator('main h1').count(),1,`one h1: ${route}`);
      await page.locator('.abp-sacred-intro img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`no overflow: ${route} ${width} ${theme}`);
      const intro=await page.locator('.abp-sacred-intro').evaluate(el=>({height:el.getBoundingClientRect().height,color:getComputedStyle(el.querySelector('p')).color}));
      assert.ok(intro.height<160,'restrained internal header, not a repeated homepage hero');
      if(route===categoryRoot+'ganesha/') assert.match(await page.locator('.abp-sacred-intro img').getAttribute('src'),/deities\/ganesha-640.webp$/);
      if(route===categoryRoot+'shiva-mahesh/') assert.match(await page.locator('.abp-sacred-intro img').getAttribute('src'),/deities\/shiva-640.webp$/);
      if(route==='tools/indian-ephemeris/') {
        await page.locator('.eph-controls').waitFor();
        assert.equal(await page.locator('.abp-page').getAttribute('data-sacred-kind'),'astronomy');
      }
      if(['library/','foreword/',categoryRoot+'ganesha/',categoryRoot+'navagraha/',categoryRoot+'brahma/','find/','panchang/','tools/indian-ephemeris/'].includes(route)) {
        await page.screenshot({path:path.join(shots,`${route.replaceAll('/','_')}-${width}-${theme}.jpg`),type:'jpeg',quality:85,fullPage:false});
      }
      await page.locator('html').evaluate(el=>el.classList.add('abp-hc','abp-text-2','abp-cards','abp-still'));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`large text/high contrast: ${route} ${width}`);
      await page.locator('html').evaluate(el=>el.classList.remove('abp-hc','abp-text-2','abp-cards','abp-still'));
    }
    if(theme==='abp-light' && [320,1440].includes(width)) {
      for(const category of categories) {
        const route=`categories/${category.name}/`;
        assert.equal((await page.goto(base+route)).status(),200,route);
        assert.equal(await page.locator('main h1').count(),1,route);
        assert.equal(await page.locator('[data-sacred-kind="catalogue"]').count(),1,route);
        assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`all-category layout: ${route} ${width}`);
      }
      console.log(`PASS all 42 category layouts at ${width}px`);
    }
    assert.deepEqual(errors,[],`no JS errors: ${width} ${theme}`);
    await context.close();
    console.log(`PASS sacred site: ${width}px ${theme}, ${routes.length} page types/routes, images, large text and contrast containment`);
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
