(() => {
 'use strict';let cleanup=()=>{};
 function init(){
  cleanup();const root=document.querySelector('[data-share-page]');if(!root)return;
  const controller=new AbortController();cleanup=()=>controller.abort();
  root.querySelector('[data-page-share]').addEventListener('click',async()=>{
   const status=root.querySelector('[data-page-share-status]'),url=location.href;
   try{
    if(navigator.share)await navigator.share({title:document.title,url});
    else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);if(root.isConnected)status.textContent='Page link copied.';}
    else throw new Error('manual');
   }catch(error){if(!root.isConnected||error.name==='AbortError')return;const label=root.querySelector('[data-page-share-link]');label.hidden=false;label.querySelector('input').value=url;label.querySelector('input').focus();status.textContent='Copy the link manually below.';}
  },{signal:controller.signal});
 }
 window.addEventListener('pagehide',()=>cleanup());window.addEventListener('pageshow',init);
 if(window.document$?.subscribe)window.document$.subscribe(init);else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
