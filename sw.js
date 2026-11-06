/* دجرات: كاش للتشغيل السريع + إشعارات (محلية ودفع) */
const V = 'djrat-v6';
const CDN = /(^|\.)(cdn\.tailwindcss\.com|cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com|unpkg\.com)$/;
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(V).then(c => c.addAll(['./', 'icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// صفحة وملفات ثابتة: اعرض من الكاش فوراً ثم حدّثه في الخلفية (الدخول الثاني أسرع بكثير)
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  let u; try { u = new URL(r.url); } catch (_) { return; }
  if (/\.supabase\.(co|in)$/.test(u.hostname) || u.pathname.indexOf('/realtime') >= 0) return;
  if (u.origin !== location.origin && !CDN.test(u.hostname)) return;
  e.respondWith(caches.open(V).then(async c => {
    const hit = await c.match(r, { ignoreSearch: false });
    const net = fetch(r).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(r, res.clone()).catch(() => {}); return res; }).catch(() => hit);
    return hit || net;
  }));
});
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'دجرات', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'دجرات', Object.assign({ body: '', icon: 'icon-192.png', badge: 'icon-192.png', dir: 'rtl', lang: 'ar', data: d.data || {} }, d.options || {}, d.tag ? { tag: d.tag, renotify: true } : {})));
});
self.addEventListener('notificationclick', e => {
  const n = e.notification, d = n.data || {}, act = e.action || ''; n.close();
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (act === 'decline' && all.length === 0) return;
    const c = all.find(x => 'focus' in x) || null;
    if (c) { if (act !== 'decline') { try { await c.focus(); } catch (_) {} } c.postMessage({ type: 'notif', action: act, data: d }); return; }
    const url = d.peer ? './#/m/' + encodeURIComponent(d.peer) : './';
    await self.clients.openWindow(url);
  })());
});
