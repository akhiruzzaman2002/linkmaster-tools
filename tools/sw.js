// LinkMaster Service Worker v1.0
const CACHE_NAME = 'linkmaster-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/tools/url-shortener.html',
  '/tools/qr-generator.html',
  '/tools/bio-links.html',
  '/tools/link-tracking.html'
];

// Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🔧 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch Event - Serve from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          console.log('💾 Service Worker: Serving from cache', event.request.url);
          return cachedResponse;
        }

        // Otherwise fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Check if valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // Clone the response
            const responseToCache = networkResponse.clone();

            // Cache the new response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('➕ Service Worker: Cached new resource', event.request.url);
              });

            return networkResponse;
          })
          .catch((error) => {
            console.error('🌐 Service Worker: Network request failed', error);
            
            // For HTML requests, return offline page
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/index.html');
            }
            
            // Simple offline fallback
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>LinkMaster - অফলাইন</title>
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      text-align: center; 
                      padding: 50px; 
                      background: #f0f2f5;
                    }
                    .offline-container { 
                      background: white; 
                      padding: 40px; 
                      border-radius: 10px; 
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    h1 { color: #666; }
                    p { color: #888; }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <h1>📡 আপনি অফলাইনে আছেন</h1>
                    <p>ইন্টারনেট কানেকশন পুনরুদ্ধার হলে আবার চেষ্টা করুন</p>
                    <button onclick="location.reload()">🔄 রিলোড করুন</button>
                  </div>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
      })
  );
});

// Background Sync for offline data
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'linkmaster-sync') {
    event.waitUntil(
      syncOfflineData()
    );
  }
});

// Push Notification Support
self.addEventListener('push', (event) => {
  console.log('📢 Service Worker: Push notification received');
  
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'LinkMaster থেকে নতুন নোটিফিকেশন',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiByeD0iMTUiIGZpbGw9IiMyNTYzZWIiLz4KPHRleHQgeD0iNDgiIHk9IjYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIj7inIs8L3RleHQ+Cjwvc3ZnPgo=',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzIiIGhlaWdodD0iNzIiIHZpZXdCb3g9IjAgMCA3MiA3MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcyIiBoZWlnaHQ9IjcyIiByeD0iMTAiIGZpbGw9IiMyNTYzZWIiLz4KPC9zdmc+Cg==',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'খুলুন'
      },
      {
        action: 'dismiss',
        title: 'বন্ধ করুন'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'LinkMaster', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else if (event.action === 'dismiss') {
    // Notification dismissed
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message Handler from Main Thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: '1.0.0' });
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        cacheUrls(event.data.urls)
      );
      break;
  }
});

// Helper Functions
async function syncOfflineData() {
  try {
    console.log('🔄 Service Worker: Syncing offline data...');
    
    // Get offline data from localStorage (simulated)
    const offlineData = getOfflineData();
    
    if (offlineData.length > 0) {
      // Simulate syncing each item
      for (const item of offlineData) {
        await syncItem(item);
      }
      
      // Clear synced data
      clearOfflineData();
      console.log('✅ Service Worker: Offline data synced successfully');
    }
  } catch (error) {
    console.error('❌ Service Worker: Sync failed', error);
  }
}

function getOfflineData() {
  // Simulate getting offline data
  return JSON.parse(localStorage.getItem('linkmaster_offline_data') || '[]');
}

function clearOfflineData() {
  // Simulate clearing offline data
  localStorage.removeItem('linkmaster_offline_data');
}

async function syncItem(item) {
  // Simulate syncing an item to server
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('📤 Service Worker: Synced item', item);
      resolve();
    }, 1000);
  });
}

async function cacheUrls(urls) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls);
    console.log('✅ Service Worker: URLs cached successfully');
  } catch (error) {
    console.error('❌ Service Worker: URL caching failed', error);
  }
}

// Periodic Background Sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'content-update') {
      console.log('🔄 Service Worker: Periodic sync triggered');
      event.waitUntil(updateContent());
    }
  });
}

async function updateContent() {
  try {
    console.log('🔄 Service Worker: Updating content...');
    
    const cache = await caches.open(CACHE_NAME);
    
    // Update each static asset
    for (const url of STATIC_ASSETS) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('✅ Service Worker: Updated', url);
        }
      } catch (error) {
        console.error('❌ Service Worker: Failed to update', url, error);
      }
    }
  } catch (error) {
    console.error('❌ Service Worker: Content update failed', error);
  }
}

// Service Worker ready log
console.log('🚀 LinkMaster Service Worker loaded successfully!');
