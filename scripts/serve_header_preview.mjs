import {createServer} from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(process.env.HDC_SITE_DIR||'site'),port=Number(process.env.HDC_PREVIEW_PORT||4310);
const mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.xml':'application/xml','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.wasm':'application/wasm','.webmanifest':'application/manifest+json'};
createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost');
  if(url.pathname==='/')return res.writeHead(302,{Location:'/devotional/'}).end();
  if(!url.pathname.startsWith('/devotional/'))return res.writeHead(404).end();
  let file=path.resolve(root,decodeURIComponent(url.pathname.slice(12)));
  if(file!==root&&!file.startsWith(root+path.sep))return res.writeHead(403).end();
  if((await stat(file)).isDirectory())file=path.join(file,'index.html');
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(await readFile(file));
}catch{res.writeHead(404).end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`HDC STAGING ONLY: http://127.0.0.1:${port}/devotional/`));
