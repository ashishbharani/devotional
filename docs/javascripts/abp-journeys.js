/* Browser-local, opt-in journey notes. Existing Japa/favourites/reader stores stay authoritative. */
(() => {
 'use strict';const key='hdc-journey-state-v1',routineKey='hdc-journey-routines-v1';let cleanup=()=>{};
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{};}catch(_){return {};}};
 const normalize=value=>({name:typeof value.name==='string'?value.name.slice(0,120):'',minutes:[5,10,20].includes(value.minutes)?value.minutes:5,journal:typeof value.journal==='string'?value.journal.slice(0,5000):'',sessions:Array.isArray(value.sessions)?value.sessions.filter(s=>s&&typeof s.at==='string'&&Number.isFinite(Date.parse(s.at))&&[5,10,20].includes(s.minutes)).slice(-50):[]});
 function init(){
  cleanup();const root=document.querySelector('[data-journey]');if(!root)return;
  const controller=new AbortController(),q=s=>root.querySelector(s);let dayTimer;
  cleanup=()=>{controller.abort();clearTimeout(dayTimer);};
  let state=normalize(read(key)),sessionOnly=false;const status=q('[data-journey-status]');
  let routines=[],librarySessionOnly=false;
  function readLibrary(){
   const raw=localStorage.getItem(routineKey);if(raw===null)return [];
   const value=JSON.parse(raw),rows=value?.routines;
   if(value?.schema!==1||!Array.isArray(rows)||rows.length>10||rows.some(r=>!r||typeof r.id!=='string'||!/^[-a-zA-Z0-9]{1,80}$/.test(r.id)||typeof r.name!=='string'||!r.name.trim()||r.name.length>120||![5,10,20].includes(r.minutes))||new Set(rows.map(r=>r.id)).size!==rows.length)throw new Error('Unsupported routine library');
   return rows.map(({id,name,minutes})=>({id,name,minutes}));
  }
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
  const latest=()=>sessionOnly?state:normalize(read(key));
  function save(value){state=normalize(value);try{localStorage.setItem(key,JSON.stringify(state));sessionOnly=false;status.textContent='Saved in this browser only.';}catch(_){sessionOnly=true;status.textContent='Storage unavailable. Changes remain for this visit only.';}summary();}
  const on=(s,e,f)=>q(s).addEventListener(e,f,{signal:controller.signal});
  const start=()=>{const minutes=Number(q('[data-routine-minutes]').value);q('[data-routine-start]').href=new URL(`../sanctuary/?minutes=${[5,10,20].includes(minutes)?minutes:5}`,location.href).href;};
  on('[data-routine-minutes]','change',start);start();
  function renderLibrary(selected=''){
   const select=q('[data-routine-library]');if(!select)return;
   select.replaceChildren(new Option('Choose a saved routine',''));
   for(const r of routines)select.append(new Option(`${r.name} — ${r.minutes} minutes`,r.id));
   select.value=routines.some(r=>r.id===selected)?selected:'';q('[data-routine-library-remove]').disabled=!select.value;
  }
  const latestLibrary=()=>{if(librarySessionOnly)return routines;try{return readLibrary();}catch(_){status.textContent='Routine library could not be read. The previous saved copy has been kept.';return null;}};
  function saveLibrary(rows,selected=''){
   routines=rows;
   try{localStorage.setItem(routineKey,JSON.stringify({schema:1,routines}));librarySessionOnly=false;status.textContent='Routine library saved in this browser only. Journal notes are not included.';}
   catch(_){librarySessionOnly=true;status.textContent='Routine library storage unavailable. These routine changes remain for this visit only.';}
   renderLibrary(selected);
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
  on('[data-journey-save]','click',()=>save({...latest(),name:q('[data-routine-name]').value,minutes:Number(q('[data-routine-minutes]').value),journal:q('[data-journal-consent]').checked?q('[data-journal]').value:''}));
  on('[data-journal-clear]','click',()=>{save({...latest(),journal:''});q('[data-journal]').value='';q('[data-journal-consent]').checked=false;});
  on('[data-session-record]','click',()=>{const current=latest(),minutes=Number(q('[data-routine-minutes]').value);if([5,10,20].includes(minutes))save({...current,sessions:[...current.sessions,{at:new Date().toISOString(),minutes}]});});
  if(q('[data-journey-load]'))on('[data-journey-load]','click',()=>{
   try{
    const value=JSON.parse(localStorage.getItem(key)||'{}');
    if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Invalid journey');
    const saved=normalize(value),library=readLibrary();
    state=saved;routines=library;sessionOnly=false;librarySessionOnly=false;
    q('[data-routine-name]').value=state.name;q('[data-routine-minutes]').value=state.minutes;q('[data-journal]').value=state.journal;q('[data-journal-consent]').checked=Boolean(state.journal);
    renderLibrary();start();summary();q('[data-journey-load]').hidden=true;status.textContent='Saved changes loaded. The previous draft has been replaced.';
   }catch(_){status.textContent='Saved changes could not be loaded. Your current draft has been kept.';}
  });
  if(q('[data-log-erase-confirm]')){
   on('[data-log-erase-consent]','change',()=>{q('[data-log-erase-confirm]').disabled=!q('[data-log-erase-consent]').checked;});
   on('[data-log-erase-confirm]','click',()=>{
    if(!q('[data-log-erase-consent]').checked)return;
    let current;
    try{current=sessionOnly?state:JSON.parse(localStorage.getItem(key)||'{}');if(!current||typeof current!=='object'||Array.isArray(current))throw new Error('Invalid journey');}
    catch(_){status.textContent='Saved practice log could not be read. Existing saved data and your draft have been kept.';return;}
    const next={...current,sessions:[]};let persisted=false;
    try{localStorage.setItem(key,JSON.stringify(next));sessionOnly=false;persisted=true;}catch(_){sessionOnly=true;}
    state=normalize(next);summary();q('[data-log-erase-consent]').checked=false;q('[data-log-erase-confirm]').disabled=true;
    status.textContent=persisted?'Practice log erased. Saved notes, routines, Japa and Reader state were kept.':'Practice log cleared for this visit only. The saved copy could not be changed.';
    if(persisted){q('[data-log-erase]').open=false;q('[data-log-erase] summary').focus();}
   });
  }
  window.addEventListener('storage',event=>{
   if([key,routineKey,null].includes(event.key)){status.textContent='Journey changed in another tab. Reload to load it; your current draft has been kept. Or choose Load saved changes to replace this draft.';if(q('[data-journey-load]'))q('[data-journey-load]').hidden=false;}
   if(['abp-japa-state-v1','hdc-reader-v1',null].includes(event.key))summary();
  },{signal:controller.signal});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&root.isConnected)summary();},{signal:controller.signal});
  summary();
 }
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 if(window.document$?.subscribe)window.document$.subscribe(init);else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
