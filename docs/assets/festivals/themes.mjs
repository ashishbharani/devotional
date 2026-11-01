// Presentation metadata only; never a festival/date ruling or canonical identity.
export const THEMES = Object.freeze({
  ganesha: {name:'Ganesha',image:'assets/images/deities/ganesha-640.webp',path:'categories/01-deities-sub-deities-and-divine-forms/ganesha/'},
  shiva: {name:'Shiva',image:'assets/images/deities/shiva-640.webp',path:'categories/01-deities-sub-deities-and-divine-forms/shiva-mahesh/'},
});
const DAY=86400000;
const compare=(a,b)=>a===b?0:a<b?-1:1;
function ordinal(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))throw new Error('Invalid civil date');
  const ms=Date.parse(value+'T00:00:00Z');
  if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==value)throw new Error('Invalid civil date');
  return ms/DAY;
}
export function indiaDay(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const get=t=>parts.find(p=>p.type===t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function nextIndiaMidnight(now=Date.now()){
  return (Math.floor((now+330*60000)/DAY)+1)*DAY-330*60000-now;
}
export function validateSchedule(data){
  if(data?.schema!==1||!Number.isInteger(data.year)||data.year<1900||data.year>9998||!Array.isArray(data.events))throw new Error('Invalid festival schedule');
  const seen=new Set();
  for(const event of data.events){
    if(!event||typeof event.id!=='string'||!/^[-a-z0-9]+$/.test(event.id)||seen.has(event.id))throw new Error('Invalid or duplicate festival ID');
    seen.add(event.id);
    if(!['reviewed','unreviewed'].includes(event.status))throw new Error('Missing review state');
    if(event.status!=='reviewed')continue; // uncertain records must never activate
    if(typeof event.name!=='string'||!event.name.trim()||!Object.hasOwn(THEMES,event.theme))throw new Error('Invalid theme/label');
    if(!event.start.startsWith(`${data.year}-`)||ordinal(event.end)<ordinal(event.start)||ordinal(event.end)-ordinal(event.start)>366)throw new Error('Invalid observance window');
    if(!Array.isArray(event.regions)||!event.regions.length||event.regions.some(r=>typeof r!=='string'||!/^IN(?:-[A-Z]{2,3})?$/.test(r)))throw new Error('Missing region');
    if(typeof event.tradition!=='string'||!event.tradition.trim()||!Number.isInteger(event.priority)||event.priority<0||event.priority>100)throw new Error('Missing tradition/priority');
    if(typeof event.reviewer!=='string'||!event.reviewer.trim()||!Array.isArray(event.sources)||!event.sources.length)throw new Error('Missing review evidence');
    ordinal(event.reviewedOn);
    for(const source of event.sources){
      const url=new URL(source.url);
      if(url.protocol!=='https:'||url.username||url.password||typeof source.label!=='string'||!source.label.trim())throw new Error('Invalid source');
    }
  }
  return data;
}
export function eligibleEvents(schedules,day,region='IN'){
  const today=ordinal(day),ids=new Set();
  const events=schedules.flatMap(schedule=>validateSchedule(schedule).events).filter(e=>e.status==='reviewed');
  for(const event of events){if(ids.has(event.id))throw new Error('Duplicate cross-year event ID');ids.add(event.id);}
  return events.filter(e=>(e.regions.includes('IN')||e.regions.includes(region))&&today>=ordinal(e.start)-7&&today<=ordinal(e.end))
    .map(e=>({...e,phase:today<ordinal(e.start)?'approaching':'observance'}))
    .sort((a,b)=>Number(b.regions.includes(region)&&region!=='IN')-Number(a.regions.includes(region)&&region!=='IN')||b.priority-a.priority||compare(a.start,b.start)||compare(a.id,b.id));
}
