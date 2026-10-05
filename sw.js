const CACHE_NAME = "sare-calendar-v2";
// واژه‌نامه‌ی ~۱ مگابایتیِ پاسبان (pasban-words.json) پیشاپیش ذخیره نمی‌شود؛
// با نخستین استفاده در حافظه‌ی نهان می‌نشیند.
const ASSETS = [
  "./",
  "./index.html",
  "./assets/style.css",
  "./assets/app.js",
  "./assets/events-data.js",
  "./assets/events-regional.js",
  "./assets/events-natural.js",
  "./assets/event-context.js",
  "./assets/history-facts.js",
  "./assets/proverbs.js",
  "./assets/persian-names.js",
  "./assets/vendor/jalaali.js",
  "./assets/fonts/Vazirmatn-Regular.woff2",
  "./assets/fonts/Vazirmatn-Medium.woff2",
  "./assets/fonts/Vazirmatn-SemiBold.woff2",
  "./assets/fonts/Vazirmatn-Bold.woff2",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// «از حافظه بخوان، در پس‌زمینه تازه کن»: برنامه آفلاین هم کار می‌کند و
// نگارش‌های تازه بدون دست‌بردن به نام حافظه به کاربر می‌رسند.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
