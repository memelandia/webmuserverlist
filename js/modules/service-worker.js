// js/modules/service-worker.js
// Gestión del Service Worker para MuServerList

// =====================================================
// CONFIGURACIÓN Y ESTADO
// =====================================================

let swRegistration = null;
let swController = null;
let updateAvailable = false;

const SW_CONFIG = {
    scriptUrl: '/sw.js',
    scope: '/',
    updateCheckInterval: 60000, // 1 minuto
    showUpdateNotifications: true
};

// =====================================================
// REGISTRO DEL SERVICE WORKER
// =====================================================

// Registrar Service Worker
export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('⚠️ Service Worker no soportado en este navegador');
        return false;
    }

    try {
        console.log('🔧 Registrando Service Worker...');
        
        swRegistration = await navigator.serviceWorker.register(SW_CONFIG.scriptUrl, {
            scope: SW_CONFIG.scope
        });

        console.log('✅ Service Worker registrado:', swRegistration.scope);

        // Configurar event listeners
        setupServiceWorkerListeners();
        
        // Verificar si hay un SW controlando la página
        if (navigator.serviceWorker.controller) {
            swController = navigator.serviceWorker.controller;
            console.log('🎮 Service Worker activo y controlando la página');
        }

        // Verificar actualizaciones periódicamente
        if (SW_CONFIG.updateCheckInterval > 0) {
            setInterval(checkForUpdates, SW_CONFIG.updateCheckInterval);
        }

        return true;
    } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
        return false;
    }
}

// Configurar listeners del Service Worker
function setupServiceWorkerListeners() {
    if (!swRegistration) return;

    // Nuevo Service Worker instalado
    swRegistration.addEventListener('updatefound', () => {
        const newWorker = swRegistration.installing;
        console.log('🔄 Nueva versión del Service Worker encontrada');

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                updateAvailable = true;
                console.log('📦 Actualización disponible');
                
                if (SW_CONFIG.showUpdateNotifications) {
                    showUpdateNotification();
                }
            }
        });
    });

    // Service Worker tomó control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        swController = navigator.serviceWorker.controller;
        console.log('🎮 Nuevo Service Worker tomó control');
        
        // Recargar página si había una actualización pendiente
        if (updateAvailable) {
            window.location.reload();
        }
    });

    // Mensajes del Service Worker
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
}

// =====================================================
// GESTIÓN DE ACTUALIZACIONES
// =====================================================

// Verificar si hay actualizaciones disponibles
export async function checkForUpdates() {
    if (!swRegistration) return false;

    try {
        await swRegistration.update();
        return true;
    } catch (error) {
        console.error('Error verificando actualizaciones:', error);
        return false;
    }
}

// Aplicar actualización disponible
export async function applyUpdate() {
    if (!updateAvailable || !swRegistration || !swRegistration.waiting) {
        return false;
    }

    try {
        // Enviar mensaje al SW para que se active
        swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        return true;
    } catch (error) {
        console.error('Error aplicando actualización:', error);
        return false;
    }
}

// Mostrar notificación de actualización
function showUpdateNotification() {
    // Crear notificación personalizada
    const notification = document.createElement('div');
    notification.className = 'sw-update-notification';
    notification.innerHTML = `
        <div class="sw-notification-content">
            <div class="sw-notification-icon">🔄</div>
            <div class="sw-notification-text">
                <strong>Actualización disponible</strong>
                <p>Una nueva versión de MuServerList está lista.</p>
            </div>
            <div class="sw-notification-actions">
                <button class="sw-btn sw-btn-primary" onclick="window.swManager.applyUpdate()">
                    Actualizar
                </button>
                <button class="sw-btn sw-btn-secondary" onclick="this.closest('.sw-update-notification').remove()">
                    Más tarde
                </button>
            </div>
        </div>
    `;

    // Añadir estilos si no existen
    if (!document.getElementById('sw-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'sw-notification-styles';
        styles.textContent = `
            .sw-update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--bg-light, #1a1a1a);
                border: 1px solid var(--border-color, #333);
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                max-width: 350px;
                animation: slideIn 0.3s ease-out;
            }
            
            .sw-notification-content {
                display: flex;
                align-items: flex-start;
                gap: 12px;
            }
            
            .sw-notification-icon {
                font-size: 24px;
                flex-shrink: 0;
            }
            
            .sw-notification-text {
                flex: 1;
                color: var(--text-primary, #f5f5f5);
            }
            
            .sw-notification-text strong {
                color: var(--primary-color, #ff3333);
                display: block;
                margin-bottom: 4px;
            }
            
            .sw-notification-text p {
                margin: 0;
                font-size: 14px;
                color: var(--text-secondary, #aaa);
            }
            
            .sw-notification-actions {
                display: flex;
                gap: 8px;
                margin-top: 12px;
            }
            
            .sw-btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                font-weight: 500;
            }
            
            .sw-btn-primary {
                background: var(--primary-color, #ff3333);
                color: white;
            }
            
            .sw-btn-secondary {
                background: var(--bg-contrast, #252525);
                color: var(--text-primary, #f5f5f5);
                border: 1px solid var(--border-color, #333);
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Auto-remover después de 10 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

// =====================================================
// COMUNICACIÓN CON SERVICE WORKER
// =====================================================

// Enviar mensaje al Service Worker
export async function sendMessageToSW(message) {
    if (!swController) {
        console.warn('No hay Service Worker controlando la página');
        return null;
    }

    return new Promise((resolve, reject) => {
        const messageChannel = new MessageChannel();
        
        messageChannel.port1.onmessage = (event) => {
            resolve(event.data);
        };

        setTimeout(() => {
            reject(new Error('Timeout esperando respuesta del Service Worker'));
        }, 5000);

        swController.postMessage(message, [messageChannel.port2]);
    });
}

// Manejar mensajes del Service Worker
function handleServiceWorkerMessage(event) {
    const { type, data } = event.data;
    
    switch (type) {
        case 'CACHE_UPDATED':
            console.log('📦 Caché actualizado:', data);
            break;
        case 'OFFLINE_READY':
            console.log('📡 Funcionalidad offline lista');
            break;
        default:
            console.log('📨 Mensaje del SW:', event.data);
    }
}

// =====================================================
// GESTIÓN DE CACHÉ
// =====================================================

// Obtener información del caché
export async function getCacheInfo() {
    try {
        return await sendMessageToSW({ type: 'GET_CACHE_INFO' });
    } catch (error) {
        console.error('Error obteniendo info del caché:', error);
        return null;
    }
}

// Limpiar caché
export async function clearCache() {
    try {
        const result = await sendMessageToSW({ type: 'CLEAR_CACHE' });
        return result?.success || false;
    } catch (error) {
        console.error('Error limpiando caché:', error);
        return false;
    }
}

// Cachear URLs específicas
export async function cacheUrls(urls) {
    try {
        const result = await sendMessageToSW({ 
            type: 'CACHE_URLS', 
            data: { urls } 
        });
        return result?.success || false;
    } catch (error) {
        console.error('Error cacheando URLs:', error);
        return false;
    }
}

// =====================================================
// UTILIDADES
// =====================================================

// Verificar si Service Worker está activo
export function isServiceWorkerActive() {
    return swController !== null;
}

// Verificar si hay actualización disponible
export function isUpdateAvailable() {
    return updateAvailable;
}

// Obtener estado del Service Worker
export function getServiceWorkerState() {
    return {
        supported: 'serviceWorker' in navigator,
        registered: swRegistration !== null,
        active: swController !== null,
        updateAvailable: updateAvailable,
        scope: swRegistration?.scope || null
    };
}

// =====================================================
// INICIALIZACIÓN AUTOMÁTICA
// =====================================================

// Auto-registrar cuando se carga el módulo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerServiceWorker);
} else {
    registerServiceWorker();
}

// Exponer funciones globalmente para debugging
if (typeof window !== 'undefined') {
    window.swManager = {
        register: registerServiceWorker,
        checkForUpdates,
        applyUpdate,
        getCacheInfo,
        clearCache,
        cacheUrls,
        getState: getServiceWorkerState
    };
}

// Exportar funciones principales
export {
    registerServiceWorker,
    checkForUpdates,
    applyUpdate,
    getCacheInfo,
    clearCache,
    cacheUrls,
    isServiceWorkerActive,
    isUpdateAvailable,
    getServiceWorkerState
};

console.log('🔧 Módulo Service Worker cargado');
