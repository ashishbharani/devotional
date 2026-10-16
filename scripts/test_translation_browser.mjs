import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {chromium} from 'playwright';

const port=4328,base='http://127.0.0.1:'+port+'/devotional/';
const preview=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:String(port)},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{preview.stdout.once('data',resolve);preview.once('error',reject);});
const browser=await chromium.launch();
try{
 await mkdir('work/translation-browser',{recursive:true});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await context.route('https://www.gstatic.com/firebasejs/**',r=>r.abort());
  let requests=0;
  // Deterministic provider double: tests our consent/lifecycle, NOT translation quality.
  await context.route('https://translate.google.com/translate_a/element.js*',async route=>{
   if(++requests===1)return route.abort();
   await route.fulfill({contentType:'text/javascript',body:
    'window.google={translate:{TranslateElement:function(options,id){'+
    'window.__constructors=(window.__constructors||0)+1;'+
    'const s=document.createElement("select");s.className="goog-te-combo";'+
    'for(const c of ["en",...options.includedLanguages.split(",")]){const o=document.createElement("option");o.value=c;o.textContent=c;s.append(o);}'+
    's.onchange=()=>{document.querySelector("h1").textContent="MOCK translation "+s.value;document.cookie="googtrans=/en/"+s.value+";path=/";};'+
    'document.getElementById(id).append(s);'+
    '}}};googleTranslateElementInit();googleTranslateElementInit();'});
  });
  await page.goto(base+'?test=preserve#preserve');
  await page.evaluate(()=>window.abpI18n.ready);
  const originalURL=page.url();
  async function picker(){
   if(width<1200 && !await page.locator('.abp-language-btn').isVisible())await page.locator('.abp-menu-toggle').click();
   await page.locator('.abp-language-btn').click();
  }
  await picker();
  const dialog=page.locator('.abp-language-dialog');
  assert.equal(requests,0,'no provider request before explicit consent');
  assert.equal(await dialog.locator('[data-full-language]').count(),0,'no translated proxy links');
  await dialog.locator('[data-enable-translation]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-enable-translation]').disabled);
  assert.equal(await page.locator('.goog-te-combo').count(),0,'failed load does not claim success');
  await dialog.locator('[data-enable-translation]').click();
  await page.locator('.goog-te-combo').waitFor();
  for(const code of ['hi','mr','gu','bn','pa','te','kn','ml','ta']){
   await page.locator('.goog-te-combo').selectOption(code);
   assert.equal(await page.locator('h1').innerText(),'MOCK translation '+code);
   assert.equal(page.url(),originalURL);
   assert.equal(context.pages().length,1,'translation stays in same tab');
  }
  await dialog.locator('.abp-language-dialog__close').click();
  await picker();
  assert.equal(await page.locator('#google_translate_element').count(),1);
  assert.equal(await page.evaluate(()=>window.__constructors),1,'duplicate callback/reopening never creates second widget');
  assert.equal(await page.locator('h1').innerText(),'MOCK translation ta');
  await page.evaluate(()=>localStorage.setItem('hdc-test-existing-preference','preserve'));
  await dialog.locator('[data-original-language]').click();
  await page.waitForLoadState('load');
  await page.waitForFunction(()=>!localStorage.getItem('abp-google-translate-consent-v1'));
  assert.equal(page.url(),originalURL,'original language restores same URL');
  assert.equal(await page.evaluate(()=>localStorage.getItem('hdc-test-existing-preference')),'preserve');
  assert.equal(await page.evaluate(()=>document.cookie.includes('googtrans=')),false);
  await picker();
  await page.screenshot({path:'work/translation-browser/picker-'+width+'.png'});
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('PASS '+width+'px: opt-in, failure/retry, nine languages, same URL/tab, singleton and original-language preference safety');
 }
}finally{await browser.close();preview.kill();}
