// Read-only audit: never proposes inferred dates or changes verification status.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {validateRegistry,validateWindow} from '../docs/assets/festivals/living-scheduler.mjs';
const registry=JSON.parse(await readFile('review/festivals/living-coverage.json','utf8'));
const activation=JSON.parse(await readFile(registry.activationRegistry,'utf8'));
const research=JSON.parse(await readFile(registry.candidateRegister,'utf8'));
const direct=JSON.parse(await readFile('review/festivals/direct-source-audit.json','utf8'));
validateRegistry(activation);
for(const record of activation.windows)if(record.status==='verified')assert.equal(validateWindow(record,activation),true,`invalid supposedly verified window ${record.id}`);
assert.deepEqual(registry.regions.map(r=>r.id).sort(),activation.regions.filter(r=>r!=='IN').sort(),'coverage jurisdictions match the runtime registry');
assert.deepEqual(research.jurisdictionAudits.map(r=>r.region).sort(),registry.regions.map(r=>r.id).sort());
assert.deepEqual(direct.records.map(r=>r.region).sort(),registry.regions.map(r=>r.id).sort());
assert.equal(direct.automaticActivationAllowed,false);
for(const record of direct.records){assert.ok(record.finding&&record.accessStatus&&record.reviewedOn);assert.equal(record.inventoryComplete,false,'an attempted source fetch is not comprehensive coverage');}
assert.equal(new Set(research.candidates.map(c=>c.id)).size,research.candidates.length,'unique research IDs');
assert.equal(research.automaticActivationAllowed,false,'discovery is never an activation source');
assert.equal(registry.regions.filter(r=>r.kind==='state').length,28);
assert.equal(registry.regions.filter(r=>r.kind==='union-territory').length,8);
assert.equal(new Set(registry.regions.map(r=>r.id)).size,36);
assert.deepEqual(registry.years,[2026,2027,2028,2029,2030]);
console.log('# V2 coverage review matrix — incomplete, no automatic activation');
console.log('| Region | Discovery status | '+registry.years.join(' | ')+' |');
console.log('| --- | --- | '+registry.years.map(()=>'---').join(' | ')+' |');
let missing=0;const tasks=[];
for(const region of registry.regions){
 const cells=registry.years.map(year=>{
  const records=activation.windows.filter(w=>(w.regions.includes(region.id)||w.regions.includes('IN'))&&w.start.startsWith(`${year}-`)&&w.status==='verified'&&w.approval?.approved===true);
  if(!records.length){missing++;tasks.push({region:region.id,year,status:'research-required',proposedStart:null,proposedEnd:null,required:['Local tradition and festival inventory review','Year-specific primary source and corroboration','Complete family endpoints and variations','Art direction and approval'],automaticPublication:false});}
  return records.length?`${records.length} reviewed records; completeness still requires audit`:'GAP — no V2 verified window';
 });
 const discovery=research.jurisdictionAudits.find(a=>a.region===region.id);
 console.log(`| ${region.name} | ${discovery.status}; completeness pending | ${cells.join(' | ')} |`);
}
console.log(`\nMissing verified region-year cells: ${missing}/180. A record count never certifies comprehensive coverage.`);
const incomplete=research.jurisdictionAudits.filter(a=>!a.complete).length;
console.log(`Research candidates: ${research.candidates.length}; incomplete jurisdiction audits: ${incomplete}/36. All 36 initial source leads have a direct follow-up or recorded retrieval failure; this is not a complete festival inventory. No date proposals are automatically generated or published.`);
const nextYear=new Date().getUTCFullYear()+1,nextYearGap=!registry.years.includes(nextYear);
console.log(`Next-year maintenance: ${nextYear}${nextYearGap?' is outside the supported register — add a reviewed year before activation.':' is in scope; verified regional coverage still requires the matrix review above.'}`);
if(process.argv.includes('--write-tasks')){
 // Existing records in a region must not hide its still-missing traditions.
 for(const audit of research.jurisdictionAudits.filter(a=>!a.complete))tasks.push({
  region:audit.region,status:'inventory-review-required',years:registry.years,
  candidateIds:research.candidates.filter(c=>c.regions.includes(audit.region)||c.regions.includes('IN')).map(c=>c.id),
  sourceFollowUp:direct.records.find(r=>r.region===audit.region),
  required:['Review candidate-specific dates even when a region-year has some verified records','Identify omitted major local festivals; candidate list is not a cap','Resolve unavailable/conflicting sources and tradition scope'],automaticPublication:false
 });
 await mkdir('work/festival-coverage',{recursive:true});
 await writeFile('work/festival-coverage/review-tasks.json',JSON.stringify({nextYear,nextYearGap,tasks},null,2));
}
if(process.argv.includes('--require-ready')&&(missing||incomplete||nextYearGap))process.exitCode=1;
