/* IRIDARIUM — Service Worker
   Кэширует все ключевые файлы для офлайн-работы */

const CACHE = 'iridarium-v1';
const ASSETS = [
  './',
  './iridarium.html',
  './manifest.json',
  './pic/tree.jpg',
  './pic/iri-logo.png',
  './pic/iridaium-logo.png'
];

// Установка — кладём всё в кэш
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация — чистим старые версии кэша
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Перехват запросов — сначала кэш, потом сеть
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (e.request.method === 'GET' && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./iridarium.html')))
  );
});