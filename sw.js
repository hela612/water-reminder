/* water-pwa service worker */
var CACHE = 'water-reminder-v5';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './music.mp3'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ks) {
      return Promise.all(ks.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var isNav = e.request.mode === 'navigate';
  if (isNav) {
    /* 导航请求：网络优先，拿到最新页面并更新缓存；离线回退缓存 */
    e.respondWith(
      fetch(e.request).then(function (res) {
        var cl = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', cl); });
        return res;
      }).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (r) {
      if (r) return r;
      return fetch(e.request).then(function (res) {
        var cl = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, cl); });
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
      for (var i = 0; i < cs.length; i++) {
        if ('focus' in cs[i]) return cs[i].focus();
      }
      return clients.openWindow('./index.html');
    })
  );
});
