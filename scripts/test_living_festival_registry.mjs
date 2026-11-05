// Publication/scope consistency checks; not an independent religious date ruling.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ordinal,selectExperience,validateRegistry,validateWindow} from '../docs/assets/festivals/living-scheduler.mjs';
import {THEMES,variationFor} from '../docs/assets/festivals/living-presentation.mjs';
const registry=validateRegistry(JSON.parse(await readFile('docs/assets/festivals/living-registry.json','utf8')));
const review=JSON.parse(await readFile('review/festivals/calendar-source-review.json','utf8'));
const policy=JSON.parse(await readFile('docs/assets/festivals/living-policy.json','utf8'));
assert.equal(policy.enabled,false,'release stays disabled until all gates and explicit deployment approval');
const ids=new Set(registry.windows.map(w=>w.id));assert.equal(ids.size,registry.windows.length);
assert.deepEqual([...ids].sort(),review.records.map(r=>r.windowId).sort(),'one canonical calendar, with review references rather than duplicate date lists');
for(const window of registry.windows){
 assert.equal(validateWindow(window,registry),true);
 assert.ok(Object.hasOwn(THEMES,window.theme),'every eligible period has a matching authored presentation');
 assert.ok(window.devotionalSubject&&window.overlapGroup&&window.assets&&window.significance);
 assert.equal(window.verificationScope,'published-calendar-reference');
 assert.equal(window.confidence,'source-checked-reference');
 assert.ok(window.name.includes(window.location));
 assert.equal(window.regions.length,1,'these reviewed records identify their city/state, not an inferred national religious ruling');
 assert.notEqual(window.regions[0],'IN');
 assert.ok(window.sourceReview.sourceTitle.includes(String(window.year))&&window.sourceReview.sourceTitle.includes(window.location.split(',')[0]));
 assert.match(window.sourceReview.sha256,/^[a-f0-9]{64}$/);
 for(const source of window.sources){
  const url=new URL(source.url);
  if(url.hostname==='www.drikpanchang.com'){
   assert.equal(url.searchParams.get('year'),String(window.year));assert.ok(url.searchParams.has('geoname-id'),'explicit location, independent of cached search geolocation');
  }else{
   assert.equal(url.hostname,'odishatourism.gov.in');assert.equal(window.location,'Puri, India');
   assert.ok(url.pathname.includes(String(window.year)),'an explicitly year-specific regional publication');
  }
 }
 const members=registry.members.filter(m=>m.windowId===window.id);
 assert.ok(members.length>0);assert.equal(new Set(members.map(m=>m.name)).size,members.length);
 for(const member of members){assert.equal(member.family,window.family);assert.ok(ordinal(member.start)>=ordinal(window.start)&&ordinal(member.end)<=ordinal(window.end));}
 for(const member of members)if(member.variant)assert.equal(variationFor(window.theme,[member]),member.variant,'published variants have an explicit safe presentation');
}
const at=(date,region='IN')=>selectExperience(registry,{clock:()=>date,region,policy:{enabled:true}});
assert.equal(at('2026-10-29T18:29:59Z').kind,'original');
assert.equal(at('2026-10-29T18:30:00Z').stage,'anticipation');
assert.equal(at('2026-11-02T06:00:00Z').stage,'anticipation');
assert.equal(at('2026-11-03T06:00:00Z').stage,'approach');
assert.equal(at('2026-11-06T06:00:00Z').family,'diwali','an active Diwali reference precedes approaching Chhath');
const lakshmi=at('2026-11-08T06:00:00Z');assert.equal(lakshmi.family,'diwali');assert.equal(variationFor(lakshmi.theme,lakshmi.variations),'lotus');assert.equal(lakshmi.variations.length,2);
assert.equal(at('2026-11-12T06:00:00Z').family,'chhath');
assert.equal(at('2026-11-12T06:00:00Z').stage,'approach');
assert.equal(variationFor('chhath',at('2026-11-15T06:00:00Z').variations),'sunset');
assert.equal(variationFor('chhath',at('2026-11-16T06:00:00Z').variations),'dawn');
assert.equal(at('2026-11-17T06:00:00Z').kind,'original');
assert.equal(at('2027-01-14T06:00:00Z','IN-TN').family,'pongal');
assert.equal(at('2027-01-14T06:00:00Z','IN-DL').kind,'original');
assert.equal(variationFor('diwali',[{variant:'unreviewed-decoration'}]),null);
assert.equal(variationFor('unknown',[{variant:'lotus'}]),null);
assert.equal(at('2026-09-06T18:29:59Z','IN-MH').kind,'original');
assert.equal(at('2026-09-06T18:30:00Z','IN-MH').stage,'anticipation');
assert.equal(at('2026-09-14T06:00:00Z','IN-MH').family,'ganeshotsav');
assert.equal(variationFor('ganesha',at('2026-09-25T06:00:00Z','IN-MH').variations),'farewell');
assert.equal(at('2026-09-26T06:00:00Z','IN-MH').kind,'original');
assert.equal(at('2026-10-16T06:00:00Z','IN-DL').family,'navratri');
assert.equal(at('2026-10-16T06:00:00Z','IN-WB').family,'durga-puja','regional traditions remain distinct during an overlap');
assert.equal(variationFor('navratri',at('2026-10-19T06:00:00Z','IN-DL').variations),'peacock-green');
assert.equal(at('2026-10-21T06:00:00Z','IN-DL').kind,'original');
assert.equal(at('2026-10-21T06:00:00Z','IN-WB').family,'durga-puja','Bengal endpoint is retained, not replaced by Delhi Vijayadashami');
assert.equal(at('2026-10-22T06:00:00Z','IN-WB').kind,'original');
assert.equal(at('2027-10-10T06:00:00Z','IN-DL').family,'navratri','do not force a published eleven-civil-day sequence into nine dates');
assert.equal(at('2026-07-08T18:29:59Z','IN-OD').kind,'original');
assert.equal(at('2026-07-08T18:30:00Z','IN-OD').stage,'anticipation');
assert.equal(at('2026-07-24T06:00:00Z','IN-OD').variations[0].name,'Bahuda Jatra');
assert.equal(at('2026-07-27T06:00:00Z','IN-OD').family,'ratha-jatra');
assert.equal(at('2026-07-28T06:00:00Z','IN-OD').kind,'original');
console.log(`PASS ${registry.windows.length} source-scoped reference periods and ${registry.members.length} member days: year/place URLs, real IST activation, family continuity, day variants, regions and disabled release policy`);
