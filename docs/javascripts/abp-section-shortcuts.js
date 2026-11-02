/* Optional browser-local section navigation. Work favourites remain authoritative. */
(() => {
 'use strict';
 const key='hdc-section-shortcuts-v1',base=new URL('../',document.currentScript.src);let cleanup=()=>{},registry;
 const safePath=path=>typeof path==='string'&&/^categories\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)*$/.test(path);
 async function sections(){
  if(!registry)registry=fetch(new URL('assets/section-shortcuts.json',base)).then(async response=>{
   if(!response.ok)throw new Error('Unavailable section registry');const data=await response.json();
   if(data?.schema!==1||!Array.isArray(data.sections)||data.sections.some(s=>!safePath(s?.path)||typeof s.title!=='string'||!s.title.trim())||new Set(data.sections.map(s=>s.path)).size!==data.sections.length)throw new Error('Invalid section registry');
   return new Map(data.sections.map(s=>[s.path,s.title]));
  }).catch(error=>{registry=undefined;throw error;});
  return registry;
 }
 function read(){
  const raw=localStorage.getItem(key);if(raw===null)return {schema:1,paths:[]};const value=JSON.parse(raw);
  if(value?.schema!==1||!Array.isArray(value.paths)||value.paths.length>10||value.paths.some(p=>!safePath(p))||new Set(value.paths).size!==value.paths.length)throw new Error('Unsupported shortcuts');
  return value;
 }
 function init(){
  cleanup();const root=document.querySelector('[data-section-shortcut-control],[data-section-shortcut-list]');if(!root)return;
  const controller=new AbortController();cleanup=()=>controller.abort();const status=root.querySelector('[data-shortcut-status]'),list=root.querySelector('[data-shortcut-items]');
  let memory,visitOnly=false,externalChanged=false,generation=0;
  const current=()=>root.isConnected&&!controller.signal.aborted;
  const latest=()=>visitOnly?memory:read();
  async function checked(){const value=latest(),map=await sections();if(value.paths.some(p=>!map.has(p)))throw new Error('Unknown saved section');return {value,map};}
  function save(value){
   memory=value;try{localStorage.setItem(key,JSON.stringify(value));visitOnly=false;status.textContent='Section shortcuts saved in this browser only.';}
   catch(_){visitOnly=true;status.textContent='Shortcut storage unavailable. These changes remain for this visit only; the saved copy is unchanged.';}
  }
  async function render(){
   if(!list)return;const run=++generation;list.replaceChildren();
   try{
    const value=latest();if(!value.paths.length){status.textContent=visitOnly?'No section shortcuts for this visit; the saved copy could not be changed.':'No saved section shortcuts. Use a category or section page to choose one.';return;}
    const {map}=await checked();if(!current()||run!==generation)return;
    for(const path of value.paths){const li=document.createElement('li'),a=document.createElement('a'),remove=document.createElement('button');a.href=new URL(path,base).href;a.textContent=map.get(path);a.className='notranslate';a.setAttribute('translate','no');remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label',`Remove section shortcut: ${map.get(path)}`);remove.dataset.removeShortcut=path;li.append(a,' ',remove);list.append(li);}
   }catch(_){if(current()&&run===generation)status.textContent='Saved shortcuts or verified section metadata are unavailable. Existing saved data has been kept.';}
  }
  async function change(edit){
   try{const map=await sections();if(!current())return;if(visitOnly&&externalChanged){status.textContent='Another tab changed saved shortcuts. Your visit-only edits have been kept; reload before making further changes.';return;}const value=latest();if(value.paths.some(p=>!map.has(p)))throw new Error('Unknown saved section');if(visitOnly&&read().paths.some(p=>!map.has(p)))throw new Error('Unknown saved section');const next=edit(value,map);if(!next)return;save(next);await render();}
   catch(_){if(current())status.textContent='Shortcuts could not be read or verified. Existing saved data has been kept.';}
  }
  root.querySelector('[data-shortcut-save]')?.addEventListener('click',()=>change((value,map)=>{
   const path=root.dataset.sectionPath;if(!map.has(path)){status.textContent='This page is not a registered catalogue section; no shortcut was saved.';return;}
   if(value.paths.includes(path)){status.textContent='This section is already saved.';return;}
   if(value.paths.length>=10){status.textContent='Ten section shortcuts are already saved. Remove one in your journey before adding another.';return;}
   return {...value,paths:[...value.paths,path]};
  }),{signal:controller.signal});
  if(list){
   list.addEventListener('click',event=>{const button=event.target.closest('[data-remove-shortcut]');if(button)change(value=>({...value,paths:value.paths.filter(p=>p!==button.dataset.removeShortcut)}));},{signal:controller.signal});
   const consent=root.querySelector('[data-shortcut-erase-consent]'),erase=root.querySelector('[data-shortcut-erase]');
   consent.addEventListener('change',()=>{erase.disabled=!consent.checked;},{signal:controller.signal});
   erase.addEventListener('click',()=>{if(consent.checked)change(value=>{consent.checked=false;erase.disabled=true;return {...value,paths:[]};});},{signal:controller.signal});
   render();
  }
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null){if(visitOnly){externalChanged=true;status.textContent='Another tab changed saved shortcuts. Your visit-only edits have been kept; reload to load the saved copy.';}else if(list)render();else status.textContent='Section shortcuts changed in another tab.';}},{signal:controller.signal});
 }
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 if(window.document$?.subscribe)window.document$.subscribe(init);else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
