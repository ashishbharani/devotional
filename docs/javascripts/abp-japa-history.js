/* Optional preview history of explicitly finished sessions; never another counter. */
(() => {
 'use strict';
 const KEY='hdc-japa-history-v1';let cleanup=()=>{};
 const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
 function read(){
  const raw=localStorage.getItem(KEY);if(raw===null)return {schema:1,sessions:[]};
  const value=JSON.parse(raw);
  if(value?.schema!==1||!Array.isArray(value.sessions)||value.sessions.length>50||value.sessions.some(s=>!s||!iso(s.startedAt)||!iso(s.finishedAt)||Date.parse(s.finishedAt)<Date.parse(s.startedAt)||!Number.isSafeInteger(s.count)||s.count<=0))throw new Error('Unsupported history');
  return value;
 }
 function init(){
  cleanup();const root=document.querySelector('[data-japa-history]'),counter=document.querySelector('#abp-japa[data-japa-history-enabled]');
  if(!root||!counter){cleanup=()=>{};return;}
  const controller=new AbortController(),q=s=>root.querySelector(s),status=q('[data-japa-history-status]');
  let history={schema:1,sessions:[]},sessionOnly=false,active=null;
  const current=()=>{
   const count=Number(counter.dataset.japaCount),epoch=Number(counter.dataset.japaEpoch);
   return counter.hasAttribute('data-japa-count')&&counter.hasAttribute('data-japa-epoch')&&Number.isSafeInteger(count)&&count>=0&&Number.isSafeInteger(epoch)&&epoch>=0?{count,epoch}:null;
  };
  function renderHistory(){
   const list=q('[data-japa-history-list]');list.replaceChildren();
   const total=history.sessions.reduce((sum,s)=>sum+BigInt(s.count),0n);
   q('[data-japa-history-summary]').textContent=`${history.sessions.length} finished sessions · ${total.toLocaleString()} counted repetitions. Times use this browser's local timezone (${Intl.DateTimeFormat().resolvedOptions().timeZone}).`;
   for(const s of [...history.sessions].reverse()){
    const li=document.createElement('li');li.textContent=`${new Date(s.startedAt).toLocaleString()} – ${new Date(s.finishedAt).toLocaleString()}: ${s.count.toLocaleString()} counted repetitions.`;list.append(li);
   }
  }
  function sessionControls(){
   const now=current();
   if(active&&(!now||now.epoch!==active.epoch||now.count<active.count)){
    active=null;status.textContent='Counter continuity changed (Undo, Fresh session or Reset). Recording was cancelled without saving. Start a new recording to continue.';
   }
   q('[data-japa-session-start]').disabled=Boolean(active)||!now;
   q('[data-japa-session-finish]').disabled=!active;
   q('[data-japa-session-cancel]').disabled=!active;
   q('[data-japa-session-progress]').textContent=active?`Recording: ${(now.count-active.count).toLocaleString()} repetitions added since Start. No history is saved until Finish.`:'No session recording.';
  }
  function latest(){
   if(sessionOnly)return history;
   try{return read();}catch(_){status.textContent='Saved Japa history is unavailable or has an unsupported format. Existing data has been kept; this action was not saved.';return null;}
  }
  function save(value){
   history=value;
   try{localStorage.setItem(KEY,JSON.stringify(value));sessionOnly=false;status.textContent='Japa session history saved in this browser only. The existing counter was not changed.';}
   catch(_){sessionOnly=true;status.textContent='History storage unavailable. History changes remain for this visit only; the saved copy was not changed.';}
   renderHistory();
  }
  const on=(s,type,fn)=>q(s).addEventListener(type,fn,{signal:controller.signal});
  on('[data-japa-session-start]','click',()=>{
   const now=current();if(!now)return;
   active={...now,startedAt:new Date().toISOString()};status.textContent='Recording started using the existing counter. Finish explicitly to save, or Cancel to discard this recording.';sessionControls();
  });
  on('[data-japa-session-finish]','click',()=>{
   sessionControls();if(!active)return;
   const now=current(),finishedAt=new Date().toISOString(),count=now.count-active.count;
   if(!Number.isSafeInteger(count)||count<=0){status.textContent='Add at least one repetition with the existing counter before Finish, or Cancel this recording.';return;}
   if(Date.parse(finishedAt)<Date.parse(active.startedAt)){status.textContent='The device clock moved backwards. Cancel this recording and start again; no history was saved.';return;}
   const previous=latest();if(!previous)return;
   save({...previous,sessions:[...previous.sessions,{startedAt:active.startedAt,finishedAt,count}].slice(-50)});active=null;sessionControls();
  });
  on('[data-japa-session-cancel]','click',()=>{active=null;status.textContent='Recording cancelled without saving. Your counter and saved history were kept.';sessionControls();});
  on('[data-japa-history-erase-consent]','change',()=>{q('[data-japa-history-erase-confirm]').disabled=!q('[data-japa-history-erase-consent]').checked;});
  on('[data-japa-history-erase-confirm]','click',()=>{
   if(!q('[data-japa-history-erase-consent]').checked)return;
   const previous=latest();if(!previous)return;
   save({...previous,sessions:[]});
   if(!sessionOnly)status.textContent='Only saved Japa session history was erased. Your current counter, preferences and other saved tools were kept.';
   q('[data-japa-history-erase-consent]').checked=false;q('[data-japa-history-erase-confirm]').disabled=true;
   q('[data-japa-history-erase]').open=false;q('[data-japa-history-erase] summary').focus();
  });
  window.addEventListener('storage',event=>{
   const cancelled=(event.key==='abp-japa-state-v1'||event.key===null)&&Boolean(active);
   if(cancelled){active=null;status.textContent='Another tab changed the counter. This recording was cancelled without saving; your current counter was not reset.';sessionControls();}
   if(event.key!==KEY&&event.key!==null)return;
   if(sessionOnly){status.textContent='Japa history changed in another tab. Reload to load it; this visit’s history has been kept.';return;}
   try{history=read();renderHistory();if(!cancelled)status.textContent='Japa history updated from another tab.';}catch(_){status.textContent='Changed Japa history could not be read. Existing saved data was kept.';}
  },{signal:controller.signal});
  const observer=new MutationObserver(()=>{if(root.isConnected)sessionControls();});
  observer.observe(counter,{attributes:true,attributeFilter:['data-japa-count','data-japa-epoch']});
  cleanup=()=>{controller.abort();observer.disconnect();active=null;};
  try{history=read();}catch(_){status.textContent='Saved Japa history is unavailable or has an unsupported format. Existing data has been kept.';}
  renderHistory();sessionControls();
 }
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 if(window.document$?.subscribe)window.document$.subscribe(init);
 else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
