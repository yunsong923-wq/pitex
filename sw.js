/* pitex 오프라인 도우미 (service worker)
   - 앱 파일을 기기에 보관해 인터넷이 없어도 열리게 함
   - 열 때마다 새 버전이 있는지 뒤에서 확인하고, 있으면 다음에 열 때 새 버전이 보임 */
const CACHE = 'pitex-v2-2';                        // 버전을 바꾸면 보관함을 새로 만듦
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {             // 설치될 때: 앱 파일 보관
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {            // 새 버전이 켜질 때: 옛 보관함 지우기
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {               // 파일을 달라고 할 때: 보관함 것을 먼저 주고, 뒤에서 새것으로 갈아 둠
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const mine = url.origin === location.origin;
  const lib = url.hostname === 'cdnjs.cloudflare.com';   // 그림·PDF 도구도 한 번 받으면 보관
  if (!mine && !lib) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: mine });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});
