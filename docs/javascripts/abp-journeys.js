/* Browser-local, opt-in journey notes. Existing Japa/favourites/reader stores stay authoritative. */
(() => {
 'use strict';const key='hdc-journey-state-v1';let cleanup=()=>{};
 const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'{}')||{};}catch(_){return {};}};
 const normalize=value=>({name:typeof value.name==='string'?value.name.slice(0,120):'',minutes:[5,10,20].includes(value.minutes)?value.minutes:5,journal:typeof value.journal==='string'?value.journal.slice(0,5000):'',sessions:Array.isArray(value.sessions)?value.sessions.filter(s=>s&&typeof s.at==='string'&&Number.isFinite(Date.parse(s.at))&&[5,10,20].includes(s.minutes)).slice(-50):[]});
 function init(){
  cleanup();const root=document.querySelector('[data-journey]');if(!root)return;
  const controller=new AbortController(),q=s=>root.querySelector(s);cleanup=()=>controller.abort();
  let state=normalize(read(key)),sessionOnly=false;const status=q('[data-journey-status]');
  q('[data-routine-name]').value=state.name;q('[data-routine-minutes]').value=state.minutes;
  q('[data-journal]').value=state.journal;q('[data-journal-consent]').checked=Boolean(state.journal);
  function summary(){
   const japa=read('abp-japa-state-v1'),reader=read('hdc-reader-v1');
   q('[data-journey-japa]').textContent=Number.isSafeInteger(japa.count)&&japa.count>=0?`Existing Japa count: ${japa.count.toLocaleString()}.`:'No saved Japa count available.';
   q('[data-journey-reader]').textContent=reader.bookmark===true||reader.read===true?'Your Sacred Reader pilot has saved progress.':'No saved reader progress yet.';
   const now=Date.now(),week=state.sessions.filter(s=>now-Date.parse(s.at)>=0&&now-Date.parse(s.at)<=7*86400000);
   q('[data-journey-summary]').textContent=`${week.length} self-reported sessions · ${week.reduce((n,s)=>n+s.minutes,0)} minutes in the past seven elapsed days.`;
   const list=q('[data-journey-history]');list.replaceChildren();
   for(const s of [...state.sessions].reverse()){const li=document.createElement('li');li.textContent=`${new Date(s.at).toLocaleString()} — ${s.minutes} minutes (self-reported)`;list.append(li);}
  }
  const latest=()=>sessionOnly?state:normalize(read(key));
  function save(value){state=normalize(value);try{localStorage.setItem(key,JSON.stringify(state));sessionOnly=false;status.textContent='Saved in this browser only.';}catch(_){sessionOnly=true;status.textContent='Storage unavailable. Changes remain for this visit only.';}summary();}
  const on=(s,e,f)=>q(s).addEventListener(e,f,{signal:controller.signal});
  const start=()=>{const minutes=Number(q('[data-routine-minutes]').value);q('[data-routine-start]').href=new URL(`../sanctuary/?minutes=${[5,10,20].includes(minutes)?minutes:5}`,location.href).href;};
  on('[data-routine-minutes]','change',start);start();
  on('[data-journey-save]','click',()=>save({...latest(),name:q('[data-routine-name]').value,minutes:Number(q('[data-routine-minutes]').value),journal:q('[data-journal-consent]').checked?q('[data-journal]').value:''}));
  on('[data-journal-clear]','click',()=>{save({...latest(),journal:''});q('[data-journal]').value='';q('[data-journal-consent]').checked=false;});
  on('[data-session-record]','click',()=>{const current=latest(),minutes=Number(q('[data-routine-minutes]').value);if([5,10,20].includes(minutes))save({...current,sessions:[...current.sessions,{at:new Date().toISOString(),minutes}]});});
  window.addEventListener('storage',event=>{if(event.key===key)status.textContent='Journey changed in another tab. Reload to load it; your current draft has been kept.';else if(['abp-japa-state-v1','hdc-reader-v1'].includes(event.key))summary();},{signal:controller.signal});
  summary();
 }
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 if(window.document$?.subscribe)window.document$.subscribe(init);else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
