// js/modules/api-simple.js
// Versión simplificada de API para solucionar problemas urgentes

// === FUNCIONES BÁSICAS ===

export async function getFeaturedServers() {
    console.log('🔍 getFeaturedServers llamada');
    
    if (!window.supabaseClient) {
        throw new Error('Supabase client no disponible');
    }
    
    const { data, error } = await window.supabaseClient
        .from('servers')
        .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, opening_date')
        .eq('status', 'aprobado')
        .eq('is_featured', true)
        .limit(5);
        
    if (error) { 
        console.error("API Error (getFeaturedServers):", error); 
        throw error; 
    }
    
    console.log(`✅ getFeaturedServers: ${data.length} servidores obtenidos`);
    return data;
}

export async function getExploreServers(filters) {
    console.log('🔍 getExploreServers llamada con filtros:', filters);

    if (!window.supabaseClient) {
        throw new Error('Supabase client no disponible');
    }

    try {
        let query = window.supabaseClient.from('servers')
            .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, description, website_url, opening_date')
            .eq('status', 'aprobado');

        if (filters.name) query = query.ilike('name', `%${filters.name}%`);
        if (filters.version) query = query.eq('version', filters.version);
        if (filters.type) query = query.eq('type', filters.type);
        if (filters.configuration) query = query.eq('configuration', filters.configuration);
        if (filters.exp < 99999) query = query.lte('exp_rate', filters.exp);

        switch (filters.sort) {
            case 'newest':
                query = query.order('created_at', { ascending: false });
                break;
            case 'opening_soon':
                query = query.not('opening_date', 'is', null).gt('opening_date', new Date().toISOString()).order('opening_date', { ascending: true });
                break;
            default:
                query = query.order('is_featured', { ascending: false }).order('votes_count', { ascending: false, nullsFirst: false });
                break;
        }

        const { data, error } = await query;
        if (error) { 
            console.error("API Error (getExploreServers):", error); 
            throw error; 
        }
        
        console.log(`✅ getExploreServers: ${data.length} servidores obtenidos`);
        return data;
    } catch (error) {
        console.error("❌ Error en getExploreServers:", error);
        throw error;
    }
}

// === FUNCIONES DE UPLOAD ===

export async function uploadFileRobust(file, bucket, retryCount = 0) {
    console.log(`🚀 uploadFileRobust: ${file?.name} -> ${bucket} (intento ${retryCount + 1})`);
    
    // Validación inicial
    if (!file) {
        console.log("uploadFileRobust: No se proporcionó archivo");
        return null;
    }

    // Validación de tamaño
    if (file.size > 10 * 1024 * 1024) {
        throw new Error(`El archivo ${file.name} excede el límite de 10MB.`);
    }

    // Validación de tipo
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
            throw new Error("Cliente de Supabase no está inicializado");
        }

        // Verificación simple de autenticación
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            throw new Error("Debes iniciar sesión para subir archivos");
        }

        console.log(`🚀 Subiendo archivo: ${fileName} -> ${bucket}`);

        // Upload simple
        const { data, error } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error(`❌ Error upload: ${error.message}`);
            
            // Retry simple si no es el último intento
            if (retryCount < 2) {
                console.log(`🔄 Reintentando upload (${retryCount + 1}/3)...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return uploadFileRobust(file, bucket, retryCount + 1);
            }
            
            throw new Error(`Error subiendo archivo: ${error.message}`);
        }

        console.log(`✅ Upload exitoso: ${data.path}`);
        return data.path;

    } catch (error) {
        console.error(`❌ Error en uploadFileRobust: ${error.message}`);
        
        // Retry simple si no es el último intento
        if (retryCount < 2) {
            console.log(`🔄 Reintentando upload (${retryCount + 1}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return uploadFileRobust(file, bucket, retryCount + 1);
        }
        
        throw error;
    }
}

export async function uploadFile(file, bucket) {
    console.log(`🚀 uploadFile: ${file?.name} -> ${bucket}`);
    
    if (!file) {
        console.log("uploadFile: No se proporcionó archivo");
        return null;
    }

    // Usar la función robusta como fallback
    return uploadFileRobust(file, bucket);
}

export async function addServer(serverData) {
    console.log('➕ addServer llamada');
    
    if (!window.supabaseClient) {
        throw new Error('Supabase client no disponible');
    }
    
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) throw new Error("No estás autenticado.");
    
    const dataToInsert = { ...serverData, user_id: session.user.id, status: 'pendiente' };
    const { error } = await window.supabaseClient.from('servers').insert([dataToInsert]);
    
    if (error) { 
        console.error("API Error (addServer):", error); 
        throw new Error(error.message); 
    }
    
    console.log('✅ Servidor agregado exitosamente');
}

// === FUNCIONES DE RANKING ===

export async function getRankingServers(rankingType = 'general', page = 1, pageSize = 15) {
    console.log(`🏆 getRankingServers: ${rankingType}, página ${page}`);
    
    if (!window.supabaseClient) {
        throw new Error('Supabase client no disponible');
    }
    
    const from = (page - 1) * pageSize;

    if (rankingType === 'monthly') {
        const { data, error, count } = await window.supabaseClient
            .from('monthly_server_votes')
            .select('*', { count: 'exact' })
            .order('monthly_votes_count', { ascending: false, nullsFirst: false })
            .range(from, from + pageSize - 1);

        if (error) {
            console.error("API Error (getRankingServers - monthly):", error);
            throw error;
        }
        return { data, count };
    } else {
        const { data, error, count } = await window.supabaseClient
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

// === FUNCIONES DE CALENDARIO ===

export async function getCalendarOpenings() {
    console.log('📅 getCalendarOpenings llamada');
    
    if (!window.supabaseClient) {
        throw new Error('Supabase client no disponible');
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('servers')
            .select('id, name, image_url, banner_url, description, version, type, configuration, exp_rate, opening_date')
            .not('opening_date', 'is', null)
            .gt('opening_date', new Date().toISOString())
            .order('opening_date', { ascending: true });
            
        if (error) { 
            console.error("API Error (getCalendarOpenings):", error); 
            throw error; 
        }
        
        console.log(`✅ getCalendarOpenings: ${data.length} aperturas obtenidas`);
        return data;
    } catch (error) {
        console.error("❌ Error en getCalendarOpenings:", error);
        throw error;
    }
}

console.log('🛠️ API simple cargada');
