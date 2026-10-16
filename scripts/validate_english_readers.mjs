// Opt-in live audit. CI tests our URLs without depending on third-party uptime.
// No external translation is copied into the production website.
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const probes=JSON.parse(await readFile('scripts/fixtures/english-reader-probes.json','utf8'));
const readers=JSON.parse(await readFile('hooks/library_readers.json','utf8'));
const catalogue=JSON.parse(await readFile('data/collection.json','utf8'));
const browser=await chromium.launch({...(process.env.PANCHANG_BROWSER?{executablePath:process.env.PANCHANG_BROWSER}:{})});
let failed=0;
try {
 for(const book of catalogue.library.flatMap(s=>s.books)) {
  const name=book.title;
  if(process.argv[2] && !name.toLowerCase().includes(process.argv[2].toLowerCase()))continue;
  const page=await browser.newPage();
  try {
   const destination=readers[name]?.english || book.links.english;
   if(destination.endsWith('.pdf')) {
    const pdf=await page.request.get(destination);
    if(!pdf.ok() || !pdf.headers()['content-type']?.includes('pdf'))throw new Error('PDF unavailable');
    console.log(`PASS ${name}: PDF response; translation visually inspected separately (page 33)`);
    continue;
   }
   const landing=await page.goto(destination,{waitUntil:'domcontentloaded',timeout:45000});
   if(!landing?.ok())throw new Error(`Reader index HTTP ${landing?.status()}`);
   const [url,needle]=probes[name];
   const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
   if(!response?.ok())throw new Error(`HTTP ${response?.status()}`);
   const body=await page.locator('body').innerText();
   if(!body.toLowerCase().includes(needle.toLowerCase()))throw new Error(`Expected reading text not visible: ${needle}`);
   console.log(`PASS ${name}: chapter/verse readable — ${url}`);
  }catch(error){failed++;console.error(`FAIL ${name}: ${error.message.split('\n')[0]}`);}
  finally{await page.close();}
 }
}finally{await browser.close();}
if(failed)process.exitCode=1;
