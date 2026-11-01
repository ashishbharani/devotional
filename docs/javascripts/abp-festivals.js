/* Preview-only presentation; never calculates or changes Panchang observances. */
(() => {
 'use strict';
 const base=new URL('../',document.currentScript.src).href,key='hdc-festival-preferences-v1';
 let cleanup=()=>{},manifest,cachedDay;const cache=new Map();
 const engine=import(new URL('assets/festivals/themes.mjs',base).href);
 async function init(){
  cleanup();const root=document.querySelector('[data-festival-experience]');if(!root)return;
  const controller=new AbortController(),q=s=>root.querySelector(s);let timer,ready=false,schedules=[],failure=false;
  cleanup=()=>{controller.abort();clearTimeout(timer);};
  let prefs={};try{prefs=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch(_){}
  const modes=['auto','original','ganesha','shiva'],regions=['IN','IN-UP','IN-MH','IN-DL'];
  q('[data-festival-mode]').value=modes.includes(prefs.mode)?prefs.mode:'auto';
  q('[data-festival-region]').value=regions.includes(prefs.region)?prefs.region:'IN';
  q('[data-festival-effects]').checked=prefs.effects===true;
  let tools;try{tools=await engine;}catch(_){q('[data-festival-status]').textContent='Festival preview unavailable; original theme retained.';return;}
  if(controller.signal.aborted||!root.isConnected)return;
  const today=tools.indiaDay();
  if(cachedDay!==today){manifest=undefined;cache.clear();cachedDay=today;}
  function render(){
   const mode=q('[data-festival-mode]').value,region=q('[data-festival-region]').value,day=tools.indiaDay();
   const status=q('[data-festival-status]'),display=q('[data-festival-display]'),list=q('[data-festival-overlaps]');
   root.classList.toggle('has-effects',q('[data-festival-effects]').checked);list.replaceChildren();
   let active=[];
   if(mode==='auto'&&ready&&!failure){try{active=tools.eligibleEvents(schedules,day,region);}catch(_){failure=true;}}
   const event=active[0],theme=Object.hasOwn(tools.THEMES,mode)?tools.THEMES[mode]:event?tools.THEMES[event.theme]:null;
   if(mode==='original'||!theme){
    display.hidden=true;root.removeAttribute('data-festival-theme');q('[data-festival-image]').removeAttribute('src');
    status.textContent=mode==='original'?'Original theme selected.':!ready?'Loading reviewed festival availability…':failure?'Reviewed schedule unavailable; original theme retained.':`No applicable reviewed festival window for ${day} and selected region. Original theme retained.`;
    return;
   }
   const manual=mode!=='auto';display.hidden=false;root.dataset.festivalTheme=manual?mode:event.theme;
   const image=q('[data-festival-image]');image.src=new URL(theme.image,base).href;image.alt=`Approved devotional illustration of ${theme.name}`;
   q('[data-festival-title]').textContent=manual?`${theme.name} design preview`:event.name;
   q('[data-festival-note]').textContent=manual?'Design preview only — not a festival date or observance announcement.':`${event.phase==='approaching'?'Preparation window; observance begins':'Observance window'} ${event.start} through ${event.end}. Tradition: ${event.tradition}. Regions: ${event.regions.join(', ')}.`;
   q('[data-festival-link]').href=new URL(theme.path,base).href;
   status.textContent=manual?'Manual design preview; Panchang and the original website layout are unchanged.':'Reviewed presentation schedule applied; regional traditions may differ.';
   for(const other of active.slice(1)){
    const li=document.createElement('li'),a=document.createElement('a');a.textContent=`Also applicable: ${other.name} (${other.tradition})`;a.href=new URL(tools.THEMES[other.theme].path,base).href;li.append(a);list.append(li);
   }
   if(event&&!manual)for(const source of event.sources){const li=document.createElement('li'),a=document.createElement('a');a.textContent=`Date source: ${source.label}`;a.href=source.url;li.append(a);list.append(li);}
  }
  for(const selector of ['[data-festival-mode]','[data-festival-region]','[data-festival-effects]'])q(selector).addEventListener('change',()=>{
   render();try{localStorage.setItem(key,JSON.stringify({mode:q('[data-festival-mode]').value,region:q('[data-festival-region]').value,effects:q('[data-festival-effects]').checked}));}
   catch(_){q('[data-festival-status]').textContent+=' Preferences could not be saved; this visit only.';}
  },{signal:controller.signal});
  render();
  try{
   const read=async path=>{const response=await fetch(new URL(path,base),{signal:controller.signal});if(!response.ok)throw new Error('Unavailable schedule');return response.json();};
   if(!manifest){const value=await read('assets/festivals/index.json');if(value.schema!==1||!Array.isArray(value.years)||value.years.some(y=>!Number.isInteger(y)||y<1900||y>9998))throw new Error('Invalid manifest');manifest=value;}
   const year=Number(tools.indiaDay().slice(0,4));
   for(const y of manifest.years.filter(y=>Math.abs(year-y)<=1)){
    if(!cache.has(y)){const value=tools.validateSchedule(await read(`assets/festivals/${y}.json`));if(value.year!==y)throw new Error('Wrong schedule year');cache.set(y,value);}
    schedules.push(cache.get(y));
   }
  }catch(error){if(controller.signal.aborted)return;failure=true;}
  if(controller.signal.aborted||!root.isConnected)return;
  ready=true;render();timer=setTimeout(init,Math.max(100,tools.nextIndiaMidnight()));
 }
 window.addEventListener('storage',e=>{if(e.key===key||e.key===null)init();});
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')init();});
 if(window.document$?.subscribe)window.document$.subscribe(init);
 else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
