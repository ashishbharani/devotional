/* Metadata selectors only. Submission uses the original finder and ranking engine. */
(() => {
 'use strict';let cleanup=()=>{};
 function init(){
  cleanup();const root=document.querySelector('[data-discovery]');if(!root)return;
  const controller=new AbortController();cleanup=()=>controller.abort();
  const status=root.querySelector('[data-discovery-status]'),retry=root.querySelector('[data-discovery-retry]');
  async function load(){
   retry.hidden=true;status.textContent='Loading existing catalogue filters…';
   try{
    const service=await window.abpSearch.load();if(controller.signal.aborted||!root.isConnected)return;
    const data=service.compact,categories=new Map(data.places.map(p=>[p[1],p[3]]));
    for(const [name,values] of [['category',[...categories].sort((a,b)=>a[0]-b[0])],['language',data.langs.map(v=>[v,v])],['form',data.forms.map(v=>[v,v])]]){
     const select=root.querySelector(`[name="${name}"]`);while(select.options.length>1)select.remove(1);
     for(const [value,label] of values){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
    }
    status.textContent=`${categories.size} existing categories loaded. Filters submit to the canonical search; no identities are merged.`;
   }catch(_){if(!controller.signal.aborted){status.textContent='Filters unavailable. Advanced search and category links remain available.';retry.hidden=false;}}
  }
  retry.addEventListener('click',load,{signal:controller.signal});load();
 }
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 if(window.document$?.subscribe)window.document$.subscribe(init);else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
