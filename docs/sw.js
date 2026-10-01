// Service worker for Défi 99.
//
// Every piece of the user's data already lives on the phone (localStorage),
// so there was never a server reason to need the network — yet without a
// worker, opening the app offline depended on the HTTP cache, which GitHub
// Pages caps at ten minutes of freshness and iOS evicts freely. A habit
// tracker opened first thing in the morning, sometimes underground, has to
// open every time.
//
// The trap to avoid is the one this app already fought once: iOS standalone
// serving a stale copy long after a deploy (see checkForUpdate in index.ts).
// A careless worker makes that far worse, so the rules are narrow:
//
//   - The page itself goes to the network first, every time. The cache is
//     only a fallback for when there is no network at all. A deploy still
//     shows up on the next open, exactly as before.
//   - Everything under /_expo/static/ and /assets/ carries a content hash
//     in its filename, so a cached copy can never be the wrong version.
//     Those are served from cache first: that's the 2.9 MB bundle no longer
//     being fetched on every open.
//   - The cached page and its bundle only ever change together. A page
//     whose bundle failed to download is never stored, or an offline open
//     would load HTML pointing at a script that isn't there.
//   - Anything cross-origin (Firebase, AI endpoints, map tiles) is left
//     alone entirely.

const CACHE = 'defi99-v1';
const SCOPE = new URL(self.registration.scope).pathname; // "/sixty-six-challenge/"
const BUNDLE = /_expo\/static\/js\/web\/index-[a-f0-9]+\.js/;

const isShell = (url) => url.pathname === SCOPE || url.pathname === SCOPE + 'index.html';
// /splash/ holds the launch logo and iOS startup images. Their names carry a
// version instead of a hash (the HTML has to reference them by a fixed
// path), so a new logo ships as logo-v2.png rather than overwriting v1.
const isImmutable = (url) =>
  url.pathname.startsWith(SCOPE + '_expo/static/') ||
  url.pathname.startsWith(SCOPE + 'assets/') ||
  url.pathname.startsWith(SCOPE + 'splash/');

// Stores a page only once the bundle it points at is safely stored too, then
// drops every other bundle — each deploy would otherwise leave 2.9 MB behind.
async function cacheShell(response) {
  const cache = await caches.open(CACHE);
  const html = await response.clone().text();
  const match = html.match(BUNDLE);
  if (!match) return;
  const bundleUrl = new URL(SCOPE + match[0], self.location.origin).href;

  if (!(await cache.match(bundleUrl))) {
    const bundle = await fetch(bundleUrl).catch(() => null);
    if (!bundle || !bundle.ok) return; // keep the previous, consistent pair
    await cache.put(bundleUrl, bundle);
  }
  await cache.put(new URL(SCOPE, self.location.origin).href, response);

  for (const req of await cache.keys()) {
    if (BUNDLE.test(req.url) && req.url !== bundleUrl) await cache.delete(req);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    fetch(SCOPE, { cache: 'no-store' })
      .then((res) => (res.ok ? cacheShell(res) : undefined))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(SCOPE)) return;

  if (request.mode === 'navigate' || isShell(url)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) event.waitUntil(cacheShell(res.clone()));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(new URL(SCOPE, self.location.origin).href);
          return cached || Response.error();
        })
    );
    return;
  }

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              event.waitUntil(caches.open(CACHE).then((c) => c.put(request, copy)));
            }
            return res;
          })
      )
    );
  }
});

// The fonts and images the first session loaded were fetched before this
// worker was in control, so it never saw them. The page sends their URLs
// once the worker is ready, which makes the very first install fully usable
// offline instead of only from the second open onwards.
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'warm' || !Array.isArray(event.data.urls)) return;
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        event.data.urls
          .map((u) => new URL(u))
          .filter((u) => u.origin === self.location.origin && isImmutable(u))
          .map((u) =>
            cache.match(u.href).then((hit) => hit || cache.add(u.href).catch(() => {}))
          )
      )
    )
  );
});
