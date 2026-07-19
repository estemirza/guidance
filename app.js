/* Revealed — personal reader. Vanilla JS, hash-routed SPA. */
'use strict';

const APP = document.getElementById('app');
const LS = {
  get:(k,d)=>{ try{ return JSON.parse(localStorage.getItem('rv_'+k)) ?? d; }catch(e){ return d; } },
  set:(k,v)=>localStorage.setItem('rv_'+k, JSON.stringify(v)),
};
const state = {
  theme: LS.get('theme','light'),
  fscale: LS.get('fscale',1),
  saved: LS.get('saved',[]),      // [{n,tab,label}]
  last: LS.get('last',null),      // {n,tab,y}
};
applyTheme(); applyScale();

const SVG_MARK = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<g stroke="currentColor" stroke-width="6" stroke-linecap="round">
${Array.from({length:16}).map((_,i)=>{const a=i*22.5*Math.PI/180;const x1=50+14*Math.cos(a),y1=50+14*Math.sin(a),x2=50+40*Math.cos(a),y2=50+40*Math.sin(a);return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`;}).join('')}
</g><circle cx="50" cy="50" r="9" fill="currentColor"/></svg>`;
const DIAMOND = `<svg class="diamond" viewBox="0 0 40 40" fill="none"><path d="M20 2 L38 20 L20 38 L2 20 Z" stroke="currentColor" stroke-width="1.2"/></svg>`;
const ICO = {
  search:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>`,
  bookmark:'♡', bookmarkOn:'♥', gear:'⚙', moon:'☽', text:'A', back:'‹',
};

let INDEX = null;
const surahCache = new Map();
let searchCorpus = null;

async function getIndex(){
  if(INDEX) return INDEX;
  const r = await fetch('data/index.json'); INDEX = await r.json(); return INDEX;
}
async function getSurah(n){
  if(surahCache.has(n)) return surahCache.get(n);
  const r = await fetch('data/surah-'+n+'.json');
  const o = await r.json(); surahCache.set(n,o); return o;
}
const QURAN_CDN='https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters/';
const quranCache=new Map();
async function getQuran(n){
  if(quranCache.has(n)) return quranCache.get(n);
  const r=await fetch(QURAN_CDN+n+'.json');
  if(!r.ok) throw new Error('quran fetch');
  const o=await r.json();
  const verses=(o.verses||[]).map(v=>({a:v.id,t:v.text}));
  quranCache.set(n,verses); return verses;
}
const AR_DIGITS='٠١٢٣٤٥٦٧٨٩';
function toArabicNum(x){ return String(x).replace(/\d/g,d=>AR_DIGITS[+d]); }
function tabLabel(t){ return t==='deep'?'Deeper Look':t==='quran'?"Qur'an":'Concise'; }

/* ---------------- theming ---------------- */
function applyTheme(){ document.documentElement.setAttribute('data-theme', state.theme); }
function applyScale(){ document.documentElement.style.setProperty('--fscale', state.fscale); }
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.hidden=false; clearTimeout(t._h); t._h=setTimeout(()=>t.hidden=true,1800); }

/* ---------------- helpers ---------------- */
function h(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; }
function esc(s){ return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
const AR_RE=/[؀-ۿ]/;
function isArabicHeavy(t){ const m=(t.match(/[؀-ۿ]/g)||[]).length; const l=(t.replace(/\s/g,'').length)||1; return m/l>0.55 && m>2; }
function markArabic(container){
  container.querySelectorAll('p').forEach(p=>{ if(isArabicHeavy(p.textContent)){ p.classList.add('ar-line'); p.setAttribute('lang','ar'); }});
}
function topbar(){
  return `<div class="topbar"><div class="topbar-in">
    <a class="brand" href="#/">${SVG_MARK}<span>Guidance</span></a>
    <div class="spacer"></div>
    <button class="iconbtn" data-act="search" title="Search">${ICO.search}</button>
    <button class="iconbtn" data-act="saved" title="Bookmarks">${ICO.bookmarkOn}</button>
    <button class="iconbtn" data-act="settings" title="Settings">${ICO.gear}</button>
  </div></div>`;
}

/* ---------------- views ---------------- */
async function viewHome(){
  const idx = await getIndex();
  const last = state.last;
  let lastCard = '';
  if(last){ const s=idx.find(x=>x.n===last.n); if(s){
    lastCard = `<a class="continue" href="#/s/${s.n}?tab=${last.tab||'concise'}&resume=1">
      <div><div class="c-label">Continue reading</div>
      <div class="c-title">${esc(s.en)}</div>
      <div class="c-sub">${tabLabel(last.tab)} · Sūrah ${s.n}</div></div>
      <div class="arrow">→</div></a>`; }}
  const rows = idx.map(s=>surahRow(s)).join('');
  APP.innerHTML = topbar() + `<div class="wrap">
    <div class="hero"><div class="mark">${SVG_MARK}</div>
      <h1>Guidance</h1><p>The Qur'an, with study notes</p></div>
    <div class="searchbar" data-act="search">${ICO.search}<input id="filter" placeholder="Filter sūrahs by name or number…" autocomplete="off"/></div>
    ${lastCard}
    <div class="sec-label">The 114 Sūrahs</div>
    <div class="surah-list" id="list">${rows}</div>
  </div>`;
  bindChrome();
  const f=document.getElementById('filter');
  f.addEventListener('input',()=>{
    const q=f.value.trim().toLowerCase();
    const list=document.getElementById('list');
    list.innerHTML = idx.filter(s=>!q || (''+s.n)===q || s.en.toLowerCase().includes(q) || s.ar.includes(q)).map(surahRow).join('');
  });
  f.addEventListener('keydown',e=>{ if(e.key==='Enter'){ location.hash='#/search?q='+encodeURIComponent(f.value.trim()); }});
  restoreScrollMaybe();
}
function surahRow(s){
  const badge = s.hasDeep ? '' : `<span class="badge partial">Concise</span>`;
  return `<a class="surah-row" href="#/s/${s.n}">
    <div class="s-num">${DIAMOND}<span>${s.n}</span></div>
    <div class="s-main"><div class="s-name">${esc(s.en)}${badge}</div>
      <div class="s-meta">${s.ayat} āyāt${s.hasDeep?' · Concise + Deeper Look':''}</div></div>
    <div class="s-ar">${s.ar}</div></a>`;
}

async function viewReader(n, params){
  n=+n;
  APP.innerHTML = topbar() + `<div class="wrap"><div class="empty">Loading…</div></div>`;
  const idx = await getIndex();
  const s = await getSurah(n);
  const meta = idx.find(x=>x.n===n) || {en:s.en,ar:s.ar,ayat:s.ayat};
  const cmap = s.cmap || [];
  const scrollPos = {quran:0, concise:0, deep:0};
  let tab = params.get('tab');
  if(tab==='deep' && !s.hasDeep) tab='concise';
  if(!['quran','concise','deep'].includes(tab)) tab='quran';
  const prev = idx.find(x=>x.n===n-1), next = idx.find(x=>x.n===n+1);
  APP.innerHTML = topbar() + `<div class="wrap">
    <a class="back" href="#/">${ICO.back} All sūrahs</a>
    <div class="reader-head">
      <div class="kicker">Sūrah ${n}</div>
      <div class="ar">${s.ar}</div>
      <h2>${esc(s.en)}</h2>
      <div class="sub">${meta.ayat} āyāt</div>
    </div>
    <div class="tabs">
      <button class="tab" data-tab="quran">Qur'an</button>
      <button class="tab" data-tab="concise">Concise</button>
      <button class="tab" data-tab="deep" ${s.hasDeep?'':'disabled'}>Deeper Look</button>
    </div>
    <div class="content" id="content"></div>
    <div class="readnav">
      ${prev?`<a href="#/s/${prev.n}"><span class="lab">← Previous</span><span class="nm">${esc(prev.en)}</span></a>`:'<span style="flex:1"></span>'}
      ${next?`<a class="next" href="#/s/${next.n}"><span class="lab">Next →</span><span class="nm">${esc(next.en)}</span></a>`:'<span style="flex:1"></span>'}
    </div></div>
    <div class="fab-row">
      <button class="fab" id="fab-text" title="Text size">${ICO.text}</button>
    </div>`;
  const content = document.getElementById('content');
  const isBm=(a)=>state.saved.some(x=>x.n===n && x.a===a);
  function toggleBm(a){
    if(isBm(a)){ state.saved=state.saved.filter(x=>!(x.n===n && x.a===a)); toast('Bookmark removed'); }
    else{ state.saved.unshift({n, a, label:s.en}); toast('Āyah bookmarked'); }
    LS.set('saved',state.saved);
  }
  function highlightAyah(a){
    const el=content.querySelector('.ayah[data-a="'+a+'"]');
    if(!el) return;
    el.scrollIntoView({behavior:'smooth',block:'center'});
    el.classList.add('bm-hit'); setTimeout(()=>el.classList.remove('bm-hit'),2200);
  }
  function passageForAyah(a){
    for(let i=0;i<cmap.length;i++){ if(a>=cmap[i][0] && a<=cmap[i][1]) return i; }
    for(let i=cmap.length-1;i>=0;i--){ if(cmap[i][1]<=a) return i; }
    return cmap.length? 0 : -1;
  }
  function scrollToPassage(i){
    const bqs=content.querySelectorAll('blockquote');
    const el=bqs[i]; if(!el) return;
    el.scrollIntoView({behavior:'smooth',block:'start'});
    el.classList.add('cm-hit'); setTimeout(()=>el.classList.remove('cm-hit'),2200);
  }
  async function goPassage(a){
    const i=passageForAyah(a);
    if(i<0){ toast("No commentary for this āyah yet"); return; }
    scrollPos[tab]=window.scrollY;
    tab='concise'; await render(null); scrollToPassage(i);
  }
  async function renderQuran(){
    content.innerHTML=`<div class="empty">Loading Qur'an…</div>`;
    let verses;
    try{ verses=await getQuran(n); }
    catch(e){ content.innerHTML=`<div class="note">Couldn't load the Qur'an text. Go online once to cache it — then it works offline.</div>`; return; }
    content.innerHTML=`<div class="quran">`+verses.map(v=>{
      const has=passageForAyah(v.a)>=0;
      return `<div class="ayah" data-a="${v.a}">
        <div class="ayah-ar">${v.t}<span class="ayah-end">${toArabicNum(v.a)}</span></div>
        <div class="ayah-actions">
          <button class="ayah-bm ${isBm(v.a)?'on':''}" data-a="${v.a}" aria-label="Bookmark āyah">${isBm(v.a)?ICO.bookmarkOn:ICO.bookmark}</button>
          ${has?`<button class="ayah-link" data-a="${v.a}">Concise commentary ›</button>`:'<span class="ayah-nolink">No note yet</span>'}
        </div>
      </div>`;
    }).join('')+`</div>`;
    content.querySelectorAll('.ayah-link').forEach(b=>b.addEventListener('click',()=>goPassage(+b.dataset.a)));
    content.querySelectorAll('.ayah-bm').forEach(b=>b.addEventListener('click',()=>{
      const a=+b.dataset.a; toggleBm(a); const on=isBm(a);
      b.classList.toggle('on',on); b.textContent=on?ICO.bookmarkOn:ICO.bookmark;
    }));
  }
  async function render(restoreY){
    document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab===tab));
    if(tab==='quran'){ await renderQuran(); }
    else { content.innerHTML = (tab==='deep'? s.deep : s.concise) || `<div class="empty">Not available.</div>`; markArabic(content); }
    state.last={n, tab, y:restoreY||0}; LS.set('last',state.last);
    if(restoreY!==null) requestAnimationFrame(()=>window.scrollTo(0, restoreY||0));
  }
  render();
  document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{
    if(b.hasAttribute('disabled') || b.dataset.tab===tab) return;
    scrollPos[tab]=window.scrollY;
    tab=b.dataset.tab;
    render(scrollPos[tab]||0);
  }));
  bindChrome();
  document.getElementById('fab-text').addEventListener('click',openSettings);
  let sc; window.addEventListener('scroll',()=>{ clearTimeout(sc); sc=setTimeout(()=>{ state.last={n,tab,y:window.scrollY}; LS.set('last',state.last); },250); },{passive:true});
  const qa=+params.get('qa');
  const ay=+params.get('ayah');
  if(qa){ tab='quran'; render(null).then(()=>highlightAyah(qa)); }
  else if(ay){ tab='concise'; render(null).then(()=>scrollToPassage(passageForAyah(ay))); }
  else if(params.get('resume')==='1' && LS.get('last') && LS.get('last').n===n){ const y=LS.get('last').y||0; setTimeout(()=>window.scrollTo(0,y),60); }
  else window.scrollTo(0,0);
}

/* ---------------- search ---------------- */
async function buildCorpus(onProgress){
  if(searchCorpus) return searchCorpus;
  const idx = await getIndex();
  const tmp=document.createElement('div');
  const corpus=[];
  for(let i=0;i<idx.length;i++){
    const s = await getSurah(idx[i].n);
    for(const [sec,html] of [['Concise',s.concise],['Deeper Look',s.deep]]){
      if(!html) continue;
      tmp.innerHTML=html;
      tmp.querySelectorAll('h2,h3,h4').forEach(hd=>{
        let t=''; let el=hd.nextElementSibling;
        while(el && !/H[2-4]/.test(el.tagName)){ t+=' '+el.textContent; el=el.nextElementSibling; }
        corpus.push({n:idx[i].n, en:idx[i].en, sec, head:hd.textContent.trim(), text:(hd.textContent+' '+t).replace(/\s+/g,' ').trim()});
      });
    }
    if(onProgress) onProgress((i+1)/idx.length);
  }
  searchCorpus=corpus; return corpus;
}
async function viewSearch(params){
  const q0 = params.get('q')||'';
  APP.innerHTML = topbar()+`<div class="wrap">
    <a class="back" href="#/">${ICO.back} Home</a>
    <div class="searchbar">${ICO.search}<input id="q" placeholder="Search all commentary…" value="${esc(q0)}" autocomplete="off"/></div>
    <div id="sres"></div></div>`;
  bindChrome();
  const input=document.getElementById('q'); const res=document.getElementById('sres');
  input.focus();
  async function run(){
    const q=input.value.trim();
    if(q.length<2){ res.innerHTML=`<div class="empty">Type at least 2 letters to search across every sūrah.</div>`; return; }
    if(!searchCorpus){
      res.innerHTML=`<div class="empty">Preparing search index…<div class="progress"><i id="pb"></i></div><div style="font-size:.8rem;margin-top:8px">First search loads all commentary (once). It's cached after.</div></div>`;
      await buildCorpus(p=>{ const pb=document.getElementById('pb'); if(pb) pb.style.width=Math.round(p*100)+'%'; });
    }
    const ql=q.toLowerCase();
    const hits=[];
    for(const c of searchCorpus){ const i=c.text.toLowerCase().indexOf(ql); if(i>=0){ hits.push({c,i}); if(hits.length>=300)break; } }
    if(!hits.length){ res.innerHTML=`<div class="empty">No matches for “${esc(q)}”.</div>`; return; }
    res.innerHTML = hits.slice(0,120).map(({c,i})=>{
      const start=Math.max(0,i-45); const snip=(start>0?'…':'')+c.text.slice(start,i+ql.length+90)+'…';
      const hl=esc(snip).replace(new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','ig'),'<mark>$1</mark>');
      return `<a class="result" href="#/s/${c.n}?tab=${c.sec==='Deeper Look'?'deep':'concise'}">
        <div class="r-top"><span class="r-name">${esc(c.en)}</span><span class="r-tag">${c.sec}</span></div>
        <div class="r-snip">${hl}</div></a>`;
    }).join('') + `<div class="empty" style="padding:20px">${hits.length} passage${hits.length>1?'s':''} matched</div>`;
  }
  let t; input.addEventListener('input',()=>{ clearTimeout(t); t=setTimeout(run,250); });
  if(q0) run();
}

async function viewSaved(){
  const idx=await getIndex();
  APP.innerHTML = topbar()+`<div class="wrap"><a class="back" href="#/">${ICO.back} Home</a>
    <div class="sec-label">Bookmarks</div><div id="bm"></div></div>`;
  bindChrome();
  const bm=document.getElementById('bm');
  if(!state.saved.length){ bm.innerHTML=`<div class="empty">No bookmarks yet.<br/>Open the <b>Qur'an</b> tab and tap ${ICO.bookmark} on an āyah to save it here.</div>`; return; }
  bm.innerHTML='<div class="surah-list">'+state.saved.map(b=>{
    const s=idx.find(x=>x.n===b.n)||{en:b.label,ar:''};
    const href = b.a!=null ? `#/s/${b.n}?qa=${b.a}` : `#/s/${b.n}`;
    const meta = b.a!=null ? `Āyah ${b.n}:${b.a}` : tabLabel(b.tab);
    return `<a class="surah-row" href="${href}">
      <div class="s-num">${DIAMOND}<span>${b.n}</span></div>
      <div class="s-main"><div class="s-name">${esc(s.en)}</div>
        <div class="s-meta">${meta}</div></div>
      <div class="s-ar">${s.ar}</div></a>`;
  }).join('')+'</div>';
}

/* ---------------- settings sheet ---------------- */
function openSettings(){
  const bg=h(`<div class="sheet-bg"><div class="sheet">
    <h3>Settings</h3>
    <div class="row"><span>Theme</span><div class="seg" id="seg-theme">
      <button data-v="light" class="${state.theme==='light'?'on':''}">Light</button>
      <button data-v="dark" class="${state.theme==='dark'?'on':''}">Dark</button></div></div>
    <div class="row"><span>Text size</span><div class="seg" id="seg-size">
      <button data-v="0.9" class="${state.fscale==0.9?'on':''}">A-</button>
      <button data-v="1" class="${state.fscale==1?'on':''}">A</button>
      <button data-v="1.15" class="${state.fscale==1.15?'on':''}">A+</button>
      <button data-v="1.3" class="${state.fscale==1.3?'on':''}">A++</button></div></div>
    <div class="row"><span>Offline</span><button class="btn ghost" id="dl">Download all</button></div>
    <div class="row" style="border:0"><span style="color:var(--ink-soft);font-size:.85rem">Personal copy for study</span>
      <button class="btn" id="close">Done</button></div>
  </div></div>`);
  document.body.appendChild(bg);
  bg.addEventListener('click',e=>{ if(e.target===bg) bg.remove(); });
  bg.querySelector('#close').addEventListener('click',()=>bg.remove());
  bg.querySelector('#seg-theme').addEventListener('click',e=>{ const v=e.target.dataset.v; if(!v)return;
    state.theme=v; LS.set('theme',v); applyTheme(); bg.querySelectorAll('#seg-theme button').forEach(b=>b.classList.toggle('on',b.dataset.v===v)); });
  bg.querySelector('#seg-size').addEventListener('click',e=>{ const v=e.target.dataset.v; if(!v)return;
    state.fscale=+v; LS.set('fscale',+v); applyScale(); bg.querySelectorAll('#seg-size button').forEach(b=>b.classList.toggle('on',b.dataset.v===v)); });
  bg.querySelector('#dl').addEventListener('click',async ev=>{
    const btn=ev.target; btn.textContent='Downloading…'; btn.disabled=true;
    const idx=await getIndex(); let done=0;
    for(const s of idx){
      try{ await fetch('data/surah-'+s.n+'.json'); }catch(e){}
      try{ await fetch(QURAN_CDN+s.n+'.json'); }catch(e){}
      done++; btn.textContent=`Downloading… ${done}/${idx.length}`;
    }
    btn.textContent='Saved offline ✓'; toast('Qur\'an + notes cached for offline');
  });
}

/* ---------------- chrome + router ---------------- */
function bindChrome(){
  document.querySelectorAll('[data-act]').forEach(b=>{
    if(b._bound) return; b._bound=true;
    b.addEventListener('click',e=>{
      if(e.target.tagName==='INPUT')return;
      const a=b.dataset.act;
      if(a==='search') location.hash='#/search';
      else if(a==='saved') location.hash='#/saved';
      else if(a==='settings') openSettings();
    });
  });
}
function restoreScrollMaybe(){ if(sessionStorage.getItem('home_y')){ setTimeout(()=>window.scrollTo(0,+sessionStorage.getItem('home_y')),30);} }

function parseHash(){
  const raw=location.hash.replace(/^#\/?/,''); const [path,qs]=raw.split('?');
  return {path, params:new URLSearchParams(qs||'')};
}
async function route(){
  const {path,params}=parseHash();
  window.scrollTo(0,0);
  if(!path||path===''){ await viewHome(); return; }
  if(path.startsWith('s/')){ await viewReader(path.slice(2), params); return; }
  if(path==='search'){ await viewSearch(params); return; }
  if(path==='saved'){ await viewSaved(); return; }
  await viewHome();
}
window.addEventListener('hashchange',route);
route();

/* ---------------- service worker ---------------- */
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
}
