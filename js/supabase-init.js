// js/supabase-init.js

const SUPABASE_URL = 'https://bqipsuaxtkhcwtjawtpy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxaXBzdWF4dGtoY3d0amF3dHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNTcyNjIsImV4cCI6MjA2NjkzMzI2Mn0.XVbUzRExUXVGCu4WFS_qYSQrNFSXVKPCB2rqgvlNmeo';

// === MONITOREO DE RED EN TIEMPO REAL ===
function createNetworkMonitor() {
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    if (!isProduction) {
        return { log: () => {}, testConnection: () => Promise.resolve(true) };
    }

    return {
        log: (event, data = {}) => {
            console.log(`🌐 [NETWORK MONITOR] ${event}:`, {
                timestamp: new Date().toISOString(),
                hostname: window.location.hostname,
                userAgent: navigator.userAgent.substring(0, 100),
                online: navigator.onLine,
                connection: navigator.connection?.effectiveType || 'unknown',
                ...data
            });
        },

        testConnection: async () => {
            try {
                const startTime = performance.now();
                const response = await fetch(SUPABASE_URL + '/rest/v1/', {
                    method: 'HEAD',
                    headers: {
                        'apikey': SUPABASE_KEY,
                        'Authorization': `Bearer ${SUPABASE_KEY}`
                    }
                });
                const endTime = performance.now();

                const connectionTest = {
                    success: response.ok,
                    status: response.status,
                    latency: Math.round(endTime - startTime),
                    headers: Object.fromEntries(response.headers.entries())
                };

                console.log('🔗 [CONNECTION TEST]:', connectionTest);
                return connectionTest.success;
            } catch (error) {
                console.error('❌ [CONNECTION TEST FAILED]:', error);
                return false;
            }
        }
    };
}

// Crear monitor de red
const networkMonitor = createNetworkMonitor();

try {
    networkMonitor.log('SUPABASE_INIT_START', {
        url: SUPABASE_URL,
        keyLength: SUPABASE_KEY.length
    });

    // Configuración optimizada para Vercel
    const supabaseConfig = {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            // Configuración específica para Vercel
            storage: window.localStorage,
            storageKey: 'sb-auth-token',
            // Headers adicionales para Vercel
            headers: {
                'x-client-info': 'webmuserverlist-vercel'
            }
        },
        global: {
            // Configuración de fetch optimizada para Vercel
            fetch: (url, options = {}) => {
                const enhancedOptions = {
                    ...options,
                    headers: {
                        'User-Agent': 'webmuserverlist-vercel',
                        'x-client-info': 'webmuserverlist-vercel',
                        ...options.headers
                    }
                };

                networkMonitor.log('FETCH_REQUEST', {
                    url: url.toString(),
                    method: enhancedOptions.method || 'GET',
                    hasAuth: !!enhancedOptions.headers?.Authorization
                });

                return fetch(url, enhancedOptions);
            }
        }
    };

    // Crear cliente con configuración optimizada
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, supabaseConfig);

    networkMonitor.log('SUPABASE_CLIENT_CREATED');

    // Test de conexión inicial
    networkMonitor.testConnection().then(connected => {
        if (connected) {
            networkMonitor.log('INITIAL_CONNECTION_SUCCESS');
            console.log('✅ Cliente Supabase inicializado GLOBALMENTE con monitoreo de red.');
        } else {
            networkMonitor.log('INITIAL_CONNECTION_FAILED');
            console.warn('⚠️ Cliente Supabase inicializado pero la conexión inicial falló.');
        }
    });

    // Exponer monitor para debugging
    window.networkMonitor = networkMonitor;

} catch (error) {
    networkMonitor.log('SUPABASE_INIT_ERROR', { error: error.message });
    console.error('⛔ Error fatal inicializando Supabase:', error);

    // Mostrar mensaje de error más informativo
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
            <h1 style="color: #e74c3c;">Error de Conexión</h1>
            <p>No se pudo conectar con el servicio.</p>
            <p><strong>Detalles técnicos:</strong> ${error.message}</p>
            <p><em>Entorno:</em> ${window.location.hostname}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                Reintentar
            </button>
        </div>
    `;
}