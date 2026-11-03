/* Optional local-first practice tools. No canonical data, astronomy or provider changes. */
(() => {
  'use strict';
  let cleanup = () => {};
  const optional=(value,key,test)=>!Object.hasOwn(value,key)||test(value[key]);
  const sanctuary=globalThis.hdcLocalState?.create({key:'hdc-sanctuary-v1',defaults:{effects:false},validate:value=>!Object.hasOwn(value,'schema')&&optional(value,'effects',v=>typeof v==='boolean')});
  const reader=globalThis.hdcLocalState?.create({key:'hdc-reader-v1',defaults:{bookmark:false,read:false,size:1,spacing:1.8},validate:value=>!Object.hasOwn(value,'schema')&&optional(value,'bookmark',v=>typeof v==='boolean')&&optional(value,'read',v=>typeof v==='boolean')&&optional(value,'size',v=>[1,1.25,1.5].includes(v))&&optional(value,'spacing',v=>[1.8,2.2].includes(v))});
  const unavailable=status=>{status.textContent='Saved preferences are unavailable, changed elsewhere or have an unsupported format. Existing saved data and visit-only changes have been kept; this action was not saved.';};
  function load(record,status){try{if(!record)throw new Error('Unavailable local records');return record.get();}catch(_){unavailable(status);return record?.snapshot()||{};}}
  function save(record,edit,status){
    try{if(!record)throw new Error('Unavailable local records');const result=record.write(edit(record.get()));if(!result.persisted)status.textContent='Storage is unavailable. Changes work for this visit only.';return result.value;}
    catch(_){unavailable(status);return null;}
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
      const key = 'hdc-sanctuary-v1', status = q('[data-practice-status]'), previous = load(sanctuary,status);
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
      if(!sanctuary||sanctuary.conflicted)unavailable(status);
      window.addEventListener('storage',event=>{
        if((event.key!==key&&event.key!==null)||!root.isConnected)return;
        sanctuary?.changed();
        try{if(!sanctuary)throw new Error('Unavailable local records');const value=sanctuary.get();q('[data-effects]').checked=value.effects;q('[data-diya]').classList.toggle('has-effects',value.effects);status.textContent='Sanctuary preferences updated from another tab.';}
        catch(_){unavailable(status);}
      },{signal:controller.signal});
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
        save(sanctuary,value=>({...value,effects}),status);
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
        status.textContent='Quiet mode: sound and motion effects off.';save(sanctuary,value=>({...value,effects:false}),status);
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
      const key='hdc-reader-v1', status=q('[data-reader-status]'), previous=load(reader,status), passage=q('[data-reader-passage]');
      if(!passage){status.textContent='Pilot text unavailable. Use the Books Library links.';return;}
      const state={...previous,bookmark:previous.bookmark===true,read:previous.read===true,
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
      const persist=edit=>{const value=save(reader,edit,status);if(value)Object.assign(state,value);render();};
      window.addEventListener('storage',event=>{
        if((event.key!==key&&event.key!==null)||!root.isConnected)return;
        reader?.changed();
        try{if(!reader)throw new Error('Unavailable local records');const value=reader.get();Object.assign(state,value);render();status.textContent='Reader progress and preferences updated from another tab.';}
        catch(_){unavailable(status);}
      },{signal:controller.signal});
      on('[data-bookmark]','click',()=>persist(value=>({...value,bookmark:!value.bookmark})));
      on('[data-read]','click',()=>persist(value=>({...value,read:!value.read})));
      on('[data-reader-size]','change',()=>{const n=Number(q('[data-reader-size]').value);if([1,1.25,1.5].includes(n))persist(value=>({...value,size:n}));});
      on('[data-reader-spacing]','change',()=>{const n=Number(q('[data-reader-spacing]').value);if([1.8,2.2].includes(n))persist(value=>({...value,spacing:n}));});
      const filterPassage=()=>{
        const query=q('[data-reader-query]').value.normalize('NFC').trim().toLocaleLowerCase();
        passage.hidden=!passage.textContent.normalize('NFC').toLocaleLowerCase().includes(query);
        q('[data-reader-empty]').hidden=!passage.hidden;
        const translation=q('[data-reader-translation]'),text=q('[data-reader-translation-text]');
        if(query&&translation&&text?.textContent.normalize('NFC').toLocaleLowerCase().includes(query))translation.open=true;
      };
      const revealPassage=()=>{q('[data-reader-query]').value='';passage.hidden=false;q('[data-reader-empty]').hidden=true;passage.focus({preventScroll:true});passage.scrollIntoView({block:'center',behavior:'auto'});};
      on('[data-reader-query]','input',filterPassage);
      root.addEventListener('click',event=>{
        const link=event.target.closest('a[href]');if(!link)return;const target=new URL(link.href,location.href);
        if(target.origin===location.origin&&target.pathname===location.pathname&&target.hash===`#${passage.id}`)revealPassage();
      },{signal:controller.signal});
      window.addEventListener('hashchange',()=>{if(location.hash===`#${passage.id}`)revealPassage();},{signal:controller.signal});
      on('[data-reader-clear]','click',()=>persist(value=>({...value,bookmark:false,read:false})));
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
