// Read-only audit: never proposes inferred dates or changes verification status.
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const registry=JSON.parse(await readFile('review/festivals/living-coverage.json','utf8'));
const activation=JSON.parse(await readFile(registry.activationRegistry,'utf8'));
const research=JSON.parse(await readFile(registry.candidateRegister,'utf8'));
assert.deepEqual(registry.regions.map(r=>r.id).sort(),activation.regions.filter(r=>r!=='IN').sort(),'coverage jurisdictions match the runtime registry');
assert.deepEqual(research.jurisdictionAudits.map(r=>r.region).sort(),registry.regions.map(r=>r.id).sort());
assert.equal(new Set(research.candidates.map(c=>c.id)).size,research.candidates.length,'unique research IDs');
assert.equal(research.automaticActivationAllowed,false,'discovery is never an activation source');
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
  const records=activation.windows.filter(w=>(w.regions.includes(region.id)||w.regions.includes('IN'))&&w.start.startsWith(`${year}-`)&&w.status==='verified'&&w.approval?.approved===true);
  if(!records.length)missing++;
  return records.length?`${records.length} reviewed records; completeness still requires audit`:'GAP — no V2 verified window';
 });
 const discovery=research.jurisdictionAudits.find(a=>a.region===region.id);
 console.log(`| ${region.name} | ${discovery.status}; completeness pending | ${cells.join(' | ')} |`);
}
console.log(`\nMissing verified region-year cells: ${missing}/180. A record count never certifies comprehensive coverage.`);
const incomplete=research.jurisdictionAudits.filter(a=>!a.complete).length;
console.log(`Initial candidates: ${research.candidates.length}; incomplete jurisdiction audits: ${incomplete}/36. No date proposals are automatically generated or published.`);
if(process.argv.includes('--require-ready')&&(missing||incomplete))process.exitCode=1;
