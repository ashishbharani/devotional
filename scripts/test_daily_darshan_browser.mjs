import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';
const server = spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4332'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
const browser = await chromium.launch(), base='http://127.0.0.1:4332/devotional/';
await mkdir('work/daily-darshan',{recursive:true});
try {
  for (const width of [320,375,768,1024,1440]) for (const theme of ['abp-light','abp-dark']) {
    const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block',reducedMotion:'reduce'});
    await context.addInitScript(()=>localStorage.setItem('abp-japa-state-v1',JSON.stringify({count:27,target:108,name:'Private prayer'})));
    await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
    const page=await context.newPage(), errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base);
    await page.locator('[data-daily-resume]:visible').waitFor();
    await page.evaluate(t=>document.body.setAttribute('data-md-color-scheme',t),theme);
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('.hdc-daily [data-panchang-view="summary"]').count(),1);
    assert.equal(await page.locator('[data-panchang-view="summary"]').count(),1,'never duplicate settings/calculation instances');
    assert.equal(await page.locator('[data-daily-count]').textContent(),'27');
    assert.equal(await page.locator('.hdc-daily-paths a').count(),6);
    for(const link of await page.locator('.hdc-daily-paths a').all()){
      assert.ok((await link.boundingBox()).height>=44);
      const url=new URL(await link.getAttribute('href'),base);
      assert.equal((await page.request.get(url.href)).status(),200,url.href);
    }
    await page.locator('.hdc-daily-paths a').first().focus();
    assert.equal(await page.locator('.hdc-daily-paths a').first().evaluate(el=>el===document.activeElement),true);
    assert.ok(await page.evaluate(()=>{
      const lum=color=>color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
      const panel=getComputedStyle(document.querySelector('.udhc-home')).backgroundColor;
      return [...document.querySelectorAll('.hdc-daily-paths a,.hdc-daily-paths a span,.hdc-daily-note,.hdc-daily-resume a')].every(el=>{
        const card=el.closest('.hdc-daily-paths a'),bg=lum(card?getComputedStyle(card).backgroundColor:panel),fg=lum(getComputedStyle(el).color);
        return (Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)>=4.5;
      });
    }),'all new card, note and resume text meets 4.5:1 including focused state');
    await page.locator('.hdc-daily').scrollIntoViewIfNeeded();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow');
    assert.match(await page.locator('.udhc-hero-art img').getAttribute('src'),/temple-ghat-hero.webp$/);
    await page.screenshot({path:`work/daily-darshan/${width}-${theme}.png`});
    assert.deepEqual(errors,[]);
    assert.equal(JSON.parse(await page.evaluate(()=>localStorage.getItem('abp-japa-state-v1'))).count,27,'read-only resume');
    await context.close();console.log(`PASS Daily Darshan ${width}px ${theme}`);
  }
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  await page.goto(base);
  for(const value of [null,'{','null','{"count":-1}','{"count":"27"}','{"count":1e99}']){
    await page.evaluate(value=>{if(value===null)localStorage.removeItem('abp-japa-state-v1');else localStorage.setItem('abp-japa-state-v1',value);dispatchEvent(new StorageEvent('storage',{key:'abp-japa-state-v1'}));},value);
    assert.equal(await page.locator('[data-daily-resume]').isVisible(),false,'invalid/empty state is never a fake recommendation');
  }
  const other=await context.newPage();await other.goto(base+'japa-counter/');
  await other.evaluate(()=>localStorage.setItem('abp-japa-state-v1','{"count":108}'));
  await page.waitForFunction(()=>document.querySelector('[data-daily-count]').textContent==='108');
  await other.evaluate(()=>localStorage.removeItem('abp-japa-state-v1'));
  await page.waitForFunction(()=>document.querySelector('[data-daily-resume]').hidden);
  await page.evaluate(()=>{
    const get = Storage.prototype.getItem;
    Storage.prototype.getItem = function(key) {if(key==='abp-japa-state-v1')throw new Error('blocked');return get.call(this,key);};
    dispatchEvent(new Event('pageshow'));
  });
  assert.equal(await page.locator('[data-daily-resume]').isVisible(),false,'blocked storage keeps neutral paths usable');
  await context.close();console.log('PASS invalid storage, guest fallback, cross-tab resume and clearing');
} finally {await browser.close();server.kill();}
