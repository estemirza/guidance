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
  showTr: LS.get('showTr',true),  // show translation in Qur'an tab
  saved: LS.get('saved',[]),      // [{n,a,label}]
  last: LS.get('last',null),      // {n,tab,y}
};
applyTheme(); applyScale(); applyTr();

let deferredPrompt=null;
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredPrompt=e; });
window.addEventListener('appinstalled', ()=>{ deferredPrompt=null; });

const SVG_MARK = `<svg viewBox="0 0 169 187" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill-rule="evenodd" clip-rule="evenodd" d="M74.3897 1.7062C69.2917 7.3332 71.7427 27.9382 78.6257 37.3112C79.9107 39.0622 80.9627 40.7792 80.9627 41.1262C80.9627 44.4422 99.7677 60.7962 109.054 65.5552C114.185 68.1852 114.248 68.2212 127.98 76.2812C144.914 86.2202 154.747 96.4612 156.397 105.878C157.979 114.911 162.963 107.285 162.963 95.8312C162.963 85.9232 160.786 81.4472 152.054 73.4042C145.68 67.5322 124.651 53.6342 122.13 53.6262C121.763 53.6252 118.384 51.6002 114.62 49.1262C110.856 46.6522 107.369 44.6282 106.87 44.6282C106.371 44.6282 105.963 44.2382 105.963 43.7612C105.963 43.2842 104.114 41.6702 101.853 40.1742C88.2827 31.1942 80.1997 19.3312 79.0487 6.7062C78.4057 -0.343796 77.3117 -1.5188 74.3897 1.7062ZM57.3657 19.2952C57.0367 20.3032 56.1357 22.8252 55.3647 24.8982C51.7917 34.5062 55.5207 48.0312 65.4547 61.4942C68.8197 66.0542 78.5187 74.8312 84.4927 78.7212C95.3147 85.7672 97.0127 86.7912 103.963 90.4632C121.58 99.7692 139.689 114.825 136.004 117.103C133.203 118.834 119.181 111.573 112.312 104.834C109.344 101.922 106.539 99.7722 106.079 100.056C104.325 101.141 104.028 109.484 105.561 114.645C107.042 119.632 107.009 120.048 104.674 125.975C97.5577 144.035 101.493 162.628 112.431 162.628C118.592 162.628 115.252 165.986 106.359 168.733C98.0527 171.298 92.7347 170.713 87.8627 166.697C78.9047 159.314 79.5248 150.878 88.9918 151.331C93.2378 151.534 93.2377 151.534 92.5037 145.331C92.0997 141.919 91.5947 134.628 91.3807 129.128C90.5637 108.075 76.0717 106.256 56.6197 124.764C48.1507 132.821 34.4007 137.27 30.9227 133.08C26.4047 127.636 22.2467 136.382 25.5567 144.367C31.3107 158.252 44.5787 156.172 65.4627 138.11C72.6327 131.909 76.7967 129.628 80.9447 129.628C84.2477 129.628 86.5487 132.619 83.8927 133.461C82.0867 134.033 73.1437 143.07 70.0967 147.401C67.0837 151.683 55.2157 160.315 46.7337 164.393C21.7027 176.427 -1.67325 155.874 5.74575 128.354C7.98675 120.041 4.79174 117.97 2.40274 126.187C-1.43526 139.389 0.527747 159.344 6.53675 168.216C21.5487 190.379 52.8957 188.97 73.7707 165.194C77.8157 160.587 77.9627 160.647 77.9627 166.917C77.9627 184.375 93.3547 191.579 111.435 182.581C118.254 179.188 119.352 178.113 129.026 165.378C131.087 162.665 131.265 162.628 142.289 162.643C154.286 162.66 154.989 162.848 156.951 166.569C159.241 170.912 162.963 165.255 162.963 157.432C162.963 153.522 163.448 150.952 164.32 150.238C173.889 142.408 166.771 125.268 152.476 121.718C145.81 120.063 144.777 119.13 146.187 116.036C148.852 110.186 143.522 98.8702 134.321 90.8452C126.473 83.9992 126.218 83.8052 122.254 81.6412C120.169 80.5032 117.113 78.6892 115.463 77.6112C113.813 76.5322 111.788 75.3402 110.963 74.9622C110.138 74.5842 107.663 73.1312 105.463 71.7342C103.263 70.3372 99.9318 68.3542 98.0608 67.3282C77.2328 55.9012 62.7887 39.0952 61.1427 24.3742C60.4667 18.3262 58.5307 15.7242 57.3657 19.2952ZM37.7477 39.6882C21.7587 49.0092 16.3457 88.0862 30.0617 95.1792C34.7987 97.6292 46.6897 95.8722 54.1987 91.6132C56.2257 90.4642 63.9877 90.2762 63.9107 91.3782C63.8817 91.7902 60.2517 93.9282 55.8437 96.1282C51.4357 98.3282 44.8217 101.687 41.1457 103.593C14.7837 117.259 -5.13226 95.2852 12.5747 72.0702C15.2477 68.5652 15.6227 66.6282 13.6277 66.6282C10.8377 66.6282 2.98075 77.4772 2.94775 81.3742C2.93975 82.3392 2.21775 85.1532 1.34175 87.6282C-1.89725 96.7852 0.999745 111.664 7.11575 117.285C17.7657 127.074 33.8667 126.785 50.7927 116.5C59.2747 111.346 63.4667 109.5 68.4227 108.737C71.7817 108.221 72.4957 107.673 73.1277 105.128C73.5377 103.478 74.6107 99.4692 75.5127 96.2192C80.9787 76.5302 69.6247 67.3062 48.9147 74.6082C30.3267 81.1632 23.8027 73.1802 36.7607 59.7382C37.4977 58.9732 39.5277 58.0552 41.2717 57.6992C45.2087 56.8942 46.9287 53.7462 46.9477 47.3122C46.9717 39.3942 43.3717 36.4102 37.7477 39.6882ZM90.0707 92.4762C87.5667 95.9932 87.4697 96.9742 89.4627 98.6282C91.6077 100.408 91.3507 101.043 87.9627 102.322C83.9637 103.831 83.7477 107.148 87.7127 106.159C96.7877 103.897 101.789 97.8862 98.7637 92.8742C96.3837 88.9302 92.7157 88.7622 90.0707 92.4762ZM123.102 134.2C134.978 140.341 135.377 147.186 123.849 147.015C112.6 146.848 106.589 142.24 108.369 135.147C109.141 132.07 117.895 131.507 123.102 134.2ZM147.164 137.737C154.979 139.373 160.963 143.857 160.963 148.077C160.963 148.272 158.826 147.773 156.213 146.968C152.844 145.93 149.355 145.692 144.213 146.151C140.225 146.507 136.963 146.602 136.963 146.363C136.963 146.123 137.453 144.397 138.051 142.527C138.65 140.658 139.31 138.566 139.52 137.878C139.985 136.35 140.494 136.341 147.164 137.737Z" fill="currentColor"/></svg>`;
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
const QURAN_AR='https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranuthmanihaf/'; // standard Uthmani code points
const QURAN_EN='https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/eng-ummmuhammad/';     // Saheeh International
const BASMALA='بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';
const SAJDAH=new Set(['7:206','13:15','16:49','17:107','19:58','22:18','22:77','25:60','27:25','32:15','38:24','41:37','53:62','84:21','96:19']);
// Juz (30) and Hizb (60) start points, keyed "surah:ayah". Source: standard Ḥafṣ division.
const JUZ_START={'1:1':1,'2:142':2,'2:253':3,'3:93':4,'4:24':5,'4:148':6,'5:82':7,'6:111':8,'7:88':9,'8:41':10,'9:93':11,'11:6':12,'12:53':13,'15:1':14,'17:1':15,'18:75':16,'21:1':17,'23:1':18,'25:21':19,'27:56':20,'29:46':21,'33:31':22,'36:28':23,'39:32':24,'41:47':25,'46:1':26,'51:31':27,'58:1':28,'67:1':29,'78:1':30};
// Only the mid-juz (even) hizb starts; odd hizbs coincide with juz starts and share that marker.
const HIZB_START={'2:75':2,'2:203':4,'3:15':6,'3:171':8,'4:88':10,'5:27':12,'6:36':14,'7:1':16,'7:171':18,'9:34':20,'10:26':22,'11:84':24,'13:19':26,'16:51':28,'17:99':30,'20:1':32,'22:1':34,'24:21':36,'26:111':38,'28:51':40,'31:22':42,'34:24':44,'37:145':46,'40:41':48,'43:24':50,'48:18':52,'55:1':54,'62:1':56,'72:1':58,'87:1':60};
function checkpointMark(n,a){
  const k=n+':'+a;
  if(JUZ_START[k]!=null){ const j=JUZ_START[k]; return `<div class="ckpt ckpt-juz" role="separator" aria-label="Start of Juz ${j}"><span class="ckpt-line"></span><span class="ckpt-label">Juz ${j} · Ḥizb ${2*j-1}</span><span class="ckpt-line"></span></div>`; }
  if(HIZB_START[k]!=null){ return `<div class="ckpt ckpt-hizb" role="separator" aria-label="Start of Ḥizb ${HIZB_START[k]}"><span class="ckpt-line"></span><span class="ckpt-label">Ḥizb ${HIZB_START[k]}</span><span class="ckpt-line"></span></div>`; }
  return '';
}
const quranCache=new Map();
async function getQuran(n){
  if(quranCache.has(n)) return quranCache.get(n);
  const [arR, enR] = await Promise.all([ fetch(QURAN_AR+n+'.json'), fetch(QURAN_EN+n+'.json').catch(()=>null) ]);
  if(!arR.ok) throw new Error('quran fetch');
  const ar = await arR.json();
  const tr = {};
  try{ if(enR && enR.ok){ const en = await enR.json(); (en.chapter||[]).forEach(v=>{ tr[v.verse]=v.text||''; }); } }catch(e){}
  const verses = (ar.chapter||[]).map(v=>({ a:v.verse, t:v.text, tr:tr[v.verse]||'' }));
  quranCache.set(n, verses); return verses;
}
const AR_DIGITS='٠١٢٣٤٥٦٧٨٩';
function toArabicNum(x){ return String(x).replace(/\d/g,d=>AR_DIGITS[+d]); }
function tabLabel(t){ return t==='deep'?'Deeper Look':t==='quran'?"Qur'an":'Concise'; }

/* ---------------- theming ---------------- */
function applyTheme(){ document.documentElement.setAttribute('data-theme', state.theme); }
function applyScale(){ document.documentElement.style.setProperty('--fscale', state.fscale); }
function applyTr(){ document.documentElement.setAttribute('data-tr', state.showTr?'on':'off'); }
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
    el.scrollIntoView({block:'center'});   // instant jump
    el.classList.add('bm-hit'); setTimeout(()=>el.classList.remove('bm-hit'),2200);
  }
  function passageForAyah(a){
    for(let i=0;i<cmap.length;i++){ if(a>=cmap[i][0] && a<=cmap[i][1]) return i; }
    return -1;
  }
  function scrollToAyah(a){
    // 1) exact āyah heading anywhere (works for "# Ayah N" and bulk sub-headings)
    const reExact=new RegExp('^Ayah\\s+'+a+'(?!\\d)');
    let target=[...content.querySelectorAll('h1,h2,h3,h4,h5,h6')].find(h=>reExact.test(h.textContent.trim()));
    // 2) else the marker (blockquote or heading) whose "Ayah X–Y" range covers a
    if(!target){
      for(const el of content.querySelectorAll('blockquote,h1,h2,h3,h4,h5,h6')){
        const m=el.textContent.trim().match(/^Ayah\s+(\d+)(?:\s*[–-]\s*(\d+))?/);
        if(!m) continue;
        const s=+m[1], e=m[2]?+m[2]:s;
        if(a>=s && a<=e){ target=el; break; }
      }
    }
    if(!target) return;
    target.scrollIntoView({block:'start'});   // instant jump — no visible scrolling
    target.classList.add('cm-hit'); setTimeout(()=>target.classList.remove('cm-hit'),2200);
  }
  async function goAyah(a){
    if(passageForAyah(a)<0){ toast("No commentary for this āyah yet"); return; }
    scrollPos[tab]=window.scrollY;
    tab='concise'; await render(null); scrollToAyah(a);
  }
  async function renderQuran(){
    content.innerHTML=`<div class="empty">Loading Qur'an…</div>`;
    let verses;
    try{ verses=await getQuran(n); }
    catch(e){ content.innerHTML=`<div class="note">Couldn't load the Qur'an text. Go online once to cache it — then it works offline.</div>`; return; }
    if(n===1) verses=verses.filter(v=>v.a!==1);   // Basmala shown as opening line, not āyah 1
    const basmala = (n!==9) ? `<div class="basmala" dir="rtl">${BASMALA}</div>` : '';
    content.innerHTML=`<div class="quran">`+basmala+verses.map(v=>{
      const has=passageForAyah(v.a)>=0;
      return checkpointMark(n,v.a)+`<div class="ayah${has?' has-note':''}" data-a="${v.a}">
        <div class="ayah-body" role="button" tabindex="0" aria-label="Āyah ${v.a} commentary">
          <div class="ayah-ar">${v.t}${SAJDAH.has(n+':'+v.a)?'<span class="sajdah" aria-label="Sajdah" title="Āyat sajdah"> ۩</span>':''}<span class="ayah-end">${toArabicNum(v.a)}</span></div>
          ${v.tr?`<div class="ayah-tr">${esc(v.tr)}</div>`:''}
        </div>
        <div class="ayah-actions">
          <button class="ayah-bm ${isBm(v.a)?'on':''}" data-a="${v.a}" aria-label="Bookmark āyah">${isBm(v.a)?ICO.bookmarkOn:ICO.bookmark}</button>
        </div>
      </div>`;
    }).join('')+`</div>`;
    content.querySelectorAll('.ayah-body').forEach(el=>el.addEventListener('click',()=>goAyah(+el.parentElement.dataset.a)));
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
  else if(ay){ tab='concise'; render(null).then(()=>scrollToAyah(ay)); }
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
    <div class="row"><span>Translation</span><div class="seg" id="seg-tr">
      <button data-v="on" class="${state.showTr?'on':''}">Show</button>
      <button data-v="off" class="${!state.showTr?'on':''}">Hide</button></div></div>
    <div class="row"><span>Install</span><span id="install-slot"></span></div>
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
  bg.querySelector('#seg-tr').addEventListener('click',e=>{ const v=e.target.dataset.v; if(!v)return;
    state.showTr=(v==='on'); LS.set('showTr',state.showTr); applyTr(); bg.querySelectorAll('#seg-tr button').forEach(b=>b.classList.toggle('on',b.dataset.v===v)); });
  (function(){
    const slot=bg.querySelector('#install-slot');
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
    const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
    const hint=t=>`<span style="color:var(--ink-soft);font-size:.82rem;text-align:right;max-width:60%">${t}</span>`;
    if(standalone){ slot.innerHTML=hint('Installed ✓'); }
    else if(deferredPrompt){
      slot.innerHTML='<button class="btn" id="installbtn">Install app</button>';
      slot.querySelector('#installbtn').addEventListener('click',async()=>{
        try{ deferredPrompt.prompt(); const c=await deferredPrompt.userChoice; deferredPrompt=null;
          toast(c && c.outcome==='accepted'?'Installing…':'Install dismissed'); slot.innerHTML=hint('Installing…'); }catch(e){}
      });
    }
    else if(isIOS){ slot.innerHTML=hint('Tap Share → Add to Home Screen'); }
    else { slot.innerHTML=hint('Browser menu → Install app'); }
  })();
  bg.querySelector('#dl').addEventListener('click',async ev=>{
    const btn=ev.target; btn.textContent='Downloading…'; btn.disabled=true;
    const idx=await getIndex(); let done=0;
    for(const s of idx){
      try{ await fetch('data/surah-'+s.n+'.json'); }catch(e){}
      try{ await fetch(QURAN_AR+s.n+'.json'); }catch(e){}
      try{ await fetch(QURAN_EN+s.n+'.json'); }catch(e){}
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
