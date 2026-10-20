const CACHE = 'wallet-v1';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isPage = req.mode === 'navigate';
  if (isPage) {
    // Pages: try the network first so updates arrive, fall back to the saved copy offline.
    e.respondWith(fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  // Everything else (icons, fonts): saved copy first, then network, and save what we fetch.
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r;
  })));
});
