// Kill-switch: the app moved to https://tobyhattenburg-beep.github.io/hattenburg-job-log/
// This replaces the old service worker, clears its caches, and unregisters itself
// so previously-installed copies pick up the redirect page.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (clients) { clients.forEach(function (c) { c.navigate(c.url); }); })
  );
});
