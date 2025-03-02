self.addEventListener('install', event => {
    event.waitUntil(
      caches.open('static-cache').then(cache => {
        return cache.addAll([
          '/network-check',
          // Add other necessary files to cache here
        ]);
      })
    );
  });
  
  self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  });
  