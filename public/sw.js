// public/sw.js
const CACHE_NAME = 'jora-messenger-v2';
// 🛑 Muhim: PWA o'rnatilishi uchun Chrome shu fayllarni keshlay olishi shart
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// O'rnatish bosqichi (Kesh yaratish)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

// Faollashtirish bosqichi (Eski keshlarni tozalash)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 🔴 3. PWA INSTALL TALABI: FETCH HODISASI
// Chrome sayt offline bo'lganda keshdan malumot qayta oladimi, shuni tekshiradi.
self.addEventListener('fetch', (event) => {
  // PWA qoidasi: Agar tarmoq ishlamasa, keshni qaytar, bo'lmasa tarmoqdan yukla.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// 🔴 1. LOKAL NODE SERVERDAN KELGAN PUSH SIGNALNI FONDA TUTISH
self.addEventListener('push', function (event) {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    
    const title = payload.title || "Jora Messenger";
    const options = {
      body: payload.body || "Yangi xabar keldi",
      icon: payload.icon || "/icon-192.png",
      badge: "/icon-192.png", 
      vibrate: [120, 60, 120], 
      data: {
        url: payload.url || "/chat"
      },
      tag: 'jora-group-message',
      renotify: true
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error("Fon rejimida Push chizishda xatolik:", error);
  }
});

// 🔴 2. NOTIFICATION BANNERI BOSILGANDA APP-NI UYG'OTISH
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes('/chat') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});