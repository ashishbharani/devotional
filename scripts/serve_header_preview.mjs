import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {gzip} from 'node:zlib';
import {promisify} from 'node:util';
const root=path.resolve(process.env.HDC_SITE_DIR||'site'),port=Number(process.env.HDC_PREVIEW_PORT||4310);
// Opt-in authoring preview for sequential translation batches. CI/default uses
// only the strictly built assets; this mode never changes the published site.
const sourceTranslations=process.env.HDC_TRANSLATION_SOURCE==='1';
// Opt-in lab transport matching public Pages gzip; default test serving is unchanged.
const compressed=process.env.HDC_PREVIEW_GZIP==='1',zip=promisify(gzip),encoded=new Map();
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.xml':'application/xml','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.wasm':'application/wasm','.webmanifest':'application/manifest+json'};
createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/')return res.writeHead(302,{Location:'/devotional/'}).end();
  if(!url.pathname.startsWith('/devotional/'))return res.writeHead(404).end();
  const relative=decodeURIComponent(url.pathname.slice(12));
  const sourceAsset=sourceTranslations&&(relative==='assets/i18n.json'||relative==='javascripts/abp-i18n.js'||/^assets\/translations\/(hi|mr|gu|bn|pa|te|kn|ml|ta)\.json$/.test(relative));
  const selectedRoot=sourceAsset?path.resolve('docs'):root;
  let file=path.resolve(selectedRoot,relative);
  if(file!==selectedRoot&&!file.startsWith(selectedRoot+path.sep))return res.writeHead(403).end();
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  const type=mime[path.extname(file)]||'application/octet-stream',headers={'Content-Type':type,'Cache-Control':'no-store'};
  let body;
  if(compressed&&/\bgzip\b/.test(req.headers['accept-encoding']||'')&&/^(text\/|application\/(javascript|json|xml|manifest\+json))/.test(type)){
    if(!encoded.has(file))encoded.set(file,readFile(file).then(bytes=>zip(bytes)));
    body=await encoded.get(file);headers['Content-Encoding']='gzip';headers.Vary='Accept-Encoding';
  }else body=await readFile(file);
  res.writeHead(200,headers).end(body);
}catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`HDC STAGING ONLY: http://127.0.0.1:${port}/devotional/`));
