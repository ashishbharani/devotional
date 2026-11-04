/* Review-build enhancement. No astronomy, catalogue or existing preference writes. */
(() => {
 'use strict';
 if(globalThis.hdcLivingFestival)return;
 globalThis.hdcLivingFestival=true;
 const base=new URL('../',document.currentScript.src),assets=new URL('assets/festivals/',base),key='hdc-living-festival-preferences-v2';
 const modules=Promise.all([import(new URL('living-scheduler.mjs',assets)),import(new URL('living-presentation.mjs',assets))]);
 // Avoid an unhandled rejection if an offline asset is missing before init awaits it.
 modules.catch(()=>{});
 let release=()=>{},resources,epoch=0,visitPrefs;
 const restore=()=>{
  for(const field of ['hdcFestival','hdcStage','hdcQuality'])delete document.documentElement.dataset[field];
  document.querySelector('.hdc-living-scenery')?.remove();document.querySelector('.hdc-living-hero')?.remove();
 };
 const record=globalThis.hdcLocalState?.create({key,defaults:{schema:2,mode:'auto',region:'IN',effects:'auto'},validate:p=>p.schema===2&&['auto','original'].includes(p.mode)&&/^IN(?:-[A-Z]{2,3})?$/.test(p.region)&&['auto','reduced','none'].includes(p.effects)});
 async function init(){
  release();const own=++epoch,root=document.querySelector('[data-living-festival]');
  if(!root){restore();return;}
  const controller=new AbortController(),{signal}=controller,q=s=>root.querySelector(s);let timer,preview=null,storageNote='';
  release=()=>{controller.abort();clearTimeout(timer);};
  const status=q('[data-living-status]');
  q('[data-living-original]').addEventListener('click',restore,{signal});
  let scheduler,presentation,data;
  try{
   [scheduler,presentation]=await modules;
   // All supported years are local/versioned. Midnight needs no new network read.
   if(!resources){
    resources=Promise.all(['living-registry.json','living-policy.json'].map(async file=>{
     const response=await fetch(new URL(file,assets));if(!response.ok)throw Error('Unavailable local schedule');return response.json();
    }));resources.catch(()=>{});
   }
   data=await resources;
   scheduler.validateRegistry(data[0]);if(data[1]?.schema!==1)throw Error('Invalid administrator policy');
  }catch(_){
   if(own!==epoch||signal.aborted)return;
   restore();status.textContent='Festival assets or schedule unavailable; original appearance retained.';resources=undefined;
   return;
  }
  if(own!==epoch||signal.aborted||!root.isConnected)return;
  const [registry,policy]=data,{THEMES,ornament,quality}=presentation;
  let prefs={schema:2,mode:'auto',region:'IN',effects:'auto'};
  try{
   if(!record)throw Error('Local preferences unavailable');prefs=record.get();
   // Honour a previous Original selection without migrating or overwriting V1.
   if(localStorage.getItem(key)===null){
    try{if(JSON.parse(localStorage.getItem('hdc-festival-preferences-v1')||'null')?.mode==='original')prefs.mode='original';}catch(_){}
   }
   if(record.dirty)storageNote=' Preferences apply only to this visit.';
  }catch(_){prefs=visitPrefs||{...(record?.snapshot()||prefs),mode:'original'};storageNote=' Saved preferences are unavailable or unsupported; existing data has been kept.';}
  if(!registry.regions.includes(prefs.region)){prefs={...prefs,mode:'original'};storageNote+=' Saved region is unsupported; original appearance retained.';}
  q('[data-living-region]').replaceChildren(...registry.regions.map(value=>{const option=document.createElement('option');option.value=value;option.textContent=registry.regionNames?.[value]||value;return option;}));
  q('[data-living-mode]').value=prefs.mode;q('[data-living-effects]').value=prefs.effects;
  q('[data-living-region]').value=registry.regions.includes(prefs.region)?prefs.region:'IN';
  const previews=q('[data-living-preview-buttons]');previews.replaceChildren();
  q('[data-living-previews]').hidden=policy.previewEnabled!==true;
  if(policy.previewEnabled===true)for(const [id,theme] of Object.entries(THEMES)){
   const button=document.createElement('button');button.type='button';button.textContent=theme.name;
   button.addEventListener('click',()=>{preview=id;render();},{signal});previews.append(button);
  }
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),contrast=matchMedia('(forced-colors: active), (prefers-contrast: more)');
  function render(){
   const mode=q('[data-living-mode]').value,region=q('[data-living-region]').value;
   const result=scheduler.selectExperience(registry,{mode,region,policy});
   const themeId=preview||result.theme,theme=Object.hasOwn(THEMES,themeId)?THEMES[themeId]:null;
   const info=q('[data-living-info]'),sources=q('[data-living-sources]');sources.replaceChildren();
   if(!theme){
    restore();info.hidden=true;
    status.textContent=(result.reason==='visitor-opt-out'?'Original HDC appearance selected.':result.reason==='administrator-disabled'?'Automatic festival themes are disabled by the maintainer.':'No applicable verified festival period. Original HDC appearance retained.')+storageNote;
   }else{
    const stage=preview?q('[data-living-stage]').value:result.stage;
    document.documentElement.dataset.hdcFestival=themeId;document.documentElement.dataset.hdcStage=stage;
    document.documentElement.dataset.hdcQuality=quality({effects:q('[data-living-effects]').value,reducedMotion:motion.matches||document.documentElement.classList.contains('abp-still'),highContrast:contrast.matches||document.documentElement.classList.contains('abp-hc'),dataSaver:navigator.connection?.saveData===true,cores:navigator.hardwareConcurrency??4,memory:navigator.deviceMemory??4});
    let scenery=document.querySelector('.hdc-living-scenery');
    if(!scenery){scenery=document.createElement('div');scenery.className='hdc-living-scenery';scenery.setAttribute('aria-hidden','true');document.body.append(scenery);}
    if(scenery.dataset.theme!==themeId){scenery.dataset.theme=themeId;scenery.replaceChildren(...Array.from({length:8},()=>ornament(document,theme.motif)));}
    const hero=document.querySelector('.udhc-hero');
    if(hero){
     let ornamentation=hero.querySelector('.hdc-living-hero');
     if(!ornamentation){ornamentation=document.createElement('div');ornamentation.className='hdc-living-hero';ornamentation.setAttribute('aria-hidden','true');hero.append(ornamentation);}
     if(ornamentation.dataset.theme!==themeId){ornamentation.dataset.theme=themeId;ornamentation.replaceChildren(...Array.from({length:4},()=>ornament(document,theme.motif)));}
    }
    info.hidden=false;q('[data-living-title]').textContent=preview?`${theme.name} — design preview`:registry.windows.find(w=>w.id===result.id).name;
    q('[data-living-note]').textContent=theme.summary;
    q('[data-living-countdown]').textContent=preview?`Visual stage: ${stage}. No festival date is implied.`:result.stage==='celebration'?`Verified celebration period; Indian date ${result.day}. ${result.variations.map(v=>v.name).join(' · ')}`:`${result.daysUntil} Indian calendar days until the reviewed period. Stage: ${result.stage}.`;
    q('[data-living-explore]').href=new URL(theme.path,base).href;
    if(!preview)for(const source of registry.windows.find(w=>w.id===result.id).sources){const li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.textContent=source.label;li.append(a);sources.append(li);}
    status.textContent=(preview?'Manual design preview. It ends on navigation or reload.':`Automatic reviewed festival appearance. ${result.reason}.`)+storageNote;
   }
   const upcoming=q('[data-living-upcoming]');upcoming.replaceChildren();
   const day=scheduler.indiaDate(new Date());
   // Use the scheduler's own evidence/policy/region selection on each future start.
   const future=registry.windows.filter(w=>typeof w?.start==='string'&&w.start>day).filter(w=>scheduler.selectExperience({...registry,windows:[w]},{clock:()=>w.start+'T00:00:00+05:30',region,policy}).kind==='festival').sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
   for(const event of future.slice(0,12)){const li=document.createElement('li');li.textContent=`${event.name}: ${event.start} – ${event.end}`;upcoming.append(li);}
   if(!future.length){const li=document.createElement('li');li.textContent='No upcoming verified periods are currently available for this region.';upcoming.append(li);}
  }
  function save(){
   preview=null;
   visitPrefs={schema:2,mode:q('[data-living-mode]').value,region:q('[data-living-region]').value,effects:q('[data-living-effects]').value};
   try{if(!record)throw Error('No local record');const previous=record.get();const value={...previous,mode:q('[data-living-mode]').value,region:q('[data-living-region]').value,effects:q('[data-living-effects]').value};storageNote=record.write(value).persisted?'':' Preferences apply only to this visit.';}
   catch(_){storageNote=' Preferences could not be saved; existing data has been kept.';}
   render();
  }
  for(const selector of ['[data-living-mode]','[data-living-region]','[data-living-effects]'])q(selector).addEventListener('change',save,{signal});
  q('[data-living-stage]').addEventListener('change',render,{signal});
  q('[data-living-original]').addEventListener('click',()=>{q('[data-living-mode]').value='original';save();},{signal});
  q('[data-living-share]').addEventListener('click',async()=>{
   const theme=THEMES[preview||document.documentElement.dataset.hdcFestival];if(!theme)return;
   const text=`${preview?'Design preview — ':''}${theme.greeting} | ${document.querySelector('meta[property="og:site_name"]')?.content||document.title}`;
   const message=q('[data-living-share-status]');
   try{if(navigator.share){await navigator.share({title:theme.name,text,url:new URL(theme.path,base).href});message.textContent='';}else if(navigator.clipboard){await navigator.clipboard.writeText(text);message.textContent='Greeting copied.';}else message.textContent=text;}
   catch(error){message.textContent=error.name==='AbortError'?'':'Sharing unavailable; '+text;}
  },{signal});
  motion.addEventListener('change',render,{signal});contrast.addEventListener('change',render,{signal});
  navigator.connection?.addEventListener('change',render,{signal});
  const observer=new MutationObserver(render);observer.observe(document.documentElement,{attributeFilter:['class']});
  const previousRelease=release;release=()=>{observer.disconnect();previousRelease();};
  render();timer=setTimeout(init,Math.max(100,scheduler.nextMidnightDelay(Date.now())));
 }
 window.addEventListener('storage',event=>{if(event.key===key||event.key==='hdc-festival-preferences-v1'||event.key===null){record?.changed();init();}});
 window.addEventListener('pagehide',()=>{release();restore();});window.addEventListener('pageshow',init);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')init();});
 if(window.document$?.subscribe)window.document$.subscribe(init);
 else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
