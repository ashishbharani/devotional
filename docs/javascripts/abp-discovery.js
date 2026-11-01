/* Metadata selectors only. Submission uses the original finder and ranking engine. */
(() => {
 'use strict';let cleanup=()=>{};
 function init(){
  cleanup();const root=document.querySelector('[data-discovery]');if(!root)return;
  const controller=new AbortController();cleanup=()=>controller.abort();
  const status=root.querySelector('[data-discovery-status]'),retry=root.querySelector('[data-discovery-retry]');
  const form=root.querySelector('form'),path=location.pathname,names=['w','category','language','form'];let ready=false,run=0;
  const current=()=>root.isConnected&&!controller.signal.aborted&&location.pathname===path;
  function sync(){
   if(!current())return;const url=new URL(location.href);
   for(const name of names){if(!ready&&name!=='w')continue;const value=form.elements.namedItem(name).value;if(value)url.searchParams.set(name,value);else url.searchParams.delete(name);}
   history.replaceState(history.state,'',url);
  }
  function restore(){
   if(!current())return;const params=new URLSearchParams(location.search);form.elements.namedItem('w').value=params.get('w')||'';
   if(!ready)return;let ignored=false;
   for(const name of names.slice(1)){const select=form.elements.namedItem(name),value=params.get(name)||'';select.value=[...select.options].some(o=>o.value===value)?value:'';if(value&&select.value!==value)ignored=true;}
   if(ignored)status.textContent='Unsupported filter values were ignored. Existing catalogue filters remain available.';
   sync();
  }
  form.addEventListener('input',sync,{signal:controller.signal});form.addEventListener('change',sync,{signal:controller.signal});
  form.addEventListener('submit',sync,{signal:controller.signal});window.addEventListener('popstate',restore,{signal:controller.signal});
  restore();
  async function load(){
   const generation=++run;
   retry.hidden=true;status.textContent='Loading existing catalogue filters…';
   try{
    const service=await window.abpSearch.load();if(!current()||generation!==run)return;
    const data=service.compact,categories=new Map(data.places.map(p=>[p[1],p[3]]));
    for(const [name,values] of [['category',[...categories].sort((a,b)=>a[0]-b[0])],['language',data.langs.map(v=>[v,v])],['form',data.forms.map(v=>[v,v])]]){
     const select=root.querySelector(`[name="${name}"]`);while(select.options.length>1)select.remove(1);
     for(const [value,label] of values){const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option);}
    }
    status.textContent=`${categories.size} existing categories loaded. Filters submit to the canonical search; no identities are merged.`;
    ready=true;restore();
   }catch(_){if(current()&&generation===run){status.textContent='Filters unavailable. Advanced search and category links remain available.';retry.hidden=false;}}
  }
  retry.addEventListener('click',load,{signal:controller.signal});load();
 }
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 if(window.document$?.subscribe)window.document$.subscribe(init);else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
