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
  for(const field of ['hdcFestival','hdcStage','hdcQuality','hdcVariant'])delete document.documentElement.dataset[field];
  document.querySelector('.hdc-living-scenery')?.remove();document.querySelector('.hdc-living-hero')?.remove();
 };
 const slug=value=>typeof value==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
 const record=globalThis.hdcLocalState?.create({key,defaults:{schema:2,mode:'auto',region:'IN',effects:'auto'},validate:p=>p.schema===2&&['auto','original','preview'].includes(p.mode)&&(p.mode!=='preview'||slug(p.previewTheme))&&(!Object.hasOwn(p,'previewTheme')||slug(p.previewTheme))&&/^IN(?:-[A-Z]{2,3})?$/.test(p.region)&&['auto','reduced','none'].includes(p.effects)});
 async function init(){
  release();const own=++epoch,root=document.querySelector('[data-living-festival]');
  if(!root){restore();return;}
  const controller=new AbortController(),{signal}=controller,q=s=>root.querySelector(s);let timer,preview=null,storageNote='',ready=false;
  release=()=>{controller.abort();clearTimeout(timer);};
  const status=q('[data-living-status]');
  q('[data-living-original]').addEventListener('click',()=>{
   restore();
   if(!ready){
    visitPrefs={schema:2,mode:'original',region:'IN',effects:'none'};
    try{const previous=record.get();record.write({...previous,mode:'original'});}catch(_){}
    q('[data-living-mode]').value='original';
   }
  },{signal});
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
  const [registry,policy]=data,{THEMES,ornament,quality,variationFor}=presentation;
  let prefs={schema:2,mode:'auto',region:'IN',effects:'auto'};
  try{
   if(!record)throw Error('Local preferences unavailable');prefs=record.get();
   // Read through supported legacy choices, without writing or deleting V1.
   if(localStorage.getItem(key)===null){
    try{
     const legacy=JSON.parse(localStorage.getItem('hdc-festival-preferences-v1')||'null');
     if(legacy&&typeof legacy==='object'&&!Array.isArray(legacy)){
      const valid=!Object.hasOwn(legacy,'schema')&&(!Object.hasOwn(legacy,'mode')||['auto','original','ganesha','shiva'].includes(legacy.mode))&&(!Object.hasOwn(legacy,'region')||registry.regions.includes(legacy.region))&&(!Object.hasOwn(legacy,'effects')||typeof legacy.effects==='boolean');
      if(!valid){prefs.mode='original';storageNote=' Existing appearance preference is unsupported; its saved record is unchanged.';}
      else{
       if(['auto','original'].includes(legacy.mode))prefs.mode=legacy.mode;
       // Current main retired the old saved demo modes. Preserve their bytes,
       // region and effects, and follow its effective Auto behaviour rather
       // than reviving a retired demo when this independent engine is enabled.
       else if(['ganesha','shiva'].includes(legacy.mode))storageNote=' A retired design choice remains in saved data; automatic mode is used.';
       if(registry.regions.includes(legacy.region))prefs.region=legacy.region;
       if(typeof legacy.effects==='boolean')prefs.effects=legacy.effects?'auto':'none';
      }
     }
    }catch(_){prefs.mode='original';storageNote=' Existing appearance preference is unreadable; its saved record is unchanged.';}
   }
   if(record.dirty)storageNote=' Preferences apply only to this visit.';
  }catch(_){prefs=visitPrefs||{...(record?.snapshot()||prefs),mode:'original'};storageNote=' Saved preferences are unavailable or unsupported; existing data has been kept.';}
  if(!registry.regions.includes(prefs.region)){prefs={...prefs,mode:'original'};storageNote+=' Saved region is unsupported; original appearance retained.';}
  if(prefs.mode==='preview'&&!Object.hasOwn(THEMES,prefs.previewTheme)){prefs={...prefs,mode:'original'};storageNote+=' Saved preview is unavailable; its saved record is unchanged.';}
  const savedPreviewTheme=prefs.previewTheme;
  q('[data-living-mode] option[value="preview"]')?.remove();
  if(prefs.mode==='preview'){const option=document.createElement('option');option.value='preview';option.textContent=`${THEMES[savedPreviewTheme].name} — saved design preview`;q('[data-living-mode]').append(option);}
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
   const manual=policy.previewEnabled===true?(preview||(mode==='preview'?savedPreviewTheme:null)):null,themeId=manual||result.theme,theme=Object.hasOwn(THEMES,themeId)?THEMES[themeId]:null;
   const event=result.kind==='festival'?registry.windows.find(w=>w.id===result.id):null;
   const info=q('[data-living-info]'),sources=q('[data-living-sources]');sources.replaceChildren();
   if(!theme){
    restore();info.hidden=true;
    status.textContent=(result.reason==='visitor-opt-out'?'Original HDC appearance selected.':result.reason==='administrator-disabled'?'Automatic festival themes are disabled by the maintainer.':'No applicable verified festival period. Original HDC appearance retained.')+storageNote;
   }else{
    const stage=manual?q('[data-living-stage]').value:result.stage;
    document.documentElement.dataset.hdcFestival=themeId;document.documentElement.dataset.hdcStage=stage;
    const variant=manual?null:variationFor(themeId,result.variations);
    if(variant)document.documentElement.dataset.hdcVariant=variant;else delete document.documentElement.dataset.hdcVariant;
    const motif=variant==='lotus'?'lotus':theme.motif,ornamentKey=themeId+':'+(variant||'base');
    document.documentElement.dataset.hdcQuality=quality({effects:q('[data-living-effects]').value,reducedMotion:motion.matches||document.documentElement.classList.contains('abp-still'),highContrast:contrast.matches||document.documentElement.classList.contains('abp-hc'),dataSaver:navigator.connection?.saveData===true,cores:navigator.hardwareConcurrency??4,memory:navigator.deviceMemory??4});
    let scenery=document.querySelector('.hdc-living-scenery');
    if(!scenery){scenery=document.createElement('div');scenery.className='hdc-living-scenery';scenery.setAttribute('aria-hidden','true');document.body.append(scenery);}
    if(scenery.dataset.theme!==ornamentKey){scenery.dataset.theme=ornamentKey;scenery.replaceChildren(...Array.from({length:8},()=>ornament(document,motif)));}
    const hero=document.querySelector('.udhc-hero');
    if(hero){
     let ornamentation=hero.querySelector('.hdc-living-hero');
     if(!ornamentation){ornamentation=document.createElement('div');ornamentation.className='hdc-living-hero';ornamentation.setAttribute('aria-hidden','true');hero.append(ornamentation);}
     if(ornamentation.dataset.theme!==ornamentKey){ornamentation.dataset.theme=ornamentKey;ornamentation.replaceChildren(...Array.from({length:4},()=>ornament(document,motif)));}
    }
    info.hidden=false;q('[data-living-title]').textContent=manual?`${theme.name} — design preview`:event.name;
    q('[data-living-note]').textContent=theme.summary+(!manual?` Calendar reference: ${event.tradition}. Published civil dates: ${event.start} through ${event.end}. This is not a ritual timetable.`:'');
    q('[data-living-countdown]').textContent=manual?`Visual stage: ${stage}. No festival date is implied.`:result.stage==='celebration'?`Published reference celebration period; Indian date ${result.day}. ${result.variations.map(v=>v.name).join(' · ')}`:`${result.daysUntil} Indian calendar days until the published reference period. Stage: ${result.stage}.`;
    q('[data-living-selection]').textContent=manual?'':result.reason==='approved-administrator-override'?'A reviewed maintainer presentation override is active.':'An ongoing celebration takes priority over an approaching festival. Your selected region and reviewed priorities resolve remaining overlaps.';
    q('[data-living-explore]').href=new URL(theme.path,base).href;
    if(!manual)for(const source of event.sources){const li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.textContent=source.label;li.append(a);sources.append(li);}
    status.textContent=(manual?(preview?'Manual design preview. It ends on navigation or reload.':'Your saved design preference is retained. No festival date is implied.'):'Automatic reviewed reference-calendar appearance applied; regional traditions may differ.')+storageNote;
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
   visitPrefs={schema:2,mode:q('[data-living-mode]').value,region:q('[data-living-region]').value,effects:q('[data-living-effects]').value,...(savedPreviewTheme?{previewTheme:savedPreviewTheme}:{})};
   try{if(!record)throw Error('No local record');const previous=record.get();const value={...previous,...visitPrefs};storageNote=record.write(value).persisted?'':' Preferences apply only to this visit.';}
   catch(_){storageNote=' Preferences could not be saved; existing data has been kept.';}
   render();
  }
  for(const selector of ['[data-living-mode]','[data-living-region]','[data-living-effects]'])q(selector).addEventListener('change',save,{signal});
  q('[data-living-stage]').addEventListener('change',render,{signal});
  q('[data-living-original]').addEventListener('click',()=>{q('[data-living-mode]').value='original';save();},{signal});
  q('[data-living-share]').addEventListener('click',async()=>{
   const theme=THEMES[preview||document.documentElement.dataset.hdcFestival];if(!theme)return;
   const text=`${preview||q('[data-living-mode]').value==='preview'?'Design preview — ':''}${theme.greeting} | ${document.querySelector('meta[property="og:site_name"]')?.content||document.title}`;
   const message=q('[data-living-share-status]');
   try{if(navigator.share){await navigator.share({title:theme.name,text,url:new URL(theme.path,base).href});message.textContent='';}else if(navigator.clipboard){await navigator.clipboard.writeText(text);message.textContent='Greeting copied.';}else message.textContent=text;}
   catch(error){message.textContent=error.name==='AbortError'?'':'Sharing unavailable; '+text;}
  },{signal});
  motion.addEventListener('change',render,{signal});contrast.addEventListener('change',render,{signal});
  navigator.connection?.addEventListener('change',render,{signal});
  const observer=new MutationObserver(render);observer.observe(document.documentElement,{attributeFilter:['class']});
  const previousRelease=release;release=()=>{observer.disconnect();previousRelease();};
  ready=true;render();timer=setTimeout(init,Math.max(100,scheduler.nextMidnightDelay(Date.now())));
 }
 window.addEventListener('storage',event=>{if(event.key===key||event.key==='hdc-festival-preferences-v1'||event.key===null){record?.changed();init();}});
 window.addEventListener('pagehide',()=>{release();restore();});window.addEventListener('pageshow',init);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')init();});
 if(window.document$?.subscribe)window.document$.subscribe(init);
 else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
