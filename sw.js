/* 서비스 워커 — 설치형 앱(PWA)과 오프라인 열람을 위한 최소 구현.
 *
 * 전략: 네트워크 우선, 실패하면 캐시.
 * 캐시 우선으로 하면 배포해도 옛 화면에 갇히는 사고가 나기 쉽다.
 * 이 사이트는 파일이 작아서 네트워크 우선으로도 충분히 빠르고, 오프라인은 캐시가 받쳐 준다.
 *
 * 배포할 때 index.html 의 ?v=N 과 함께 아래 VERSION 도 올린다.
 */
const VERSION = 'v3';
const CACHE = `cs-roadmap-${VERSION}`;

/* 첫 방문에서 곧바로 오프라인이 돼도 화면이 뜨도록 핵심 자원을 미리 담는다.
 * 도메인 파일까지 넣는 이유 — 하나라도 없으면 마인드맵이 비어 버린다. */
const PRECACHE = [
  './', './index.html', './css/style.css',
  './js/data.js', './js/paths.js', './js/mindmap.js', './js/app.js', './js/pwa.js',
  './js/domains/01-programming.js', './js/domains/02-datastructure.js',
  './js/domains/03-algorithm.js', './js/domains/04-architecture.js',
  './js/domains/05-os.js', './js/domains/06-network.js',
  './js/domains/07-database.js', './js/domains/08-engineering.js',
  './js/domains/09-theory.js', './js/domains/10-advanced.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .catch(() => {})            // 오프라인 설치 등 실패해도 진행
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // 외부 요청은 건드리지 않는다

  event.respondWith(
    fetch(req)
      .then(res => {
        // 정상 응답만 캐시에 복사해 둔다
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req, { ignoreSearch: true });
        if (hit) return hit;
        // 페이지 이동인데 캐시에도 없으면 앱 껍데기로 대체
        if (req.mode === 'navigate') {
          const shell = await caches.match('./index.html', { ignoreSearch: true });
          if (shell) return shell;
        }
        return Response.error();
      })
  );
});

// 페이지에서 즉시 갱신을 요청할 때
self.addEventListener('message', e => {
  if (e.data === 'skip-waiting') self.skipWaiting();
});
