const CACHE_NAME = 'fetal-health-v1';
const OFFLINE_URL = '/offline.html';
const urlsToCache = [
    '/',
    '/static/css/main.css',
    '/static/js/main.js',
    '/static/vendor/bootstrap/css/bootstrap.min.css',
    '/static/vendor/bootstrap/js/bootstrap.bundle.min.js',
    '/static/vendor/bootstrap-icons/bootstrap-icons.css',
    '/static/vendor/aos/aos.css',
    '/static/vendor/aos/aos.js',
    '/static/vendor/glightbox/css/glightbox.min.css',
    '/static/vendor/glightbox/js/glightbox.min.js',
    '/static/vendor/swiper/swiper-bundle.min.css',
    '/static/vendor/swiper/swiper-bundle.min.js',
    '/predict',
    '/static/manifest.json',
    OFFLINE_URL
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch event with network-first strategy for API calls
self.addEventListener('fetch', event => {
    if (event.request.url.includes('/output')) {
        // Network-first strategy for API calls
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request)
                        .then(response => {
                            if (response) {
                                return response;
                            }
                            return caches.match(OFFLINE_URL);
                        });
                })
        );
    } else {
        // Cache-first strategy for static assets
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request)
                        .then(response => {
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                            return response;
                        });
                })
        );
    }
});

// Background Sync for offline form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-predictions') {
        event.waitUntil(
            syncPredictions()
        );
    }
});

// Function to handle syncing predictions
async function syncPredictions() {
    try {
        const predictions = await getPendingPredictions();
        for (const prediction of predictions) {
            await fetch('/output', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(prediction)
            });
            await removePendingPrediction(prediction.id);
        }
    } catch (error) {
        console.error('Error syncing predictions:', error);
    }
}

// IndexedDB functions for storing offline predictions
const dbName = 'FetalHealthDB';
const storeName = 'pendingPredictions';

async function getPendingPredictions() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = () => resolve(getAllRequest.result);
            getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        
        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        };
    });
}

async function removePendingPrediction(id) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const deleteRequest = store.delete(id);
            
            deleteRequest.onsuccess = () => resolve();
            deleteRequest.onerror = () => reject(deleteRequest.error);
        };
    });
} 