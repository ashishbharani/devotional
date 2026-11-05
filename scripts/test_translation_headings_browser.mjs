import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const codes=['hi','mr','gu','bn','pa','te','kn','ml','ta'];
const packs=Object.fromEntries(await Promise.all(codes.map(async code=>[
  code,JSON.parse(await readFile(`docs/assets/translations/${code}.json`,'utf8')).translations
])));
const tests={
  'about/':[
    'How It All Began','The Influence of My Parents','An Advocate by Profession',
    'A Bridge Between Generations','A Bridge Between Communities',
    'Helping People Become Better Partners','Tradition and Technology Can Work Together',
    'A Living Project','My Hope',
  ],
  'foreword/':[
    'Dedicated to My Parents','WHAT IT BECAME','BETWEEN REALISM AND FAITH',
    'A LIVING COLLECTION','PASS IT FORWARD','TO MY PARENTS',
  ],
};
const root='http://127.0.0.1:4352/devotional/';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{
  env:{...process.env,HDC_PREVIEW_PORT:'4352'},stdio:['ignore','pipe','inherit']
});
await new Promise((resolve,reject)=>{
  server.stdout.once('data',resolve);
  server.once('error',reject);
});
const browser=await chromium.launch({
  ...(process.env.PANCHANG_BROWSER?{executablePath:process.env.PANCHANG_BROWSER}:{})
});
try {
  const page=await browser.newPage({viewport:{width:390,height:844},serviceWorkers:'block'});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const headings=()=>page.locator('.abp-project-info h2').evaluateAll(elements=>elements.map(el=>
    [...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE)
      .map(n=>n.nodeValue).join('').trim()
  ));
  for(const [route,required] of Object.entries(tests)){
    await page.goto(root+route);
    await page.waitForFunction(()=>Boolean(window.abpI18n&&document.querySelector('.abp-language-btn:not(:disabled)')));
    await page.evaluate(()=>window.abpI18n.applyLanguage('en'));
    const originals=await headings();
    for(const source of required)assert.ok(originals.includes(source),`${route}: source heading missing: ${source}`);
    for(const code of codes){
      await page.evaluate(code=>window.abpI18n.applyLanguage(code),code);
      const rendered=await headings();
      for(const source of required){
        const expected=packs[code][source];
        assert.ok(expected&&expected!==source,`${code}: missing dedicated translated heading: ${source}`);
        assert.equal(rendered[originals.indexOf(source)],expected,`${code}/${route}: rendered heading`);
      }
      assert.equal(await page.locator('html').getAttribute('lang'),code);
    }
    await page.evaluate(()=>window.abpI18n.applyLanguage('en'));
    assert.deepEqual(await headings(),originals,`${route}: exact English heading restoration`);
  }
  assert.deepEqual(errors,[],'no translation runtime page errors');
  console.log('PASS 9-language current About/Foreword heading translation, page navigation and English restoration');
  await page.close();
} finally {
  await browser.close();
  server.kill();
}
