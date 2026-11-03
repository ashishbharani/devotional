/* Browser-local, opt-in journey notes. Existing Japa/favourites/reader stores stay authoritative. */
(() => {
 'use strict';const key='hdc-journey-state-v1',routineKey='hdc-journey-routines-v1';let cleanup=()=>{};
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{};}catch(_){return {};}};
 const normalize=value=>({name:typeof value.name==='string'?value.name.slice(0,120):'',minutes:[5,10,20].includes(value.minutes)?value.minutes:5,journal:typeof value.journal==='string'?value.journal.slice(0,5000):'',sessions:Array.isArray(value.sessions)?value.sessions.filter(s=>s&&typeof s.at==='string'&&Number.isFinite(Date.parse(s.at))&&[5,10,20].includes(s.minutes)).slice(-50):[]});
 const optional=(value,key,test)=>!Object.hasOwn(value,key)||test(value[key]);
 const journey=globalThis.hdcLocalState?.create({key,defaults:normalize({}),validate:value=>!Object.hasOwn(value,'schema')&&
  optional(value,'name',v=>typeof v==='string'&&v.length<=120)&&optional(value,'minutes',v=>[5,10,20].includes(v))&&
  optional(value,'journal',v=>typeof v==='string'&&v.length<=5000)&&optional(value,'sessions',v=>Array.isArray(v)&&v.length<=50&&!v.some(row=>!row||typeof row.at!=='string'||!Number.isFinite(Date.parse(row.at))||![5,10,20].includes(row.minutes)))});
 const library=globalThis.hdcLocalState?.create({key:routineKey,defaults:{schema:1,routines:[]},validate:value=>value.schema===1&&Array.isArray(value.routines)&&value.routines.length<=10&&!value.routines.some(r=>!r||typeof r.id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>120||![5,10,20].includes(r.minutes))&&new Set(value.routines.map(r=>r.id)).size===value.routines.length});
 const readJourney=()=>{if(!journey)throw new Error('Unavailable local records');return journey.get();};
 const readLibrary=()=>{if(!library)throw new Error('Unavailable local records');return library.get().routines;};
 function init(){
  cleanup();const root=document.querySelector('[data-journey]');if(!root)return;
  const controller=new AbortController(),q=s=>root.querySelector(s);let dayTimer;
  cleanup=()=>{controller.abort();clearTimeout(dayTimer);};
  let state=journey?.snapshot()||normalize({}),sessionOnly=false;const status=q('[data-journey-status]');
  try{state=readJourney();}catch(_){status.textContent='Saved journey is unavailable or has an unsupported format. Existing data has been kept; no changes will be saved.';}
  let routines=library?.snapshot().routines||[];
  try{routines=readLibrary();}catch(_){status.textContent='Routine library unavailable. Existing saved data has been kept; your active routine and journal remain available.';}
  q('[data-routine-name]').value=state.name;q('[data-routine-minutes]').value=state.minutes;
  q('[data-journal]').value=state.journal;q('[data-journal-consent]').checked=Boolean(state.journal);
  function summary(){
   const japa=read('abp-japa-state-v1'),reader=read('hdc-reader-v1');
   q('[data-journey-japa]').textContent=Number.isSafeInteger(japa.count)&&japa.count>=0?`Existing Japa count: ${japa.count.toLocaleString()}.`:'No saved Japa count available.';
   q('[data-journey-reader]').textContent=reader.bookmark===true||reader.read===true?'Your Sacred Reader pilot has saved progress.':'No saved reader progress yet.';
   const now=Date.now(),week=state.sessions.filter(s=>now-Date.parse(s.at)>=0&&now-Date.parse(s.at)<=7*86400000);
   const today=week.filter(s=>new Date(s.at).toDateString()===new Date(now).toDateString());
   const daily=q('[data-journey-today]');
   if(daily)daily.textContent=`Today: ${today.length} self-reported sessions · ${today.reduce((n,s)=>n+s.minutes,0)} minutes. Day boundary uses this browser's local timezone (${Intl.DateTimeFormat().resolvedOptions().timeZone}).`;
   q('[data-journey-summary]').textContent=`${week.length} self-reported sessions · ${week.reduce((n,s)=>n+s.minutes,0)} minutes in the past seven elapsed days.`;
   const list=q('[data-journey-history]');list.replaceChildren();
   for(const s of [...state.sessions].reverse()){const li=document.createElement('li');li.textContent=`${new Date(s.at).toLocaleString()} — ${s.minutes} minutes (self-reported)`;list.append(li);}
   clearTimeout(dayTimer);const next=new Date(now);next.setHours(24,0,0,50);
   dayTimer=setTimeout(()=>{if(root.isConnected)summary();},next.getTime()-now);
  }
  const latest=()=>{
   try{return readJourney();}catch(_){status.textContent='Saved journey could not be read, changed elsewhere or has an unsupported format. Existing data and your draft have been kept.';return null;}
  };
  function save(value){
   try{if(!journey)throw new Error('Unavailable local record');const result=journey.write({...value,...normalize(value)});state=result.value;sessionOnly=!result.persisted;status.textContent=result.persisted?'Saved in this browser only.':'Storage unavailable. Changes remain for this visit only.';summary();return result;}
   catch(_){status.textContent='Saved journey changed or is unavailable. Existing saved data and your draft have been kept.';return null;}
  }
  const on=(s,e,f)=>q(s).addEventListener(e,f,{signal:controller.signal});
  const start=()=>{const minutes=Number(q('[data-routine-minutes]').value);q('[data-routine-start]').href=new URL(`../sanctuary/?minutes=${[5,10,20].includes(minutes)?minutes:5}`,location.href).href;};
  on('[data-routine-minutes]','change',start);start();
  function renderLibrary(selected=''){
   const select=q('[data-routine-library]');if(!select)return;
   select.replaceChildren(new Option('Choose a saved routine',''));
   for(const r of routines)select.append(new Option(`${r.name} — ${r.minutes} minutes`,r.id));
   select.value=routines.some(r=>r.id===selected)?selected:'';q('[data-routine-library-remove]').disabled=!select.value;
  }
  const latestLibrary=()=>{try{return readLibrary();}catch(_){status.textContent='Routine library could not be read or changed elsewhere. The previous saved copy and visit-only changes have been kept.';return null;}};
  function saveLibrary(rows,selected=''){
   try{
    if(!library)throw new Error('Unavailable local record');
    const result=library.write({...library.get(),routines:rows});routines=result.value.routines;
    status.textContent=result.persisted?'Routine library saved in this browser only. Journal notes are not included.':'Routine library storage unavailable. These routine changes remain for this visit only.';
    renderLibrary(selected);
   }catch(_){status.textContent='Routine library changed or could not be saved. Existing data and this draft have been kept.';}
  }
  if(q('[data-routine-library]')){
   renderLibrary();
   on('[data-routine-library]','change',()=>{const r=routines.find(r=>r.id===q('[data-routine-library]').value);q('[data-routine-library-remove]').disabled=!r;if(r){q('[data-routine-name]').value=r.name;q('[data-routine-minutes]').value=r.minutes;start();status.textContent='Routine selected for this draft. Journal notes have not been changed.';}});
   on('[data-routine-library-save]','click',()=>{
    const rows=latestLibrary(),name=q('[data-routine-name]').value.trim().slice(0,120),minutes=Number(q('[data-routine-minutes]').value);if(!rows)return;
    if(!name){status.textContent='Enter a routine name before saving to the library.';return;}
    if(![5,10,20].includes(minutes))return;
    if(rows.length>=10){status.textContent='The routine library holds ten routines. Remove one before adding another.';return;}
    const id=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
    saveLibrary([...rows,{id,name,minutes}],id);
   });
   on('[data-routine-library-remove]','click',()=>{const rows=latestLibrary(),id=q('[data-routine-library]').value;if(rows&&id)saveLibrary(rows.filter(r=>r.id!==id));});
  }
  on('[data-journey-save]','click',()=>{const current=latest();if(current)save({...current,name:q('[data-routine-name]').value,minutes:Number(q('[data-routine-minutes]').value),journal:q('[data-journal-consent]').checked?q('[data-journal]').value:''});});
  on('[data-journal-clear]','click',()=>{const current=latest();if(!current||!save({...current,journal:''}))return;q('[data-journal]').value='';q('[data-journal-consent]').checked=false;});
  on('[data-session-record]','click',()=>{const current=latest(),minutes=Number(q('[data-routine-minutes]').value);if(current&&[5,10,20].includes(minutes))save({...current,sessions:[...current.sessions,{at:new Date().toISOString(),minutes}]});});
  if(q('[data-journey-load]'))on('[data-journey-load]','click',()=>{
   try{
    if(!journey||!library)throw new Error('Unavailable local records');
    // Validate both before replacing either draft, then explicitly accept saved copies.
    // get() intentionally refuses dirty conflicts; reload is the explicit discard action.
    const rawJourney=localStorage.getItem(key),rawLibrary=localStorage.getItem(routineKey);
    // Probe using each record's validator without mutating its current visit-only state.
    journey.check(rawJourney);library.check(rawLibrary);
    state=journey.reload();routines=library.reload().routines;sessionOnly=false;
    q('[data-routine-name]').value=state.name;q('[data-routine-minutes]').value=state.minutes;q('[data-journal]').value=state.journal;q('[data-journal-consent]').checked=Boolean(state.journal);
    renderLibrary();start();summary();q('[data-journey-load]').hidden=true;status.textContent='Saved changes loaded. The previous draft has been replaced.';
   }catch(_){status.textContent='Saved changes could not be loaded. Your current draft has been kept.';}
  });
  if(q('[data-log-erase-confirm]')){
   on('[data-log-erase-consent]','change',()=>{q('[data-log-erase-confirm]').disabled=!q('[data-log-erase-consent]').checked;});
   on('[data-log-erase-confirm]','click',()=>{
    if(!q('[data-log-erase-consent]').checked)return;
    let current;
    try{current=latest();if(!current)return;}
    catch(_){status.textContent='Saved practice log could not be read. Existing saved data and your draft have been kept.';return;}
    const result=save({...current,sessions:[]});if(!result)return;const persisted=result.persisted;
    q('[data-log-erase-consent]').checked=false;q('[data-log-erase-confirm]').disabled=true;
    status.textContent=persisted?'Practice log erased. Saved notes, routines, Japa and Reader state were kept.':'Practice log cleared for this visit only. The saved copy could not be changed.';
    if(persisted){q('[data-log-erase]').open=false;q('[data-log-erase] summary').focus();}
   });
  }
  window.addEventListener('storage',event=>{
   if([key,routineKey,null].includes(event.key)){if(event.key===key||event.key===null)journey?.changed();if(event.key===routineKey||event.key===null)library?.changed();status.textContent='Journey changed in another tab. Reload to load it; your current draft has been kept. Or choose Load saved changes to replace this draft.';if(q('[data-journey-load]'))q('[data-journey-load]').hidden=false;}
   if(['abp-japa-state-v1','hdc-reader-v1',null].includes(event.key))summary();
  },{signal:controller.signal});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&root.isConnected)summary();},{signal:controller.signal});
  summary();
 }
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 if(window.document$?.subscribe)window.document$.subscribe(init);else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
