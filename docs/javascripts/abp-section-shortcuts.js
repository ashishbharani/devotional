/* Optional browser-local section navigation. Work favourites remain authoritative. */
(() => {
 'use strict';
 const key='hdc-section-shortcuts-v1',base=new URL('../',document.currentScript.src);let cleanup=()=>{},registry,activeRoot=null;
 const safePath=path=>typeof path==='string'&&/^categories\/[a-z0-9-]+\/(?:[a-z0-9-]+\/)*$/.test(path);
 async function sections(){
  if(!registry)registry=fetch(new URL('assets/section-shortcuts.json',base)).then(async response=>{
   if(!response.ok)throw new Error('Unavailable section registry');const data=await response.json();
   if(data?.schema!==1||!Array.isArray(data.sections)||data.sections.some(s=>!safePath(s?.path)||typeof s.title!=='string'||!s.title.trim())||new Set(data.sections.map(s=>s.path)).size!==data.sections.length)throw new Error('Invalid section registry');
   return new Map(data.sections.map(s=>[s.path,s.title]));
  }).catch(error=>{registry=undefined;throw error;});
  return registry;
 }
 const record=globalThis.hdcLocalState?.create({key,defaults:{schema:1,paths:[]},validate:value=>value.schema===1&&Array.isArray(value.paths)&&value.paths.length<=10&&!value.paths.some(p=>!safePath(p))&&new Set(value.paths).size===value.paths.length});
 const read=()=>{if(!record)throw new Error('Unavailable local record');return record.get();};
 function init(){
  const root=document.querySelector('[data-section-shortcut-control],[data-section-shortcut-list]');
  // Material and pageshow can report the same connected page twice. Keep its
  // listener and pending user action alive; a new root still gets fresh state.
  if(root&&root===activeRoot)return;
  cleanup();if(!root)return;activeRoot=root;
  const controller=new AbortController();cleanup=()=>{controller.abort();if(activeRoot===root)activeRoot=null;};const status=root.querySelector('[data-shortcut-status]'),list=root.querySelector('[data-shortcut-items]');
  let generation=0;
  const current=()=>root.isConnected&&!controller.signal.aborted;
  const latest=read;
  async function checked(){const map=await sections(),value=latest();if(value.paths.some(p=>!map.has(p)))throw new Error('Unknown saved section');return {value,map};}
  function save(value){
   if(!record)throw new Error('Unavailable local record');
   const result=record.write(value);
   status.textContent=result.persisted?'Section shortcuts saved in this browser only.':'Shortcut storage unavailable. These changes remain for this visit only; the saved copy is unchanged.';
  }
  async function render(){
   if(!list)return;const run=++generation;
   try{
    const {value,map}=await checked();if(!current()||run!==generation)return;list.replaceChildren();if(!value.paths.length){status.textContent=record?.dirty?'No section shortcuts for this visit; the saved copy could not be changed.':'No saved section shortcuts. Use a category or section page to choose one.';return;}
    for(const path of value.paths){const li=document.createElement('li'),a=document.createElement('a'),remove=document.createElement('button');a.href=new URL(path,base).href;a.textContent=map.get(path);a.className='notranslate';a.setAttribute('translate','no');remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label',`Remove section shortcut: ${map.get(path)}`);remove.dataset.removeShortcut=path;li.append(a,' ',remove);list.append(li);}
   }catch(_){if(current()&&run===generation)status.textContent='Saved shortcuts or verified section metadata are unavailable. Existing saved data has been kept.';}
  }
  async function change(edit){
   try{const map=await sections();if(!current())return;const value=latest();if(value.paths.some(p=>!map.has(p)))throw new Error('Unknown saved section');const next=edit(value,map);if(!next)return;save(next);await render();}
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
  window.addEventListener('storage',event=>{if(event.key===key||event.key===null){record?.changed();if(record?.dirty){status.textContent='Another tab changed saved shortcuts. Your visit-only edits have been kept; reload to load the saved copy.';}else if(list)render();else status.textContent='Section shortcuts changed in another tab.';}},{signal:controller.signal});
 }
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 if(window.document$?.subscribe)window.document$.subscribe(init);else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
