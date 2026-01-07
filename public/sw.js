self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
});

self.addEventListener('fetch', (event) => {
    // Simple fetch pass-through
    event.respondWith(fetch(event.request));
});
