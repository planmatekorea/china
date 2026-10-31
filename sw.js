// 플랜메이트 서비스 워커: 한 번 열어 본 화면과 데이터를 저장해 두어 인터넷이 약해도 볼 수 있게 합니다.
// 리뷰 서버(Apps Script)와 구글 폰트 등 다른 사이트 요청은 건드리지 않습니다.
var CACHE = 'planmate-v2';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'img/logo.png', 'data/guides.json'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function networkFirst(req) {
  return fetch(req).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
    return res;
  }).catch(function () { return caches.match(req, { ignoreSearch: true }); });
}

function cacheFirst(req) {
  return caches.match(req).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate' || /\.(json|html)$/.test(url.pathname) || url.pathname.slice(-1) === '/') {
    e.respondWith(networkFirst(req));   // 화면과 데이터는 인터넷이 되면 항상 최신으로
  } else {
    e.respondWith(cacheFirst(req));     // 사진·아이콘은 저장해 둔 것을 바로 사용
  }
});
