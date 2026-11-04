// V2 scheduling core. Pure, clock-injected, and deliberately not wired to production.
// A verified family window is a reviewed record, never inferred from member dates.
const DAY=86400000,OFFSET=330*60000;
export const TIME_ZONE='Asia/Kolkata'; // Modern Indian civil dates have no DST.
const id=value=>typeof value==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const text=value=>typeof value==='string'&&value.trim().length>0;
const unique=values=>new Set(values).size===values.length;
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function milliseconds(value){
 if(!(value instanceof Date)&&typeof value!=='number'&&typeof value!=='string')throw Error('Invalid clock');
 if(typeof value==='string'&&!/^\d{4}-\d{2}-\d{2}$/.test(value)&&!/^\d{4}-.*(?:Z|[+-]\d{2}:\d{2})$/.test(value))throw Error('Clock needs an explicit offset');
 if(typeof value==='string')ordinal(value.slice(0,10));
 const time=new Date(value).getTime();if(!Number.isFinite(time))throw Error('Invalid clock');return time;
}
export function ordinal(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw Error('Invalid civil date');
 const time=Date.parse(value+'T00:00:00Z');
 if(!Number.isFinite(time)||new Date(time).toISOString().slice(0,10)!==value)throw Error('Invalid civil date');
 return time/DAY;
}
export function indiaDate(now){
 const time=milliseconds(now);
 return new Date(time+OFFSET).toISOString().slice(0,10);
}
export function nextMidnightDelay(now){
 const time=milliseconds(now);
 return (Math.floor((time+OFFSET)/DAY)+1)*DAY-OFFSET-time;
}
export function stageFor(start,end,day){
 if(ordinal(end)<ordinal(start))throw Error('Invalid period');
 const delta=ordinal(start)-ordinal(day);
 if(delta>7||ordinal(day)>ordinal(end))return null;
 return delta>=4?'anticipation':delta>=1?'approach':'celebration';
}
function evidence(record){
 if(record.status!=='verified'||record.approval?.approved!==true)return false;
 if(typeof record.approval.reviewer!=='string'||!record.approval.reviewer.trim())throw Error('Missing reviewer');
 ordinal(record.approval.reviewedOn);
 if(!Array.isArray(record.sources)||!record.sources.length)throw Error('Missing sources');
 for(const source of record.sources){
  const url=new URL(source.url);
  if(url.protocol!=='https:'||url.username||url.password||!text(source.label))throw Error('Invalid source');
  ordinal(source.reviewedOn);
 }
 return true;
}
export function validateWindow(record,registry){
 const family=registry.families.find(f=>f.id===record.family);
 if(!id(record.id)||!id(record.family)||!id(record.theme)||!family||family.theme!==record.theme)throw Error('Invalid identity/family art direction');
 if(!text(record.name)||!text(record.tradition))throw Error('Missing cultural context');
 if(!Array.isArray(record.regions)||!record.regions.length||!unique(record.regions)||record.regions.some(r=>!registry.regions.includes(r)))throw Error('Invalid region');
 if(!Number.isInteger(record.priority)||record.priority<0||record.priority>100)throw Error('Invalid priority');
 if(ordinal(record.end)<ordinal(record.start)||ordinal(record.end)-ordinal(record.start)>366)throw Error('Invalid family window');
 if(!registry.themes.includes(record.theme))throw Error('Unavailable art direction');
 return evidence(record);
}
const compare=(a,b)=>a===b?0:a<b?-1:1;
function overrideTime(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value))throw Error('Invalid override timestamp');
 return milliseconds(value);
}
export function validateRegistry(registry){
 if(!object(registry)||registry.schema!==2||!Array.isArray(registry.windows)||!Array.isArray(registry.families)||!Array.isArray(registry.regions)||!Array.isArray(registry.themes))throw Error('Invalid registry shape');
 if(!registry.regions.includes('IN')||!unique(registry.regions)||registry.regions.some(r=>typeof r!=='string'||!/^IN(?:-[A-Z]{2,3})?$/.test(r)))throw Error('Invalid region registry');
 if(!unique(registry.themes)||registry.themes.some(t=>!id(t)))throw Error('Invalid theme registry');
 if(registry.families.some(f=>!object(f)||!id(f.id))||!unique(registry.families.map(f=>f.id)))throw Error('Ambiguous family registry');
 if(registry.members!==undefined&&!Array.isArray(registry.members))throw Error('Invalid members registry');
 if((registry.members||[]).some(m=>!object(m)||!id(m.id))||!unique((registry.members||[]).map(m=>m.id)))throw Error('Ambiguous member registry');
 return registry;
}
function validatePolicy(policy){
 if(!object(policy)||typeof policy.enabled!=='boolean')throw Error('Invalid policy');
 for(const field of ['disabledIds','disabledFamilies'])if(policy[field]!==undefined&&(!Array.isArray(policy[field])||policy[field].some(v=>!id(v))||!unique(policy[field])))throw Error('Invalid disabled list');
 if(policy.overrides!==undefined&&(!Array.isArray(policy.overrides)||policy.overrides.some(o=>!object(o)||!id(o.windowId))))throw Error('Invalid override policy');
 if(policy.priorities!==undefined&&(!object(policy.priorities)||Object.entries(policy.priorities).some(([key,value])=>!id(key)||!Number.isInteger(value)||value<0||value>100)))throw Error('Invalid priorities');
}
export function selectExperience(registry,{clock=()=>new Date(),region='IN',mode='auto',policy={enabled:false}}={}){
 const original=reason=>({kind:'original',reason,warnings:[]});
 if(mode==='original')return original('visitor-opt-out');
 try{validatePolicy(policy);}catch{return original('invalid-policy');}
 if(mode!=='auto'||policy.enabled!==true)return original('administrator-disabled');
 let now,day;
 try{now=milliseconds(clock());day=indiaDate(now);}catch{return original('invalid-clock');}
 try{validateRegistry(registry);}catch{return original('invalid-registry');}
 if(!registry.regions.includes(region))return original('invalid-region');
 const seen=new Set(),warnings=[],candidates=[];
 for(const record of registry.windows){
  if(!object(record)||!id(record.id)){warnings.push({id:null,message:'Invalid window identity'});continue;}
  if(seen.has(record.id))return original('ambiguous-window-id');
  seen.add(record.id);
  if(record.enabled===false||policy.disabledIds?.includes(record.id)||policy.disabledFamilies?.includes(record.family))continue;
  try{
   if(!validateWindow(record,registry))continue;
   if(region!=='IN'&&!record.regions.includes('IN')&&!record.regions.includes(region))continue;
   let stage=stageFor(record.start,record.end,day),override=null;
   const overrides=(policy.overrides||[]).filter(o=>o.windowId===record.id);
   if(overrides.length>1)throw Error('Ambiguous override');
   if(overrides.length){
    const o=overrides[0],start=overrideTime(o.startsAt),end=overrideTime(o.expiresAt);
    if(o.approved!==true||!o.reviewer?.trim()||!/^\d{4}-.*(?:Z|[+-]\d{2}:\d{2})$/.test(o.startsAt)||!/^\d{4}-.*(?:Z|[+-]\d{2}:\d{2})$/.test(o.expiresAt)||!Number.isFinite(start)||!Number.isFinite(end)||start>=end||!['anticipation','approach','celebration'].includes(o.stage))throw Error('Invalid override');
    if(now>=start&&now<end){stage=o.stage;override=o;}
   }
   if(!stage)continue;
   candidates.push({record,stage,override,priority:policy.priorities?.[record.id]??record.priority,regional:region!=='IN'&&record.regions.includes(region),daysUntil:Math.max(0,ordinal(record.start)-ordinal(day))});
  }catch(error){warnings.push({id:record.id,message:error.message});}
 }
 // Celebration ALWAYS precedes anticipation, including when a regional window approaches.
 candidates.sort((a,b)=>Number(b.stage==='celebration')-Number(a.stage==='celebration')||Number(b.regional)-Number(a.regional)||b.priority-a.priority||compare(a.record.start,b.record.start)||compare(a.record.id,b.record.id));
 if(!candidates.length)return {...original('no-verified-window'),day,warnings};
 const winner=candidates[0],variations=[];
 for(const member of registry.members||[]){
  if(member.family!==winner.record.family||member.windowId!==winner.record.id)continue;
  try{
   if(!text(member.name))throw Error('Missing member label');
   if(!evidence(member))continue;
   if(ordinal(member.end)<ordinal(member.start)||ordinal(member.start)<ordinal(winner.record.start)||ordinal(member.end)>ordinal(winner.record.end))throw Error('Member outside reviewed family period');
   if(ordinal(day)>=ordinal(member.start)&&ordinal(day)<=ordinal(member.end))variations.push({id:member.id,name:member.name});
  }catch(error){warnings.push({id:member.id,message:error.message});}
 }
 variations.sort((a,b)=>compare(a.id,b.id));
 return {kind:'festival',day,id:winner.record.id,family:winner.record.family,theme:winner.record.theme,stage:winner.stage,daysUntil:winner.daysUntil,variations,warnings,
  reason:winner.override?'approved-administrator-override':'celebration-then-region-then-priority-then-date-then-id',
  alternatives:candidates.slice(1).map(c=>({id:c.record.id,family:c.record.family,stage:c.stage,priority:c.priority,regional:c.regional}))};
}
