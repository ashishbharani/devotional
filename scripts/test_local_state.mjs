import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../docs/javascripts/abp-local-state.js',import.meta.url),'utf8');
const plain=value=>JSON.parse(JSON.stringify(value));
const defaults={schema:1,rows:[],enabled:false};
const validate=value=>value.schema===1&&Array.isArray(value.rows)&&typeof value.enabled==='boolean';
function fixture(initial=null){
 const data=new Map(initial===null?[]:[['test',initial]]);
 const access={read:true,write:true,writes:0};
 const context=vm.createContext({localStorage:{
  getItem(key){if(!access.read)throw new Error('blocked read');return data.get(key)??null;},
  setItem(key,value){if(!access.write)throw new Error('blocked write');access.writes++;data.set(key,value);}
 }});
 vm.runInContext(source,context);
 const create=()=>context.hdcLocalState.create({key:'test',defaults,validate});
 return {data,access,context,create,record:create()};
}
const unsupported=fn=>assert.throws(fn,error=>error.code==='unsupported');
const conflict=fn=>assert.throws(fn,error=>error.code==='conflict');
let cases=0;
function test(name,fn){fn();cases++;console.log(`PASS ${name}`);}

test('default and legacy records retain unknown nested fields and return defensive copies',()=>{
 const f=fixture();assert.deepEqual(plain(f.record.get()),defaults);
 const raw={schema:1,rows:[{id:'a',extra:{language:'hi'}}],enabled:true,unknown:{keep:['value']}};
 f.data.set('test',JSON.stringify(raw));const value=f.record.get();assert.deepEqual(plain(value),raw);
 value.unknown.keep.push('external mutation');assert.deepEqual(plain(f.record.snapshot()),raw);
 const result=f.record.write({...f.record.get(),enabled:false});assert.equal(result.persisted,true);
 assert.deepEqual(JSON.parse(f.data.get('test')),{...raw,enabled:false});
});

test('missing optional legacy fields merge defaults without discarding unknown data',()=>{
 // Legacy acceptance belongs to each consumer validator, not a permissive shared parser.
 const f=fixture(JSON.stringify({extra:{retained:true}}));
 const record=f.context.hdcLocalState.create({key:'legacy',defaults:{enabled:false},validate:v=>!Object.hasOwn(v,'schema')&&(!Object.hasOwn(v,'enabled')||typeof v.enabled==='boolean')});
 f.data.set('legacy',JSON.stringify({extra:{retained:true}}));
 assert.deepEqual(plain(record.get()),{enabled:false,extra:{retained:true}});
});

test('malformed, non-object, invalid and future records cannot be overwritten',()=>{
 for(const raw of ['{broken','null','[]','4',JSON.stringify({...defaults,schema:2}),JSON.stringify({...defaults,rows:'bad'})]){
  const f=fixture(raw);unsupported(()=>f.record.get());unsupported(()=>f.record.write(defaults));
  assert.equal(f.data.get('test'),raw);assert.equal(f.access.writes,0);
 }
});

test('initial read failure is fail-closed and never creates a persistent replacement',()=>{
 const f=fixture(JSON.stringify(defaults));f.access.read=false;
 assert.throws(()=>f.record.get(),e=>e.code==='unavailable');
 assert.throws(()=>f.record.write({...defaults,enabled:true}),e=>e.code==='unavailable');
 assert.equal(f.access.writes,0);assert.deepEqual(plain(f.record.snapshot()),defaults);
});

test('blocked writes survive same-document reinitialization and preserve saved data',()=>{
 const f=fixture(JSON.stringify(defaults));f.record.get();f.access.write=false;
 const value={...defaults,rows:[{id:'visit',extra:'keep'}]};
 const result=f.record.write(value);assert.equal(result.persisted,false);assert.equal(result.reason,'blocked');
 assert.equal(f.record.dirty,true);assert.strictEqual(f.create(),f.record);
 vm.runInContext(source,f.context);assert.strictEqual(f.create(),f.record);
 assert.deepEqual(plain(f.record.get()),value);assert.deepEqual(JSON.parse(f.data.get('test')),defaults);
 f.access.write=true;assert.equal(f.record.write({...f.record.get(),enabled:true}).persisted,true);
 assert.equal(f.record.dirty,false);assert.deepEqual(JSON.parse(f.data.get('test')),{...value,enabled:true});
});

test('read failure after a valid baseline keeps visit-only edits until unchanged recovery',()=>{
 const f=fixture(JSON.stringify(defaults));f.record.get();f.access.read=false;
 const next={...defaults,enabled:true};const result=f.record.write(next);
 assert.equal(result.persisted,false);assert.equal(result.reason,'unavailable');assert.equal(f.access.writes,0);
 assert.deepEqual(plain(f.record.get()),next);f.access.read=true;
 assert.deepEqual(plain(f.record.get()),next);assert.equal(f.record.write(next).persisted,true);
});

test('changed raw data blocks stale writes even without a storage event',()=>{
 for(const dirty of [false,true]){
  const f=fixture(JSON.stringify(defaults));f.record.get();
  if(dirty){f.access.write=false;f.record.write({...defaults,enabled:true});f.access.write=true;}
  const external=JSON.stringify({...defaults,schema:2,external:'keep'});f.data.set('test',external);
  conflict(()=>f.record.write({...defaults,rows:[{id:'stale'}]}));assert.equal(f.data.get('test'),external);
  if(dirty)conflict(()=>f.record.get());
 }
});

test('storage notification freezes dirty edits while clean records can read new data',()=>{
 const f=fixture(JSON.stringify(defaults));f.record.get();f.record.changed();assert.equal(f.record.conflicted,false);
 const external={...defaults,enabled:true};f.data.set('test',JSON.stringify(external));assert.deepEqual(plain(f.record.get()),external);
 f.access.write=false;f.record.write({...external,rows:[{id:'local'}]});f.record.changed();f.access.write=true;
 assert.equal(f.record.conflicted,true);conflict(()=>f.record.get());conflict(()=>f.record.write(defaults));
 assert.deepEqual(JSON.parse(f.data.get('test')),external);
});

test('invalid explicit reload retains visit-only snapshot; valid explicit reload resolves conflict',()=>{
 const f=fixture(JSON.stringify(defaults));f.record.get();f.access.write=false;
 const local={...defaults,rows:[{id:'draft'}]};f.record.write(local);f.record.changed();f.access.write=true;
 const future=JSON.stringify({...defaults,schema:2});f.data.set('test',future);unsupported(()=>f.record.reload());
 assert.deepEqual(plain(f.record.snapshot()),local);assert.equal(f.record.dirty,true);assert.equal(f.record.conflicted,true);assert.equal(f.data.get('test'),future);
 const external={...defaults,rows:[{id:'new-valid',metadata:{keep:true}}]};f.data.set('test',JSON.stringify(external));
 assert.deepEqual(plain(f.record.reload()),external);assert.equal(f.record.dirty,false);assert.equal(f.record.conflicted,false);
 assert.equal(f.record.write({...f.record.get(),enabled:true}).persisted,true);
 assert.deepEqual(JSON.parse(f.data.get('test')),{...external,enabled:true});
});

test('invalid outgoing records cannot mutate valid memory or persistent data',()=>{
 const f=fixture(JSON.stringify(defaults));f.record.get();
 unsupported(()=>f.record.write({...defaults,schema:2}));assert.deepEqual(plain(f.record.snapshot()),defaults);assert.equal(f.access.writes,0);
});
test('explicit validated snapshot loading needs no second storage read',()=>{
 const f=fixture(JSON.stringify(defaults));f.record.get();f.access.write=false;
 f.record.write({...defaults,rows:[{id:'visit-only'}]});
 const raw=JSON.stringify({...defaults,rows:[{id:'explicit-saved-copy',metadata:'keep'}]});
 f.data.set('test',raw);f.record.check(raw);f.access.read=false;
 assert.deepEqual(plain(f.record.reload(raw)),JSON.parse(raw));
 assert.equal(f.record.dirty,false);assert.equal(f.data.get('test'),raw);
});
console.log(`Local-state regression checks passed: ${cases}/${cases}.`);
