// js/modules/api.js

const supabase = window.supabaseClient;

// === DIAGNÓSTICO AVANZADO DE RED ===
// Función para logging detallado de problemas de red en producción
function logNetworkDiagnostics(operation, details = {}) {
    const timestamp = new Date().toISOString();
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    const environment = isProduction ? 'PRODUCTION' : 'DEVELOPMENT';

    const diagnosticInfo = {
        timestamp,
        environment,
        operation,
        hostname: window.location.hostname,
        userAgent: navigator.userAgent,
        connectionType: navigator.connection?.effectiveType || 'unknown',
        onlineStatus: navigator.onLine,
        supabaseClientStatus: !!window.supabaseClient,
        ...details
    };

    console.log(`🔍 [${environment}] NETWORK DIAGNOSTIC - ${operation}:`, diagnosticInfo);

    // En producción, también enviamos a la consola del navegador para debugging
    if (isProduction) {
        console.table(diagnosticInfo);
    }

    return diagnosticInfo;
}

// Función para capturar información detallada de la sesión de autenticación
async function getDetailedAuthInfo() {
    try {
        if (!window.supabaseClient) {
            return { error: 'Supabase client not initialized' };
        }

        const { data: { session }, error } = await window.supabaseClient.auth.getSession();

        if (error) {
            return { error: error.message, errorCode: error.status };
        }

        if (!session) {
            return { error: 'No active session' };
        }

        return {
            userId: session.user?.id,
            userEmail: session.user?.email,
            tokenExpiry: session.expires_at,
            tokenType: session.token_type,
            accessTokenLength: session.access_token?.length || 0,
            refreshTokenLength: session.refresh_token?.length || 0,
            isExpired: session.expires_at ? new Date(session.expires_at * 1000) < new Date() : false
        };
    } catch (error) {
        return { error: error.message };
    }
}

// --- API de Servidores y Widgets ---

export async function getServers() {
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, description, website_url, opening_date, votes_count, average_rating, review_count, status, created_at')
        .eq('status', 'aprobado')
        .order('created_at', { ascending: false });
    if (error) { console.error("API Error (getServers):", error); throw new Error("No se pudieron obtener los servidores."); }
    return data || [];
}

export async function getFeaturedServers() {
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, opening_date')
        .eq('status', 'aprobado')
        .eq('is_featured', true)
        .limit(5);
    if (error) { console.error("API Error (getFeaturedServers):", error); throw error; }
    return data;
}

export async function getServerOfTheMonth() {
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, image_url, banner_url, description, version, type, configuration, exp_rate, drop_rate, website_url, discord_url, opening_date, votes_count, average_rating, review_count')
        .eq('is_server_of_the_month', true)
        .maybeSingle();
    if (error) { console.error("API Error (getServerOfTheMonth):", error); throw error; }
    return data;
}

export async function getTopRankingWidget() {
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, image_url, votes_count, version, type, exp_rate')
        .eq('status', 'aprobado')
        .order('votes_count', { ascending: false, nullsFirst: false })
        .limit(5);
    if (error) { console.error("API Error (getTopRankingWidget):", error); throw error; }
    return data;
}

export async function getUpcomingOpeningsWidget() {
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, opening_date')
        .not('opening_date', 'is', null)
        .gt('opening_date', new Date().toISOString())
        .order('opening_date', { ascending: true })
        .limit(3);
    if (error) { console.error("API Error (getUpcomingOpeningsWidget):", error); throw error; }
    return data;
}

// =====================================================
// NUEVA FUNCIÓN OPTIMIZADA PARA HOMEPAGE
// Reemplaza 8 consultas individuales con 1 sola RPC call
// =====================================================

export async function getHomepageData() {
    logNetworkDiagnostics('getHomepageData', { operation: 'RPC_CALL' });

    try {
        const { data, error } = await supabase.rpc('get_homepage_data');

        if (error) {
            console.error("API Error (getHomepageData):", error);
            logNetworkDiagnostics('getHomepageData', {
                status: 'ERROR',
                error: error.message,
                errorCode: error.code
            });
            throw new Error("No se pudieron cargar los datos de la homepage.");
        }

        if (!data || !data.success) {
            console.error("RPC Error (getHomepageData):", data?.error || 'Unknown error');
            throw new Error(data?.error || "Error interno del servidor.");
        }

        logNetworkDiagnostics('getHomepageData', {
            status: 'SUCCESS',
            dataSize: JSON.stringify(data).length,
            timestamp: data.timestamp
        });

        return {
            featuredServers: data.featuredServers || [],
            serverOfTheMonth: data.serverOfTheMonth || null,
            topRanking: data.topRanking || [],
            upcomingOpenings: data.upcomingOpenings || [],
            globalStats: data.globalStats || { totalServers: 0, totalUsers: 0, totalVotes: 0 }
        };
    } catch (error) {
        console.error("Critical Error (getHomepageData):", error);
        logNetworkDiagnostics('getHomepageData', {
            status: 'CRITICAL_ERROR',
            error: error.message
        });

        // Fallback: retornar datos vacíos pero válidos
        return {
            featuredServers: [],
            serverOfTheMonth: null,
            topRanking: [],
            upcomingOpenings: [],
            globalStats: { totalServers: 0, totalUsers: 0, totalVotes: 0 }
        };
    }
}

// =====================================================
// FUNCIONES LEGACY (mantenidas para compatibilidad)
// =====================================================

export async function getGlobalStats() {
    const [serverCount, userCount, votesData] = await Promise.all([
        supabase.from('servers').select('*', { count: 'exact', head: true }).eq('status', 'aprobado'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('servers').select('votes_count').eq('status', 'aprobado')
    ]);

    if (serverCount.error || userCount.error || votesData.error) {
        console.error("API Error (getGlobalStats):", serverCount.error || userCount.error || votesData.error);
        return { totalServers: 0, totalUsers: 0, totalVotes: 0 };
    }

    const totalVotes = votesData.data ? votesData.data.reduce((acc, s) => acc + (s.votes_count || 0), 0) : 0;
    return { totalServers: serverCount.count, totalUsers: userCount.count, totalVotes: totalVotes };
}

export async function getExploreServers(filters) {
    let query = supabase.from('servers')
        .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, description, website_url, opening_date')
        .eq('status', 'aprobado');

    if (filters.name) query = query.ilike('name', `%${filters.name}%`);
    if (filters.version) query = query.eq('version', filters.version);
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.configuration) query = query.eq('configuration', filters.configuration);
    if (filters.exp < 99999) query = query.lte('exp_rate', filters.exp);

    switch (filters.sort) {
        case 'newest': query = query.order('created_at', { ascending: false }); break;
        case 'opening_soon': query = query.not('opening_date', 'is', null).gt('opening_date', new Date().toISOString()).order('opening_date', { ascending: true }); break;
        default: query = query.order('is_featured', { ascending: false }).order('votes_count', { ascending: false, nullsFirst: false }); break;
    }
    const { data, error } = await query;
    if (error) { console.error("API Error (getExploreServers):", error); throw error; }
    return data;
}

export async function getCalendarOpenings() {
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, image_url, banner_url, description, version, type, configuration, exp_rate, opening_date')
        .not('opening_date', 'is', null)
        .gt('opening_date', new Date().toISOString())
        .order('opening_date', { ascending: true });
    if (error) { console.error("API Error (getCalendarOpenings):", error); throw error; }
    return data;
}

export async function getServerById(serverId) {
    if (!serverId) throw new Error("Se requiere un ID de servidor válido.");
    
    // Consulta optimizada que solo obtiene los campos necesarios para la página del servidor
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, description, version, type, configuration, exp_rate, drop_rate, reset_info, antihack_info, image_url, banner_url, gallery_urls, events, website_url, discord_url, opening_date, votes_count, average_rating, review_count, status, created_at, user_id')
        .eq('id', serverId)
        .single();
    
    if (error) {
        console.error("API Error (getServerById):", error);
        throw new Error("Ocurrió un error al buscar el servidor.");
    }
    
    if (!data) {
        throw new Error("Servidor no encontrado o no disponible.");
    }
    
    // Obtener información adicional del propietario si existe
    if (data.user_id) {
        try {
            const { data: ownerData } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', data.user_id)
                .single();
                
            if (ownerData) {
                data.owner = ownerData;
            }
        } catch (profileError) {
            console.warn("No se pudo obtener información del propietario:", profileError);
            // No lanzamos error aquí para que la página siga funcionando
        }
    }
    
    return data;
}


export async function getReviewsByServerId(serverId) {
    const { data, error } = await supabase
        .from('reviews')
        .select(`*, profiles ( username, avatar_url )`)
        .eq('server_id', serverId)
        .order('created_at', { ascending: false });
    if (error) { console.error("API Error (getReviewsByServerId):", error); throw error; }
    return data;
}

export async function addReview(reviewData) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Debes iniciar sesión para dejar una reseña.");
    
    const dataToInsert = { ...reviewData, user_id: session.user.id };
    const { error } = await supabase.from('reviews').insert([dataToInsert]);
    if (error) { console.error("API Error (addReview):", error); throw new Error(error.message); }
}

export async function voteForServer(serverId) {
    const { data, error } = await supabase.functions.invoke('vote-server', { body: { serverId: parseInt(serverId, 10) } });
    if (error) throw new Error("Error de red al intentar votar. Inténtalo de nuevo.");
    if (data.error) throw new Error(data.error);
    return data;
}

export async function getUserProfile(userId) {
    if (!userId) throw new Error("Se requiere un ID de usuario para obtener el perfil.");
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) { console.error("API Error (getUserProfile):", error); throw new Error("No se pudo obtener el perfil de usuario."); }
    return data;
}

export async function getServersByUserId(userId) {
    const { data, error } = await supabase.from('servers').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error("API Error (getServersByUserId):", error); throw new Error("No se pudieron obtener los servidores del usuario."); }
    return data;
}

export async function getReviewsByUserId(userId) {
    const { data, error } = await supabase.from('reviews').select('*, servers(id, name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
    if (error) { console.error("API Error (getReviewsByUserId):", error); throw new Error("No se pudieron obtener las reseñas del usuario."); }
    return data;
}

export async function getOwnerDashboardStats(ownerId) {
    const { data, error } = await supabase.from('servers').select('name, view_count, website_click_count, discord_click_count, votes_count').eq('user_id', ownerId);
    if (error) { console.error("API Error (getOwnerDashboardStats):", error); throw new Error("No se pudieron obtener las estadísticas del dashboard."); }
    return data;
}

export async function updateUserAvatar(userId, avatarPath) {
    const { error } = await supabase.from('profiles').update({ avatar_url: avatarPath }).eq('id', userId);
    if (error) { console.error("API Error (updateUserAvatar):", error); throw new Error("No se pudo actualizar el avatar."); }
}

// Función de upload simplificada sin verificación de sesión
// === FUNCIÓN DE TEST PARA DEBUGGING ===
// Usar desde la consola: testUpload()
window.testUpload = async function(fileInput = null) {
    console.log('🧪 [TEST] Iniciando test de upload...');

    try {
        // Si no se proporciona input, intentar encontrar uno en la página
        const input = fileInput || document.getElementById('logo-file') || document.querySelector('input[type="file"]');

        if (!input) {
            console.log('❌ [TEST] No se encontró input de archivo. Usa: testUpload(document.getElementById("logo-file"))');
            return;
        }

        const file = input.files[0];
        if (!file) {
            console.log('❌ [TEST] No hay archivo seleccionado en el input');
            return;
        }

        console.log(`🧪 [TEST] Archivo seleccionado: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);

        // Test con función robusta
        console.log('🧪 [TEST] Probando uploadFileRobust...');
        const result = await window.api.uploadFileRobust(file, 'server-images');

        console.log('✅ [TEST] Upload exitoso:', result);
        return result;

    } catch (error) {
        console.error('❌ [TEST] Upload falló:', error);
        throw error;
    }
};

export async function uploadFileSimple(file, bucket) {
    console.log(`uploadFileSimple: Iniciando con ${file?.name} al bucket ${bucket}`);

    if (!file) {
        console.log("uploadFileSimple: No se proporcionó archivo, retornando null");
        return null;
    }

    // Validación de tamaño aumentada
    if (file.size > 10 * 1024 * 1024) {
        throw new Error(`El archivo ${file.name} excede el límite de 10MB.`);
    }

    // Validación de tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido: ${file.type}. Solo se permiten imágenes.`);
    }

    try {
        // Verificar que el cliente de Supabase esté disponible
        if (!window.supabaseClient) {
            throw new Error("Cliente de Supabase no está inicializado");
        }

        // Generar nombre único
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const fileName = `${timestamp}-${randomSuffix}.${fileExtension}`;

        console.log(`uploadFileSimple: Nombre generado: ${fileName}`);

        // Subida directa sin verificación de sesión (asumimos que ya está autenticado)
        console.log(`uploadFileSimple: Iniciando subida directa...`);
        const { data, error } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        console.log(`uploadFileSimple: Resultado de subida:`, { data, error });

        if (error) {
            console.error(`uploadFileSimple: Error de Supabase:`, error);
            throw new Error(`Error de Supabase: ${error.message}`);
        }

        if (!data?.path) {
            throw new Error("No se obtuvo path del archivo subido");
        }

        console.log(`uploadFileSimple: Éxito - ${data.path}`);
        return data.path;

    } catch (error) {
        console.error(`uploadFileSimple: Error:`, error);
        throw error;
    }
}

// Función alternativa de upload con enfoque diferente
export async function uploadFileAlternative(file, bucket) {
    console.log(`uploadFileAlternative: Iniciando con ${file?.name} al bucket ${bucket}`);

    if (!file) {
        console.log("uploadFileAlternative: No se proporcionó archivo, retornando null");
        return null;
    }

    try {
        // Verificar autenticación primero
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
        if (sessionError || !session) {
            throw new Error("No estás autenticado");
        }

        // Generar nombre único
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const fileName = `${timestamp}-${randomSuffix}.${fileExtension}`;

        console.log(`uploadFileAlternative: Nombre generado: ${fileName}`);

        // Intentar subida directa sin Promise.race
        console.log(`uploadFileAlternative: Iniciando subida directa...`);
        const { data, error } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        console.log(`uploadFileAlternative: Resultado de subida:`, { data, error });

        if (error) {
            throw new Error(`Error de Supabase: ${error.message}`);
        }

        if (!data?.path) {
            throw new Error("No se obtuvo path del archivo subido");
        }

        console.log(`uploadFileAlternative: Éxito - ${data.path}`);
        return data.path;

    } catch (error) {
        console.error(`uploadFileAlternative: Error:`, error);
        throw error;
    }
}

// === FUNCIÓN DE UPLOAD ROBUSTA PARA PRODUCCIÓN ===
// Esta función está específicamente diseñada para manejar problemas de Vercel/Supabase
export async function uploadFileRobust(file, bucket, retryCount = 0) {
    const maxRetries = 3;
    const baseTimeout = 15000; // Empezar con 15 segundos
    const timeoutMultiplier = 1.5; // Aumentar timeout en cada retry

    // Logging inicial detallado
    logNetworkDiagnostics('UPLOAD_START', {
        fileName: file?.name,
        fileSize: file?.size,
        fileSizeMB: file?.size ? (file.size / (1024 * 1024)).toFixed(2) : 'unknown',
        fileType: file?.type,
        bucket,
        retryAttempt: retryCount,
        maxRetries,
        environment: window.location.hostname,
        userAgent: navigator.userAgent.substring(0, 50)
    });

    // Validación inicial
    if (!file) {
        logNetworkDiagnostics('UPLOAD_ERROR', { error: 'No file provided' });
        return null;
    }

    // Validaciones de archivo - Límite aumentado temporalmente para debugging
    if (file.size > 10 * 1024 * 1024) {
        throw new Error(`El archivo ${file.name} excede el límite de 10MB.`);
    }

    // Log del tamaño del archivo para debugging
    logNetworkDiagnostics('FILE_SIZE_CHECK', {
        fileName: file.name,
        fileSize: file.size,
        fileSizeMB: (file.size / (1024 * 1024)).toFixed(2)
    });

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido: ${file.type}. Solo se permiten imágenes.`);
    }

    // Generar nombre único
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}-${randomSuffix}.${fileExtension}`;

    try {
        // Verificar cliente Supabase
        if (!window.supabaseClient) {
            logNetworkDiagnostics('UPLOAD_ERROR', { error: 'Supabase client not initialized' });
            throw new Error("Cliente de Supabase no está inicializado");
        }

        // Obtener información detallada de autenticación
        const authInfo = await getDetailedAuthInfo();
        logNetworkDiagnostics('AUTH_CHECK', authInfo);

        if (authInfo.error) {
            throw new Error(`Error de autenticación: ${authInfo.error}`);
        }

        if (authInfo.isExpired) {
            logNetworkDiagnostics('AUTH_ERROR', { error: 'Token expired' });
            throw new Error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
        }

        // Configurar timeout dinámico basado en el intento
        const currentTimeout = baseTimeout * Math.pow(timeoutMultiplier, retryCount);

        logNetworkDiagnostics('UPLOAD_ATTEMPT', {
            fileName,
            bucket,
            timeout: currentTimeout,
            retryAttempt: retryCount,
            supabaseClientAvailable: !!window.supabaseClient,
            storageAvailable: !!window.supabaseClient?.storage
        });

        console.log(`🚀 [UPLOAD] Iniciando upload: ${fileName} (${(file.size / (1024 * 1024)).toFixed(2)}MB) -> ${bucket}`);

        // Crear promesa de upload (sin headers personalizados para evitar interferencias)
        const uploadPromise = window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        // Promesa de timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                console.log(`⏰ [UPLOAD] TIMEOUT después de ${currentTimeout/1000}s: ${fileName}`);
                logNetworkDiagnostics('UPLOAD_TIMEOUT', {
                    fileName,
                    timeout: currentTimeout,
                    retryAttempt: retryCount
                });
                reject(new Error(`Timeout: La subida tardó más de ${currentTimeout/1000} segundos`));
            }, currentTimeout);
        });

        console.log(`⏳ [UPLOAD] Esperando resultado para: ${fileName}`);

        // Ejecutar upload con timeout
        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

        console.log(`📋 [UPLOAD] Resultado para ${fileName}:`, {
            success: !error,
            hasData: !!data,
            hasPath: !!data?.path,
            errorMessage: error?.message
        });

        if (error) {
            logNetworkDiagnostics('UPLOAD_ERROR', {
                error: error.message,
                errorCode: error.status,
                retryAttempt: retryCount
            });

            // Si es un error de timeout o red y tenemos retries disponibles
            if (retryCount < maxRetries && (
                error.message?.includes('timeout') ||
                error.message?.includes('network') ||
                error.message?.includes('fetch') ||
                error.status >= 500
            )) {
                logNetworkDiagnostics('RETRY_ATTEMPT', {
                    retryAttempt: retryCount + 1,
                    reason: error.message
                });

                // Esperar antes del retry (backoff exponencial)
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));

                // Retry recursivo
                return uploadFileRobust(file, bucket, retryCount + 1);
            }

            // Manejar errores específicos
            if (error.message?.includes('duplicate')) {
                throw new Error("Ya existe un archivo con ese nombre. Intenta de nuevo.");
            } else if (error.message?.includes('policy') || error.message?.includes('permission')) {
                throw new Error(`No tienes permisos para subir archivos al bucket '${bucket}'.`);
            } else if (error.message?.includes('JWT') || error.message?.includes('token')) {
                throw new Error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
            } else {
                throw new Error(`Error al subir archivo: ${error.message}`);
            }
        }

        // Validar respuesta
        if (!data?.path) {
            logNetworkDiagnostics('UPLOAD_ERROR', { error: 'No path in response', data });
            throw new Error("La subida no devolvió una ruta de archivo válida.");
        }

        logNetworkDiagnostics('UPLOAD_SUCCESS', {
            fileName,
            path: data.path,
            retryAttempt: retryCount
        });

        return data.path;

    } catch (error) {
        logNetworkDiagnostics('UPLOAD_FINAL_ERROR', {
            error: error.message,
            retryAttempt: retryCount,
            fileName
        });

        // Si llegamos al máximo de retries, lanzar error final
        if (retryCount >= maxRetries) {
            throw new Error(`Fallo definitivo al subir ${file.name} después de ${maxRetries} intentos: ${error.message}`);
        }

        throw error;
    }
}

// Mantener la función original como fallback
export async function uploadFile(file, bucket) {
    // Validación inicial
    if (!file) {
        console.log("uploadFile: No se proporcionó archivo, retornando null");
        return null;
    }

    // Validación de tamaño - Límite aumentado temporalmente
    if (file.size > 10 * 1024 * 1024) {
        throw new Error(`El archivo ${file.name} excede el límite de 10MB.`);
    }

    console.log(`uploadFile: Archivo ${file.name} - Tamaño: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);

    // Validación de tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido: ${file.type}. Solo se permiten imágenes.`);
    }

    // Generar nombre único para el archivo
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-_]/g, '').substring(0, 50);
    const fileName = `${Date.now()}-${cleanFileName}.${fileExtension}`;

    console.log(`uploadFile: Iniciando subida de ${file.name} (${file.size} bytes) al bucket ${bucket}`);

    try {
        // Verificar que el cliente de Supabase esté disponible
        if (!window.supabaseClient) {
            throw new Error("Cliente de Supabase no está inicializado");
        }

        // Verificar que el usuario esté autenticado
        const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
        if (sessionError) {
            throw new Error(`Error de autenticación: ${sessionError.message}`);
        }
        if (!session) {
            throw new Error("Debes iniciar sesión para subir archivos");
        }

        console.log(`uploadFile: Usuario autenticado: ${session.user.email}`);

        // Crear una promesa con timeout para evitar cuelgues
        console.log(`uploadFile: Iniciando upload a bucket ${bucket} con archivo ${fileName}`);

        const uploadPromise = window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                console.log(`uploadFile: TIMEOUT después de 30 segundos para ${fileName}`);
                reject(new Error("Timeout: La subida tardó más de 30 segundos"));
            }, 30000);
        });

        console.log(`uploadFile: Esperando resultado de Promise.race para ${fileName}`);
        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);
        console.log(`uploadFile: Promise.race completado para ${fileName}`, { data, error });

        if (error) {
            console.error("Error de Supabase al subir archivo:", error);

            // Manejar errores específicos de Supabase
            if (error.message?.includes('duplicate')) {
                throw new Error("Ya existe un archivo con ese nombre. Intenta de nuevo.");
            } else if (error.message?.includes('size')) {
                throw new Error("El archivo es demasiado grande para el servidor.");
            } else if (error.message?.includes('policy') || error.message?.includes('permission') || error.message?.includes('RLS')) {
                throw new Error(`No tienes permisos para subir archivos al bucket '${bucket}'. Contacta al administrador para configurar las políticas de seguridad.`);
            } else if (error.message?.includes('bucket') && error.message?.includes('not found')) {
                throw new Error(`El bucket '${bucket}' no existe. Contacta al administrador.`);
            } else if (error.message?.includes('JWT') || error.message?.includes('token')) {
                throw new Error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
            } else {
                throw new Error(`Error al subir archivo: ${error.message}`);
            }
        }

        // Validar que la respuesta sea correcta
        if (!data) {
            throw new Error("La subida no devolvió datos válidos.");
        }

        if (!data.path) {
            console.error("Respuesta de subida sin path:", data);
            throw new Error("La subida no devolvió una ruta de archivo válida.");
        }

        console.log(`uploadFile: Subida exitosa, path: ${data.path}`);
        return data.path;

    } catch (error) {
        console.error("Error en uploadFile:", error);

        // Re-lanzar el error con un mensaje más claro si es necesario
        if (error.message.includes("Timeout")) {
            throw error;
        } else if (error.message.includes("Cliente de Supabase")) {
            throw error;
        } else {
            throw new Error(`Fallo al subir el archivo ${file.name}: ${error.message}`);
        }
    }
}

export async function addServer(serverData) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No estás autenticado.");
    const dataToInsert = { ...serverData, user_id: session.user.id, status: 'pendiente' };
    const { error } = await supabase.from('servers').insert([dataToInsert]);
    if (error) { console.error("API Error (addServer):", error); throw new Error(error.message); }
}

export async function getServerForEdit(serverId, userId) {
    const profile = await getUserProfile(userId);
    let query = supabase.from('servers').select('*').eq('id', serverId);
    if (profile.role !== 'admin') {
        query = query.eq('user_id', userId);
    }
    const { data, error } = await query.single();
    if (error || !data) { 
        console.error("API Error (getServerForEdit):", error); 
        throw new Error('Servidor no encontrado o no tienes permiso para editarlo.'); 
    }
    return data;
}

export async function updateServer(serverId, updatedData) {
    const { error } = await supabase.from('servers').update(updatedData).eq('id', serverId);
    if (error) { console.error("API Error (updateServer):", error); throw error; }
}

export async function getServersByStatus(status) {
    const { data, error } = await supabase.from('servers').select('*').eq('status', status);
    if (error) { console.error("API Error (getServersByStatus):", error); throw error; }
    return data;
}

export async function getAllServersForAdmin() {
    const { data, error } = await supabase.from('servers').select('*').neq('status', 'pendiente').order('created_at', { ascending: false });
    if (error) { console.error("API Error (getAllServersForAdmin):", error); throw error; }
    return data;
}

export async function deleteServer(serverId) {
    const { error } = await supabase.from('servers').delete().eq('id', serverId);
    if (error) { console.error("API Error (deleteServer):", error); throw error; }
}

export async function getAllUsersForAdmin() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) { console.error("API Error (getAllUsersForAdmin):", error); throw error; }
    return data.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
}

export async function updateUserProfile(userId, updateData) {
    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
    if (error) { console.error("API Error (updateUserProfile):", error); throw error; }
}

export async function getDataForSomAdmin() {
    const [winnerRes, serversRes] = await Promise.all([
        supabase.from('servers').select('id, name, image_url').eq('is_server_of_the_month', true).maybeSingle(),
        supabase.from('servers').select('id, name').eq('status', 'aprobado').order('name', { ascending: true })
    ]);
    if (winnerRes.error || serversRes.error) { 
        const err = winnerRes.error || serversRes.error;
        console.error("API Error (getDataForSomAdmin):", err); 
        throw new Error(err.message); 
    }
    return { currentWinner: winnerRes.data, allServers: serversRes.data };
}

export async function setServerOfTheMonth(newWinnerId) {
    const { error } = await supabase.rpc('set_server_of_the_month', { new_winner_id: newWinnerId });
    if (error) { console.error("API Error (setServerOfTheMonth):", error); throw new Error("No se pudo actualizar el Servidor del Mes."); }
}

// --- API de Métricas y Contadores ---

export async function incrementServerView(serverId) {
    try {
        // Verificar si la función RPC existe antes de llamarla
        const { error } = await supabase.rpc('increment_server_view', { server_id_param: parseInt(serverId, 10) });
        if (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                console.warn("⚠️ Función RPC increment_server_view no existe. Ejecuta supabase_rpc_functions.sql en Supabase.");
                return; // Salir silenciosamente
            }
            console.error("API Error (incrementServerView):", error);
        } else {
            console.log("✅ Vista incrementada para servidor:", serverId);
        }
    } catch (error) {
        console.error("Error incrementando vista de servidor:", error);
        // Silencioso para no afectar la UX
    }
}

export async function incrementWebsiteClick(serverId) {
    try {
        const { error } = await supabase.rpc('increment_website_click', { server_id_param: parseInt(serverId, 10) });
        if (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                console.warn("⚠️ Función RPC increment_website_click no existe. Ejecuta supabase_rpc_functions.sql en Supabase.");
                return;
            }
            console.error("API Error (incrementWebsiteClick):", error);
        } else {
            console.log("✅ Clic web incrementado para servidor:", serverId);
        }
    } catch (error) {
        console.error("Error incrementando clic de sitio web:", error);
    }
}

export async function incrementDiscordClick(serverId) {
    try {
        const { error } = await supabase.rpc('increment_discord_click', { server_id_param: parseInt(serverId, 10) });
        if (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
                console.warn("⚠️ Función RPC increment_discord_click no existe. Ejecuta supabase_rpc_functions.sql en Supabase.");
                return;
            }
            console.error("API Error (incrementDiscordClick):", error);
        } else {
            console.log("✅ Clic Discord incrementado para servidor:", serverId);
        }
    } catch (error) {
        console.error("Error incrementando clic de Discord:", error);
    }
}

// --- API de Ranking ---
export async function getRankingServers(rankingType = 'general', page = 1, pageSize = 15) {
    const from = (page - 1) * pageSize;

    if (rankingType === 'monthly') {
        // Usar consulta directa en lugar de RPC para garantizar compatibilidad
        const { data, error, count } = await supabase
            .from('monthly_server_votes')
            .select('*', { count: 'exact' })
            .order('monthly_votes_count', { ascending: false, nullsFirst: false })
            .range(from, from + pageSize - 1);

        if (error) {
            console.error("API Error (getRankingServers - monthly):", error);
            throw error;
        }
        return { data, count };
    } else { // Ranking General
        // Mantener el código existente para el ranking general
        const { data, error, count } = await supabase
            .from('servers')
            .select('*, average_rating, review_count', { count: 'exact' })
            .eq('status', 'aprobado')
            .order('votes_count', { ascending: false, nullsFirst: false })
            .range(from, from + pageSize - 1);

        if (error) {
            console.error("API Error (getRankingServers - general):", error);
            throw error;
        }
        return { data, count };
    }
}

// === EXPOSICIÓN GLOBAL PARA DEBUGGING ===
// Exponer funciones de API globalmente para debugging en producción
if (typeof window !== 'undefined') {
    window.api = {
        uploadFile,
        uploadFileRobust,
        uploadFileSimple,
        uploadFileAlternative,
        getServers,
        getFeaturedServers,
        getCalendarOpenings,
        getExploreServers
    };

    console.log('🔧 API functions exposed globally for debugging');
}
