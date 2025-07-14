// js/modules/cache.js
// Sistema de caché inteligente para MuServerList

// =====================================================
// CONFIGURACIÓN DE CACHÉ
// =====================================================

const CACHE_CONFIG = {
    // Duraciones de caché en milisegundos
    HOMEPAGE_DATA: 5 * 60 * 1000,      // 5 minutos - datos de homepage
    SERVER_LIST: 3 * 60 * 1000,        // 3 minutos - lista de servidores
    SERVER_DETAIL: 10 * 60 * 1000,     // 10 minutos - detalles de servidor
    USER_PROFILE: 15 * 60 * 1000,      // 15 minutos - perfil de usuario
    RANKING_DATA: 2 * 60 * 1000,       // 2 minutos - datos de ranking
    CALENDAR_DATA: 5 * 60 * 1000,      // 5 minutos - calendario de aperturas
    GLOBAL_STATS: 10 * 60 * 1000,      // 10 minutos - estadísticas globales
    
    // Configuración general
    MAX_CACHE_SIZE: 50,                 // Máximo número de entradas en caché
    CLEANUP_INTERVAL: 30 * 60 * 1000,  // Limpieza cada 30 minutos
    VERSION: '1.0'                      // Versión del caché (para invalidar en actualizaciones)
};

// Prefijos para diferentes tipos de datos
const CACHE_PREFIXES = {
    HOMEPAGE: 'homepage_',
    SERVER: 'server_',
    USER: 'user_',
    LIST: 'list_',
    STATS: 'stats_'
};

// =====================================================
// CLASE PRINCIPAL DE CACHÉ
// =====================================================

class CacheManager {
    constructor() {
        this.isSupported = this.checkLocalStorageSupport();
        this.initCleanupTimer();
        this.logCacheInfo();
    }

    checkLocalStorageSupport() {
        try {
            const test = '__cache_test__';
            localStorage.setItem(test, 'test');
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            console.warn('🚨 localStorage no disponible, caché deshabilitado');
            return false;
        }
    }

    logCacheInfo() {
        if (this.isSupported) {
            console.log('✅ Sistema de caché inicializado');
            console.log('📊 Configuración de caché:', CACHE_CONFIG);
        }
    }

    // =====================================================
    // MÉTODOS PRINCIPALES DE CACHÉ
    // =====================================================

    /**
     * Obtiene datos del caché o ejecuta la función si no existe/expiró
     * @param {string} key - Clave única para el caché
     * @param {Function} fetchFunction - Función async que obtiene los datos
     * @param {number} duration - Duración del caché en ms
     * @returns {Promise} - Datos cacheados o frescos
     */
    async getCachedData(key, fetchFunction, duration = CACHE_CONFIG.HOMEPAGE_DATA) {
        if (!this.isSupported) {
            return await fetchFunction();
        }

        try {
            // Intentar obtener datos del caché
            const cached = this.get(key);
            if (cached && !this.isExpired(cached, duration)) {
                console.log(`🎯 Cache HIT para: ${key}`);
                return cached.data;
            }

            // Si no hay caché o expiró, obtener datos frescos
            console.log(`🔄 Cache MISS para: ${key}, obteniendo datos frescos...`);
            const freshData = await fetchFunction();
            
            // Guardar en caché
            this.set(key, freshData);
            
            return freshData;
        } catch (error) {
            console.error(`❌ Error en caché para ${key}:`, error);
            // En caso de error, intentar obtener datos directamente
            return await fetchFunction();
        }
    }

    /**
     * Guarda datos en el caché
     * @param {string} key - Clave única
     * @param {any} data - Datos a guardar
     */
    set(key, data) {
        if (!this.isSupported) return;

        try {
            const cacheEntry = {
                data: data,
                timestamp: Date.now(),
                version: CACHE_CONFIG.VERSION
            };

            localStorage.setItem(this.getCacheKey(key), JSON.stringify(cacheEntry));
            
            // Limpiar caché si está muy lleno
            this.cleanupIfNeeded();
        } catch (error) {
            console.warn(`⚠️ Error guardando en caché ${key}:`, error);
            // Si el localStorage está lleno, limpiar y reintentar
            if (error.name === 'QuotaExceededError') {
                this.clearExpired();
                try {
                    localStorage.setItem(this.getCacheKey(key), JSON.stringify(cacheEntry));
                } catch (retryError) {
                    console.error('❌ Error crítico de caché:', retryError);
                }
            }
        }
    }

    /**
     * Obtiene datos del caché
     * @param {string} key - Clave única
     * @returns {Object|null} - Datos cacheados o null
     */
    get(key) {
        if (!this.isSupported) return null;

        try {
            const cached = localStorage.getItem(this.getCacheKey(key));
            if (!cached) return null;

            const parsed = JSON.parse(cached);
            
            // Verificar versión del caché
            if (parsed.version !== CACHE_CONFIG.VERSION) {
                this.remove(key);
                return null;
            }

            return parsed;
        } catch (error) {
            console.warn(`⚠️ Error leyendo caché ${key}:`, error);
            this.remove(key);
            return null;
        }
    }

    /**
     * Verifica si una entrada de caché ha expirado
     * @param {Object} cacheEntry - Entrada de caché
     * @param {number} duration - Duración en ms
     * @returns {boolean} - true si expiró
     */
    isExpired(cacheEntry, duration) {
        return (Date.now() - cacheEntry.timestamp) > duration;
    }

    /**
     * Elimina una entrada específica del caché
     * @param {string} key - Clave a eliminar
     */
    remove(key) {
        if (!this.isSupported) return;
        localStorage.removeItem(this.getCacheKey(key));
    }

    /**
     * Invalida caché por patrón (ej: todos los servidores)
     * @param {string} pattern - Patrón a buscar
     */
    invalidatePattern(pattern) {
        if (!this.isSupported) return;

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes(pattern)) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`🗑️ Invalidadas ${keysToRemove.length} entradas con patrón: ${pattern}`);
    }

    // =====================================================
    // MÉTODOS DE LIMPIEZA Y MANTENIMIENTO
    // =====================================================

    /**
     * Limpia entradas expiradas del caché
     */
    clearExpired() {
        if (!this.isSupported) return;

        let removedCount = 0;
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('musl_cache_')) {
                try {
                    const cached = JSON.parse(localStorage.getItem(key));
                    // Usar duración máxima para limpieza general
                    if (this.isExpired(cached, CACHE_CONFIG.USER_PROFILE)) {
                        keysToRemove.push(key);
                    }
                } catch (error) {
                    // Si no se puede parsear, eliminar
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            removedCount++;
        });

        if (removedCount > 0) {
            console.log(`🧹 Limpieza de caché: ${removedCount} entradas eliminadas`);
        }
    }

    /**
     * Limpia el caché si está muy lleno
     */
    cleanupIfNeeded() {
        const cacheKeys = this.getCacheKeys();
        if (cacheKeys.length > CACHE_CONFIG.MAX_CACHE_SIZE) {
            console.log('🚨 Caché lleno, iniciando limpieza...');
            this.clearExpired();
        }
    }

    /**
     * Obtiene todas las claves de caché
     * @returns {Array} - Array de claves de caché
     */
    getCacheKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('musl_cache_')) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * Genera clave de caché con prefijo
     * @param {string} key - Clave original
     * @returns {string} - Clave con prefijo
     */
    getCacheKey(key) {
        return `musl_cache_${key}`;
    }

    /**
     * Inicializa timer de limpieza automática
     */
    initCleanupTimer() {
        if (!this.isSupported) return;

        setInterval(() => {
            this.clearExpired();
        }, CACHE_CONFIG.CLEANUP_INTERVAL);
    }

    /**
     * Obtiene estadísticas del caché
     * @returns {Object} - Estadísticas del caché
     */
    getStats() {
        if (!this.isSupported) return { supported: false };

        const keys = this.getCacheKeys();
        let totalSize = 0;
        let expiredCount = 0;

        keys.forEach(key => {
            try {
                const value = localStorage.getItem(key);
                totalSize += value.length;
                
                const cached = JSON.parse(value);
                if (this.isExpired(cached, CACHE_CONFIG.USER_PROFILE)) {
                    expiredCount++;
                }
            } catch (error) {
                expiredCount++;
            }
        });

        return {
            supported: true,
            totalEntries: keys.length,
            expiredEntries: expiredCount,
            totalSizeKB: Math.round(totalSize / 1024),
            maxEntries: CACHE_CONFIG.MAX_CACHE_SIZE
        };
    }

    /**
     * Limpia todo el caché
     */
    clearAll() {
        if (!this.isSupported) return;

        const keys = this.getCacheKeys();
        keys.forEach(key => localStorage.removeItem(key));
        console.log(`🗑️ Caché completamente limpiado: ${keys.length} entradas eliminadas`);
    }
}

// =====================================================
// INSTANCIA GLOBAL Y FUNCIONES DE CONVENIENCIA
// =====================================================

// Crear instancia global del caché
const cacheManager = new CacheManager();

// Funciones de conveniencia para diferentes tipos de datos
export const cache = {
    // Datos de homepage
    getHomepageData: (fetchFn) => cacheManager.getCachedData(
        `${CACHE_PREFIXES.HOMEPAGE}data`, 
        fetchFn, 
        CACHE_CONFIG.HOMEPAGE_DATA
    ),

    // Detalles de servidor
    getServerData: (serverId, fetchFn) => cacheManager.getCachedData(
        `${CACHE_PREFIXES.SERVER}${serverId}`, 
        fetchFn, 
        CACHE_CONFIG.SERVER_DETAIL
    ),

    // Perfil de usuario
    getUserProfile: (userId, fetchFn) => cacheManager.getCachedData(
        `${CACHE_PREFIXES.USER}${userId}`, 
        fetchFn, 
        CACHE_CONFIG.USER_PROFILE
    ),

    // Lista de servidores con filtros - VERSIÓN MEJORADA
    getServerList: async (filterHash, fetchFn) => {
        const cacheKey = `${CACHE_PREFIXES.LIST}servers_${filterHash}`;

        // Verificar si ya existe en caché
        const cached = cacheManager.get(cacheKey);
        if (cached && !cacheManager.isExpired(cached, CACHE_CONFIG.SERVER_LIST)) {
            console.log(`🎯 Cache HIT para filtros: ${filterHash}`);
            return cached.data;
        }

        // Si no hay caché o expiró, obtener datos frescos
        console.log(`🔄 Cache MISS para filtros: ${filterHash}, obteniendo datos frescos...`);
        const freshData = await fetchFn();

        // Guardar en caché con clave específica
        cacheManager.set(cacheKey, freshData);

        return freshData;
    },

    // Datos de ranking
    getRankingData: (type, page, fetchFn) => cacheManager.getCachedData(
        `${CACHE_PREFIXES.STATS}ranking_${type}_${page}`, 
        fetchFn, 
        CACHE_CONFIG.RANKING_DATA
    ),

    // Datos de calendario
    getCalendarData: (fetchFn) => cacheManager.getCachedData(
        `${CACHE_PREFIXES.LIST}calendar`, 
        fetchFn, 
        CACHE_CONFIG.CALENDAR_DATA
    ),

    // Métodos de utilidad
    invalidateServer: (serverId) => cacheManager.remove(`${CACHE_PREFIXES.SERVER}${serverId}`),
    invalidateUser: (userId) => cacheManager.remove(`${CACHE_PREFIXES.USER}${userId}`),
    invalidateHomepage: () => cacheManager.remove(`${CACHE_PREFIXES.HOMEPAGE}data`),
    invalidateServerLists: () => cacheManager.invalidatePattern(CACHE_PREFIXES.LIST),
    
    // Estadísticas y limpieza
    getStats: () => cacheManager.getStats(),
    clearExpired: () => cacheManager.clearExpired(),
    clearAll: () => cacheManager.clearAll()
};

// Exportar también el manager para uso avanzado
export { cacheManager, CACHE_CONFIG, CACHE_PREFIXES };

// Log de inicialización
console.log('🚀 Módulo de caché cargado exitosamente');
