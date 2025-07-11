// js/modules/api-fix.js
// Parche rápido para corregir el problema de inicialización de Supabase

// Función helper para obtener el cliente Supabase de forma segura
function getSupabaseClient() {
    if (!window.supabaseClient) {
        console.error('Cliente de Supabase no está inicializado');
        throw new Error('Cliente de Supabase no está inicializado');
    }
    return window.supabaseClient;
}

// Función para aplicar el parche a todas las funciones de API
export function applySupabaseClientFix() {
    // Verificar que el cliente esté disponible
    if (!window.supabaseClient) {
        console.error('❌ No se puede aplicar el parche: Cliente Supabase no disponible');
        return false;
    }

    console.log('🔧 Aplicando parche de cliente Supabase...');

    // Crear un proxy para interceptar todas las llamadas a las funciones de API
    const originalAPI = window.api || {};
    
    // Lista de funciones que necesitan el cliente Supabase
    const apiFunctions = [
        'getServers',
        'getFeaturedServers', 
        'getServerOfTheMonth',
        'getTopRankingWidget',
        'getUpcomingOpeningsWidget',
        'getGlobalStats',
        'getExploreServers',
        'getCalendarOpenings',
        'getServerById',
        'getReviewsByServerId',
        'addReview',
        'voteForServer',
        'getUserProfile',
        'getServersByUserId',
        'getReviewsByUserId',
        'getOwnerDashboardStats',
        'updateUserAvatar',
        'addServer',
        'getServerForEdit',
        'updateServer',
        'getServersByStatus',
        'getAllServersForAdmin',
        'deleteServer',
        'getAllUsersForAdmin',
        'updateUserProfile',
        'getDataForSomAdmin',
        'setServerOfTheMonth',
        'getRankingServers'
    ];

    // Crear versiones patcheadas de las funciones
    apiFunctions.forEach(funcName => {
        if (typeof originalAPI[funcName] === 'function') {
            const originalFunc = originalAPI[funcName];
            originalAPI[funcName] = function(...args) {
                try {
                    // Verificar que el cliente esté disponible antes de ejecutar
                    if (!window.supabaseClient) {
                        throw new Error('Cliente de Supabase no está inicializado');
                    }
                    return originalFunc.apply(this, args);
                } catch (error) {
                    console.error(`❌ Error en función ${funcName}:`, error);
                    throw error;
                }
            };
        }
    });

    console.log('✅ Parche de cliente Supabase aplicado correctamente');
    return true;
}

// Auto-aplicar el parche cuando se carga el módulo
if (typeof window !== 'undefined') {
    // Esperar a que el cliente esté disponible
    const checkAndApplyPatch = () => {
        if (window.supabaseClient) {
            applySupabaseClientFix();
        } else {
            console.log('⏳ Esperando inicialización de cliente Supabase...');
            setTimeout(checkAndApplyPatch, 100);
        }
    };
    
    // Aplicar el parche después de un breve delay
    setTimeout(checkAndApplyPatch, 500);
}

export default { applySupabaseClientFix };
