// sw.js - Service Worker para MuServerList
// Proporciona caché offline y mejora el rendimiento

// =====================================================
// CONFIGURACIÓN DEL SERVICE WORKER
// =====================================================

const CACHE_NAME = 'muserverlist-v1.0.0';
const OFFLINE_PAGE = '/offline.html';

// Recursos críticos para cachear inmediatamente
const CRITICAL_RESOURCES = [
    '/',
    '/index.html',
    '/explorar.html',
    '/ranking.html',
    '/calendario.html',
    '/css/style.css',
    '/js/main.js',
    '/js/modules/api.js',
    '/js/modules/ui.js',
    '/js/modules/utils.js',
    '/js/modules/cache.js',
    '/js/modules/lazy-loading.js',
    '/js/modules/webp-support.js',
    '/js/supabase-init.js',
    '/img/logo.png',
    '/img/logo_placeholder_small.png',
    '/img/banner_placeholder.png',
    '/img/avatar_default.png',
    OFFLINE_PAGE
];

// Recursos que se cachean bajo demanda
const CACHE_ON_DEMAND = [
    '/servidor.html',
    '/profile.html',
    '/agregar.html',
    '/js/explorar.js',
    '/js/ranking.js',
    '/js/calendario.js',
    '/js/profile.js'
];

// Patrones de URLs para diferentes estrategias de caché
const CACHE_STRATEGIES = {
    // Caché primero para recursos estáticos
    CACHE_FIRST: [
        /\.css$/,
        /\.js$/,
        /\.png$/,
        /\.jpg$/,
        /\.jpeg$/,
        /\.gif$/,
        /\.webp$/,
        /\.svg$/,
        /\.ico$/,
        /\.woff$/,
        /\.woff2$/,
        /\.ttf$/
    ],
    
    // Red primero para contenido dinámico
    NETWORK_FIRST: [
        /\/api\//,
        /supabase/,
        /\.json$/
    ],
    
    // Solo caché para páginas offline
    CACHE_ONLY: [
        /\/offline\.html$/
    ]
};

// =====================================================
// EVENTOS DEL SERVICE WORKER
// =====================================================

// Instalación del Service Worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Cacheando recursos críticos...');
                return cache.addAll(CRITICAL_RESOURCES);
            })
            .then(() => {
                console.log('✅ Service Worker: Instalación completada');
                // Forzar activación inmediata
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Error en instalación:', error);
            })
    );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activando...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                // Limpiar cachés antiguos
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Eliminando caché antiguo:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Activación completada');
                // Tomar control de todas las pestañas inmediatamente
                return self.clients.claim();
            })
            .catch((error) => {
                console.error('❌ Service Worker: Error en activación:', error);
            })
    );
});

// Interceptar peticiones de red
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Solo manejar peticiones HTTP/HTTPS
    if (!request.url.startsWith('http')) return;
    
    // Determinar estrategia de caché
    const strategy = getCacheStrategy(request);
    
    event.respondWith(
        handleRequest(request, strategy)
            .catch((error) => {
                console.error('❌ Service Worker: Error manejando petición:', error);
                return handleOffline(request);
            })
    );
});

// =====================================================
// ESTRATEGIAS DE CACHÉ
// =====================================================

// Determinar qué estrategia usar para una petición
function getCacheStrategy(request) {
    const url = request.url;
    
    // Cache Only
    if (CACHE_STRATEGIES.CACHE_ONLY.some(pattern => pattern.test(url))) {
        return 'cache-only';
    }
    
    // Network First
    if (CACHE_STRATEGIES.NETWORK_FIRST.some(pattern => pattern.test(url))) {
        return 'network-first';
    }
    
    // Cache First (por defecto para recursos estáticos)
    if (CACHE_STRATEGIES.CACHE_FIRST.some(pattern => pattern.test(url))) {
        return 'cache-first';
    }
    
    // Stale While Revalidate para páginas HTML
    if (request.destination === 'document') {
        return 'stale-while-revalidate';
    }
    
    // Network First por defecto
    return 'network-first';
}

// Manejar petición según estrategia
async function handleRequest(request, strategy) {
    switch (strategy) {
        case 'cache-first':
            return cacheFirst(request);
        case 'network-first':
            return networkFirst(request);
        case 'cache-only':
            return cacheOnly(request);
        case 'stale-while-revalidate':
            return staleWhileRevalidate(request);
        default:
            return networkFirst(request);
    }
}

// Estrategia: Cache First
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    // Cachear respuesta exitosa
    if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
}

// Estrategia: Network First
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        // Cachear respuesta exitosa
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        // Si falla la red, intentar caché
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Estrategia: Cache Only
async function cacheOnly(request) {
    const cache = await caches.open(CACHE_NAME);
    return cache.match(request);
}

// Estrategia: Stale While Revalidate
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // Actualizar caché en segundo plano
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    });
    
    // Devolver caché inmediatamente si existe, sino esperar red
    return cachedResponse || fetchPromise;
}

// =====================================================
// MANEJO OFFLINE
// =====================================================

// Manejar peticiones cuando no hay conexión
async function handleOffline(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // Para páginas HTML, mostrar página offline
    if (request.destination === 'document') {
        const offlinePage = await cache.match(OFFLINE_PAGE);
        if (offlinePage) {
            return offlinePage;
        }
    }
    
    // Para imágenes, devolver placeholder
    if (request.destination === 'image') {
        const placeholder = await cache.match('/img/logo_placeholder_small.png');
        if (placeholder) {
            return placeholder;
        }
    }
    
    // Intentar encontrar algo en caché
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    // Respuesta offline genérica
    return new Response(
        JSON.stringify({
            error: 'Offline',
            message: 'No hay conexión a internet y el recurso no está en caché'
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'application/json' }
        }
    );
}

// =====================================================
// MENSAJES DESDE LA APLICACIÓN
// =====================================================

// Escuchar mensajes desde la aplicación principal
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_CACHE_INFO':
            getCacheInfo().then((info) => {
                event.ports[0].postMessage(info);
            });
            break;
            
        case 'CLEAR_CACHE':
            clearCache().then((success) => {
                event.ports[0].postMessage({ success });
            });
            break;
            
        case 'CACHE_URLS':
            cacheUrls(data.urls).then((success) => {
                event.ports[0].postMessage({ success });
            });
            break;
    }
});

// Obtener información del caché
async function getCacheInfo() {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    
    let totalSize = 0;
    const urls = [];
    
    for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
            urls.push(request.url);
        }
    }
    
    return {
        cacheName: CACHE_NAME,
        totalSize,
        itemCount: keys.length,
        urls
    };
}

// Limpiar caché
async function clearCache() {
    try {
        await caches.delete(CACHE_NAME);
        return true;
    } catch (error) {
        console.error('Error limpiando caché:', error);
        return false;
    }
}

// Cachear URLs específicas
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urls);
        return true;
    } catch (error) {
        console.error('Error cacheando URLs:', error);
        return false;
    }
}

// =====================================================
// NOTIFICACIONES PUSH (FUTURO)
// =====================================================

// Preparado para notificaciones push futuras
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: '/img/logo.png',
        badge: '/img/logo.png',
        data: data.data || {}
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

console.log('🔧 Service Worker: Cargado y listo');
