
const CACHE_NAME = 'jurnal-wali-v1';
// Menggunakan path relatif agar tidak error di GitHub Pages
const assets = ['./', './index.html', './index.tsx', './manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
