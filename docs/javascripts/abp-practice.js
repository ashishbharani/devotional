/* Optional local-first practice tools. No canonical data, astronomy or provider changes. */
(() => {
  'use strict';
  let cleanup = () => {};
  const load = key => { try { return JSON.parse(localStorage.getItem(key) || '{}') || {}; } catch (_) { return {}; } };
  function save(key, state, status) {
    try { localStorage.setItem(key, JSON.stringify(state)); return true; }
    catch (_) { status.textContent = 'Storage is unavailable. Changes work for this visit only.'; return false; }
  }
  function init() {
    cleanup();
    const root = document.querySelector('[data-sanctuary], [data-reader]');
    if (!root) { cleanup = () => {}; return; }
    const controller = new AbortController(), q = selector => root.querySelector(selector);
    const on = (selector, event, listener) => q(selector)?.addEventListener(event, listener, {signal:controller.signal});
    let stop = () => {};
    cleanup = () => {controller.abort(); stop();};
    if (root.matches('[data-sanctuary]')) {
      const key = 'hdc-sanctuary-v1', previous = load(key), status = q('[data-practice-status]');
      let flowers = 0, timer, end = 0, audio;
      q('[data-effects]').checked = previous.effects === true;
      q('[data-sound]').checked = false; // never restore permission to make sound
      const requestedMinutes=Number(new URLSearchParams(location.search).get('minutes'));
      if([5,10,20].includes(requestedMinutes))q('[data-duration]').value=requestedMinutes;
      q('[data-diya]').classList.toggle('has-effects', q('[data-effects]').checked);
      const silence = () => { if (audio) { audio.close().catch(()=>{}); audio = null; } };
      const finish = message => {clearInterval(timer); timer = undefined; q('[data-start]').disabled=false; q('[data-stop]').disabled=true; q('[data-session]').textContent=message; status.textContent=message;};
      stop = () => {clearInterval(timer); silence();};
      finish('No session running.');
      q('[data-flowers]').textContent='No digital flowers offered this session.';
      on('[data-light]', 'click', () => {
        const lit = q('[data-diya]').classList.toggle('is-lit');
        q('[data-diya]').setAttribute('aria-label', `Digital diya is ${lit?'lit':'unlit'}`);
        q('[data-light]').setAttribute('aria-pressed',String(lit));
        q('[data-light]').textContent=lit?'Extinguish digital diya':'Light digital diya';
      });
      on('[data-flower]', 'click', () => {flowers++; q('[data-flowers]').textContent=`${flowers} digital flower${flowers===1?'':'s'} offered this session.`;});
      on('[data-effects]', 'change', () => {
        const effects = q('[data-effects]').checked;
        q('[data-diya]').classList.toggle('has-effects',effects);
        save(key,{effects},status);
      });
      on('[data-sound]', 'change', () => {if(!q('[data-sound]').checked)silence();});
      on('[data-bell]', 'click', () => {
        status.textContent = 'Digital bell selected. Sound is off.';
        if (!q('[data-sound]').checked) return;
        try {
          const Audio = window.AudioContext || window.webkitAudioContext;
          if (!Audio) throw new Error('unsupported');
          audio ||= new Audio();
          audio.resume().catch(()=>{});
          const oscillator=audio.createOscillator(),gain=audio.createGain();
          oscillator.frequency.value=660; gain.gain.setValueAtTime(.06,audio.currentTime);
          gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+1);
          oscillator.connect(gain).connect(audio.destination);oscillator.start();oscillator.stop(audio.currentTime+1);
          status.textContent='Optional synthesized bell played; not a temple recording.';
        } catch (_) { status.textContent='Audio is unavailable. The digital bell works silently.'; }
      });
      on('[data-quiet]', 'click', () => {
        silence();q('[data-sound]').checked=false;q('[data-effects]').checked=false;
        q('[data-diya]').classList.remove('has-effects');
        status.textContent='Quiet mode: sound and motion effects off.';save(key,{effects:false},status);
      });
      on('[data-start]', 'click', () => {
        if(timer)return;
        const minutes=Number(q('[data-duration]').value);
        if(![5,10,20].includes(minutes))return;
        end=Date.now()+minutes*60000;q('[data-start]').disabled=true;q('[data-stop]').disabled=false;
        status.textContent='Quiet session started.';
        const tick=()=>{
          if(!root.isConnected){stop();return;}
          const seconds=Math.max(0,Math.ceil((end-Date.now())/1000));
          if(!seconds){finish('Quiet session finished. Continue or leave whenever you wish.');return;}
          q('[data-session]').textContent=`Quiet session: ${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} remaining.`;
        };
        tick();timer=setInterval(tick,1000);
      });
      on('[data-stop]', 'click', () => finish('Session ended.'));
    } else {
      const key='hdc-reader-v1', previous=load(key), status=q('[data-reader-status]'), passage=q('[data-reader-passage]');
      if(!passage){status.textContent='Pilot text unavailable. Use the Books Library links.';return;}
      const state={bookmark:previous.bookmark===true,read:previous.read===true,
        size:[1,1.25,1.5].includes(previous.size)?previous.size:1,
        spacing:[1.8,2.2].includes(previous.spacing)?previous.spacing:1.8};
      const render=()=>{
        q('[data-bookmark]').setAttribute('aria-pressed',String(state.bookmark));
        q('[data-bookmark]').textContent=state.bookmark?'Remove bookmark':'Bookmark passage';
        q('[data-read]').setAttribute('aria-pressed',String(state.read));
        q('[data-read]').textContent=state.read?'Mark passage unread':'Mark passage read';
        q('[data-reader-progress]').textContent=`${state.read?1:0} of 1 passages marked read.${state.bookmark?' Passage bookmarked.':''}`;
        q('[data-reader-continue]').hidden=!state.bookmark&&!state.read;
        q('[data-reader-size]').value=state.size;q('[data-reader-spacing]').value=state.spacing;
        root.style.setProperty('--reader-size',state.size);root.style.setProperty('--reader-spacing',state.spacing);
      };
      const persist=()=>{render();save(key,state,status);};
      window.addEventListener('storage',event=>{
        if((event.key!==key&&event.key!==null)||!root.isConnected)return;
        const value=load(key);
        Object.assign(state,{bookmark:value.bookmark===true,read:value.read===true,size:[1,1.25,1.5].includes(value.size)?value.size:1,spacing:[1.8,2.2].includes(value.spacing)?value.spacing:1.8});
        render();status.textContent='Reader progress and preferences updated from another tab.';
      },{signal:controller.signal});
      on('[data-bookmark]','click',()=>{state.bookmark=!state.bookmark;persist();});
      on('[data-read]','click',()=>{state.read=!state.read;persist();});
      on('[data-reader-size]','change',()=>{const n=Number(q('[data-reader-size]').value);if([1,1.25,1.5].includes(n)){state.size=n;persist();}});
      on('[data-reader-spacing]','change',()=>{const n=Number(q('[data-reader-spacing]').value);if([1.8,2.2].includes(n)){state.spacing=n;persist();}});
      const filterPassage=()=>{
        const query=q('[data-reader-query]').value.normalize('NFC').trim().toLocaleLowerCase();
        passage.hidden=!passage.textContent.normalize('NFC').toLocaleLowerCase().includes(query);
        q('[data-reader-empty]').hidden=!passage.hidden;
      };
      const revealPassage=()=>{q('[data-reader-query]').value='';passage.hidden=false;q('[data-reader-empty]').hidden=true;passage.focus({preventScroll:true});passage.scrollIntoView({block:'center',behavior:'auto'});};
      on('[data-reader-query]','input',filterPassage);
      root.addEventListener('click',event=>{
        const link=event.target.closest('a[href]');if(!link)return;const target=new URL(link.href,location.href);
        if(target.origin===location.origin&&target.pathname===location.pathname&&target.hash===`#${passage.id}`)revealPassage();
      },{signal:controller.signal});
      window.addEventListener('hashchange',()=>{if(location.hash===`#${passage.id}`)revealPassage();},{signal:controller.signal});
      on('[data-reader-clear]','click',()=>{state.bookmark=false;state.read=false;persist();});
      on('[data-reader-print]','click',()=>window.print());
      on('[data-reader-share]','click',async()=>{
        const url=new URL(location.pathname,location.origin);url.hash=passage.id;
        try {
          if(navigator.share)await navigator.share({title:'Bhagavad Gita 2.47 — HDC',url:url.href});
          else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url.href);status.textContent='Passage link copied.';}
          else throw new Error('manual');
        }catch(error){
          if(!root.isConnected || error.name==='AbortError')return;
          const label=q('[data-reader-link]');label.hidden=false;label.querySelector('input').value=url.href;label.querySelector('input').focus();
          status.textContent='Copy the passage link manually below.';
        }
      });
      render();
      q('[data-reader-query]').value=new URLSearchParams(location.search).get('readerQuery')||'';filterPassage();
      if(location.hash===`#${passage.id}`)revealPassage();
    }
  }
  window.addEventListener('pagehide',()=>cleanup());
  window.addEventListener('pageshow',init);
  if(window.document$?.subscribe)window.document$.subscribe(init);
  else if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
