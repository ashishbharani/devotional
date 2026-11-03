/* Preview-only JSON records: preserve unknown data and refuse stale/future overwrites. */
(() => {
 'use strict';
 if(globalThis.hdcLocalState)return;
 const records=new Map(),copy=value=>JSON.parse(JSON.stringify(value));
 const failure=code=>Object.assign(new Error('Local record '+code),{code});
 function create({key,defaults,validate}){
  if(records.has(key))return records.get(key);
  const valid=value=>{if(!value||typeof value!=='object'||Array.isArray(value)||!validate(value))throw failure('unsupported');return value;};
  valid(defaults);
  let memory=copy(defaults),seen,loaded=false,dirty=false,conflicted=false;
  function raw(){try{return globalThis.localStorage.getItem(key);}catch(_){throw failure('unavailable');}}
  function decode(text){
   if(text===null)return copy(defaults);
   let value;try{value=JSON.parse(text);}catch(_){throw failure('unsupported');}
   valid(value);return {...copy(defaults),...value};
  }
  function reload(){const text=raw(),value=decode(text);memory=copy(value);seen=text;loaded=true;dirty=false;conflicted=false;return copy(memory);}
  function get(){
   if(dirty){
    if(conflicted)throw failure('conflict');
    // Comparing raw snapshots also covers changes made without a storage event.
    let text;try{text=raw();}catch(_){return copy(memory);}
    if(text!==seen){conflicted=true;throw failure('conflict');}
    return copy(memory);
   }
   return reload();
  }
  function write(value){
   valid(value);const next=copy(value);
   if(!loaded)get();
   if(conflicted)throw failure('conflict');
   let text;
   try{text=raw();}catch(_){memory=next;dirty=true;return {persisted:false,reason:'unavailable',value:copy(memory)};}
   if(text!==seen){conflicted=true;throw failure('conflict');}
   memory=next;
   try{const serialized=JSON.stringify(memory);globalThis.localStorage.setItem(key,serialized);seen=serialized;dirty=false;return {persisted:true,value:copy(memory)};}
   catch(_){dirty=true;return {persisted:false,reason:'blocked',value:copy(memory)};}
  }
  const record=Object.freeze({get,reload,write,check:decode,snapshot:()=>copy(memory),changed:()=>{if(dirty)conflicted=true;},get dirty(){return dirty;},get conflicted(){return conflicted;}});
  records.set(key,record);return record;
 }
 globalThis.addEventListener?.('storage',event=>{
  if(event.key===null)for(const record of records.values())record.changed();
  else records.get(event.key)?.changed();
 });
 globalThis.hdcLocalState=Object.freeze({create});
})();
