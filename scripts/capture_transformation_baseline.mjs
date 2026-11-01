// Read-only browser evidence. Never writes preferences to a real user profile.
import {chromium} from 'playwright';
import {mkdir, writeFile} from 'node:fs/promises';
const base = process.env.HDC_BASELINE_URL || 'https://ashishbharani.github.io/devotional/';
const output = process.env.HDC_BASELINE_OUTPUT || 'work/transformation/baseline';
await mkdir(output, {recursive:true});
const browser = await chromium.launch();
const report = {url:base, capturedAt:new Date().toISOString(), pages:[]};
try {
  for (const width of [320,375,768,1024,1440]) {
    const context = await browser.newContext({viewport:{width,height:1000}, reducedMotion:'reduce'});
    const page = await context.newPage();
    const result = {width, errors:[], failedRequests:[], badResponses:[]};
    page.on('pageerror', e=>result.errors.push(e.message));
    page.on('requestfailed', r=>result.failedRequests.push({url:r.url(),error:r.failure()?.errorText}));
    page.on('response', r=>{if(r.status()>=400)result.badResponses.push({url:r.url(),status:r.status()});});
    try {
      const response = await page.goto(base,{waitUntil:'load',timeout:60000});
      result.status = response?.status();
      await page.locator('.udhc-hero').waitFor();
      await page.screenshot({path:`${output}/${width}.png`});
      Object.assign(result,await page.evaluate(()=>({
        title:document.title,
        horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,
        links:[...document.querySelectorAll('a[href]')].map(a=>({text:a.textContent.trim(),href:a.getAttribute('href')})),
        manifest:document.querySelector('link[rel="manifest"]')?.href,
        styles:[...document.styleSheets].map(s=>s.href).filter(Boolean),
        colors:['--abp-paper','--abp-ink','--abp-maroon','--abp-gold','--abp-serif','--abp-sans'].map(name=>[name,getComputedStyle(document.body).getPropertyValue(name).trim()])
      })));
    } catch (e) {result.captureFailure=e.message;}
    report.pages.push(result);
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(`${output}/report.json`,JSON.stringify(report,null,2));
}
if(report.pages.some(p=>p.captureFailure||p.status!==200))process.exitCode=1;
console.log(JSON.stringify(report.pages.map(({width,status,errors,horizontalOverflow,captureFailure})=>({width,status,errors,horizontalOverflow,captureFailure})),null,2));
