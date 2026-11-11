/* pitex 오프라인 도우미 (service worker)
   - 인터넷이 되면: 늘 GitHub에서 새 파일을 먼저 받아 씀 → 올리면 다음에 열 때 바로 새 버전
   - 인터넷이 안 되면: 기기에 보관해 둔 파일로 열림 */
const CACHE = 'pitex-v3-2';                        // 버전을 바꾸면 보관함을 새로 만듦
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {             // 설치될 때: 앱 파일 보관
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {            // 새 버전이 켜질 때: 옛 보관함 지우기
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {             // pitex 파일: 새것 먼저 (브라우저 임시 보관도 건너뜀), 안 되면 보관해 둔 것
    e.respondWith(
      fetch(req, { cache: 'no-cache' })
        .then(res => { if (res.ok) caches.open(CACHE).then(c => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
    );
  } else if (url.hostname === 'cdnjs.cloudflare.com') {   // 그림·PDF 도구: 한 번 받으면 보관해 두고 씀 (버전이 정해져 있어 바뀌지 않음)
    e.respondWith(caches.open(CACHE).then(async c => (await c.match(req)) || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; })));
  }
});
