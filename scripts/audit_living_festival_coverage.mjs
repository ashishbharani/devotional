// Read-only audit: never proposes inferred dates or changes verification status.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const registry=JSON.parse(await readFile('review/festivals/living-coverage.json','utf8'));
assert.equal(registry.regions.filter(r=>r.kind==='state').length,28);
assert.equal(registry.regions.filter(r=>r.kind==='union-territory').length,8);
assert.equal(new Set(registry.regions.map(r=>r.id)).size,36);
assert.deepEqual(registry.years,[2026,2027,2028,2029,2030]);
console.log('# V2 coverage review matrix — incomplete, no automatic activation');
console.log('| Region | Discovery status | '+registry.years.join(' | ')+' |');
console.log('| --- | --- | '+registry.years.map(()=>'---').join(' | ')+' |');
let missing=0;
for(const region of registry.regions){
 const cells=registry.years.map(year=>{
  const records=registry.windows.filter(w=>w.regions.includes(region.id)&&w.start.startsWith(`${year}-`)&&w.status==='verified'&&w.approval?.approved===true);
  if(!records.length)missing++;
  return records.length?`${records.length} reviewed records; completeness still requires audit`:'GAP — no V2 verified window';
 });
 console.log(`| ${region.name} | ${region.status} | ${cells.join(' | ')} |`);
}
console.log(`\nMissing verified region-year cells: ${missing}/180. A record count never certifies comprehensive coverage.`);
if(process.argv.includes('--require-ready')&&missing)process.exitCode=1;
