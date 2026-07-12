const CACHE_NAME = 'para-ti-v1';
const FILES_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Para la página principal: intenta traer siempre la versión más nueva desde internet.
  // Así, cuando subas cambios a GitHub, la próxima vez que se abra la app instalada
  // se van a ver solos, sin tener que reinstalar nada.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request, {cache: 'no-store'})
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request)) // sin internet: usa la última guardada
    );
    return;
  }
  // Para íconos y manifest (casi nunca cambian): usa la copia guardada primero, es más rápido.
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
