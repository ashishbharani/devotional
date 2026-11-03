// Lab-only gzip must preserve the exact built payload and default raw response.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {get} from 'node:http';
import {gunzipSync} from 'node:zlib';
import {readFile} from 'node:fs/promises';
const server=spawn(process.execPath,['scripts/serve_header_preview.mjs'],{env:{...process.env,HDC_PREVIEW_PORT:'4362',HDC_PREVIEW_GZIP:'1'},stdio:['ignore','pipe','inherit']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
function request(headers={}){return new Promise((resolve,reject)=>{get('http://127.0.0.1:4362/devotional/stylesheets/abp.css',{headers},res=>{const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));}).on('error',reject);});}
try{
 const expected=await readFile((process.env.HDC_SITE_DIR||'site')+'/stylesheets/abp.css');
 const raw=await request(),zipped=await request({'Accept-Encoding':'gzip'});
 assert.equal(raw.status,200);assert.equal(zipped.status,200);
 assert.equal(raw.headers['content-encoding'],undefined);assert.deepEqual(raw.body,expected);
 assert.equal(zipped.headers['content-encoding'],'gzip');assert.equal(zipped.headers.vary,'Accept-Encoding');
 assert.deepEqual(gunzipSync(zipped.body),expected);assert.ok(zipped.body.length<raw.body.length);
 assert.deepEqual((await request({'Accept-Encoding':'gzip'})).body,zipped.body);
 console.log('PASS opt-in preview gzip: exact bytes after decompression, cached encoding and unchanged raw response');
}finally{server.kill();}
