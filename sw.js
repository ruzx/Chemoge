// Service worker: офлайн-работа.
// Код и стили — «сначала кэш, затем обновление в фоне»; контент и страница — «сначала сеть».
// Новые модули из content/manifest.json кэшируются автоматически, менять этот файл не нужно.
const CACHE = 'chem-oge-v2';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest',
  'assets/css/style.css',
  'assets/js/app.js',
  'assets/js/lib/ui.js', 'assets/js/lib/store.js', 'assets/js/lib/content.js', 'assets/js/lib/chem.js',
  'assets/js/lib/quiz.js', 'assets/js/lib/blocks.js', 'assets/js/lib/flash.js', 'assets/js/lib/sync.js', 'assets/js/lib/game.js', 'assets/js/lib/session.js', 'assets/js/lib/widgets.js', 'assets/js/lib/path.js',
  'assets/js/views/home.js', 'assets/js/views/module.js', 'assets/js/views/practice.js', 'assets/js/views/review.js',
  'assets/js/views/cards.js', 'assets/js/views/lab.js', 'assets/js/views/exp.js', 'assets/js/views/cheats.js',
  'assets/js/views/board.js', 'assets/js/views/progress.js', 'assets/js/views/lesson.js', 'assets/js/views/blitz.js',
  'assets/icons/icon-192.png', 'assets/icons/icon-512.png',
  'content/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    try {
      const m = await (await fetch('content/manifest.json', { cache: 'no-cache' })).json();
      await c.addAll(m.modules.map(id => `content/modules/${id}.json`));
    } catch {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const networkFirst = e.request.mode === 'navigate' || url.pathname.includes('/content/') || url.pathname.endsWith('.json');
  e.respondWith(networkFirst ? netFirst(e.request) : cacheFirst(e.request));
});

async function netFirst(req) {
  const c = await caches.open(CACHE);
  try {
    const res = await fetch(req, { cache: 'no-cache' });
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch {
    return (await c.match(req, { ignoreSearch: true })) || (await c.match('index.html'));
  }
}

async function cacheFirst(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req, { ignoreSearch: true });
  const update = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await update) || new Response('', { status: 504 });
}
