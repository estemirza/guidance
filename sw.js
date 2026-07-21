/* Guidance service worker — offline-first */
const VERSION = 'guidance-v10';
const SHELL = VERSION + '-shell';
const DATA  = VERSION + '-data';
const FONTS = VERSION + '-fonts';
const QURAN = VERSION + '-quran';

const SHELL_ASSETS = [
  './','index.html','styles.css','app.js','manifest.webmanifest',
  'icons/icon-192.png','icons/icon-512.png','icons/icon-maskable-512.png','icons/apple-touch-icon.png',
  'data/index.json'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(SHELL).then(c=>c.addAll(SHELL_ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>!k.startsWith(VERSION)).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  if(req.method!=='GET') return;
  const url = new URL(req.url);

  // Google Fonts — cache-first, runtime
  if(url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')){
    e.respondWith(cacheFirst(req, FONTS)); return;
  }
  // Qur'an text from CDN — cache-first (immutable, versioned URL)
  if(url.hostname.includes('cdn.jsdelivr.net') && (url.pathname.includes('quran-json') || url.pathname.includes('quran-api'))){
    e.respondWith(cacheFirst(req, QURAN)); return;
  }
  if(url.origin !== location.origin) return;

  // Surah data — cache-first (immutable content)
  if(url.pathname.includes('/data/surah-')){
    e.respondWith(cacheFirst(req, DATA)); return;
  }
  // App shell & everything same-origin — stale-while-revalidate
  e.respondWith(staleWhileRevalidate(req, SHELL));
});

async function cacheFirst(req, cacheName){
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if(hit) return hit;
  try{ const res = await fetch(req); if(res && res.ok) cache.put(req, res.clone()); return res; }
  catch(err){ return hit || Response.error(); }
}
async function staleWhileRevalidate(req, cacheName){
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  const net = fetch(req).then(res=>{ if(res && res.ok) cache.put(req, res.clone()); return res; }).catch(()=>hit);
  return hit || net;
}
