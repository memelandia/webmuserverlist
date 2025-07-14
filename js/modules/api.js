// js/modules/api.js

/**
 * Obtiene la URL pública de una imagen almacenada en Supabase Storage con opciones de transformación.
 * @param {string} bucketName - Nombre del bucket.
 * @param {string} imagePath - Ruta de la imagen dentro del bucket.
 * @param {object} options - Opciones de transformación (width, height, quality, resize).
 * @param {string} fallbackUrl - URL de fallback si la imagen no existe.
 * @returns {string} La URL pública de la imagen.
 */
function getPublicImageUrl(bucketName, imagePath, options = {}, fallbackUrl = 'img/logo_placeholder_small.png') {
    if (!window.supabaseClient || !imagePath || typeof imagePath !== 'string' || imagePath.startsWith('data:')) {
        return fallbackUrl;
    }
    const { data } = window.supabaseClient.storage.from(bucketName).getPublicUrl(imagePath, { transform: { resize: 'cover', ...options } });
    return data.publicUrl || fallbackUrl;
}

// --- API de Servidores y Widgets ---

export async function getServers() {
    const { data, error } = await window.supabaseClient
        .from('servers')
        .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, description, website_url, opening_date, votes_count, average_rating, review_count, status, created_at')
        .eq('status', 'aprobado')
        .order('created_at', { ascending: false });
    if (error) { console.error("API Error (getServers):", error); throw new Error("No se pudieron obtener los servidores."); }
    return data || [];
}

export async function getFeaturedServers() {
    const { data, error } = await window.supabaseClient
        .from('servers')
        .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, opening_date')
        .eq('status', 'aprobado')
        .eq('is_featured', true)
        .order('votes_count', { ascending: false, nullsFirst: false })
        .limit(8);
    if (error) { console.error("API Error (getFeaturedServers):", error); throw error; }
    return data;
}

export async function getServerOfTheMonth() {
    const { data, error } = await window.supabaseClient
        .from('servers')
        .select('id, name, image_url, banner_url, description, version, type, configuration, exp_rate, drop_rate, website_url, discord_url, opening_date, votes_count, average_rating, review_count')
        .eq('is_server_of_the_month', true)
        .maybeSingle();
    if (error) { console.error("API Error (getServerOfTheMonth):", error); throw error; }
    return data;
}

export async function getTopRankingWidget() {
    const { data, error } = await window.supabaseClient
        .from('servers')
        .select('id, name, image_url, votes_count, version, type, exp_rate')
        .eq('status', 'aprobado')
        .order('votes_count', { ascending: false, nullsFirst: false })
        .limit(5);
    if (error) { console.error("API Error (getTopRankingWidget):", error); throw error; }
    return data;
}

export async function getUpcomingOpeningsWidget() {
    const { data, error } = await window.supabaseClient
        .from('servers')
        .select('id, name, opening_date')
        .not('opening_date', 'is', null)
        .gt('opening_date', new Date().toISOString())
        .order('opening_date', { ascending: true })
        .limit(3);
    if (error) { console.error("API Error (getUpcomingOpeningsWidget):", error); throw error; }
    return data;
}

export async function getGlobalStats() {
    const [serverCount, userCount, votesData] = await Promise.all([
        window.supabaseClient.from('servers').select('*', { count: 'exact', head: true }).eq('status', 'aprobado'),
        window.supabaseClient.from('profiles').select('*', { count: 'exact', head: true }),
        window.supabaseClient.from('servers').select('votes_count').eq('status', 'aprobado')
    ]);
    if (serverCount.error || userCount.error || votesData.error) {
        console.error("API Error (getGlobalStats):", serverCount.error || userCount.error || votesData.error);
        return { totalServers: 0, totalUsers: 0, totalVotes: 0 };
    }
    const totalVotes = votesData.data ? votesData.data.reduce((acc, s) => acc + (s.votes_count || 0), 0) : 0;
    return { totalServers: serverCount.count, totalUsers: userCount.count, totalVotes: totalVotes };
}

export async function getExploreServers(filters) {
    let query = window.supabaseClient.from('servers')
        .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, description, website_url, opening_date, votes_count, average_rating')
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
        default: // 'default' is most voted
            query = query.order('is_featured', { ascending: false }).order('votes_count', { ascending: false, nullsFirst: false });
            break;
    }
    const { data, error } = await query;
    if (error) { console.error("API Error (getExploreServers):", error); throw error; }
    return data;
}

export async function getCalendarOpenings() {
    const { data, error } = await window.supabaseClient
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
    const { data, error } = await window.supabaseClient.from('servers').select('*, owner:user_id ( username, avatar_url )').eq('id', serverId).single();
    if (error) { console.error("API Error (getServerById):", error); throw new Error("No se pudo obtener el servidor."); }
    return data;
}

export async function getReviewsByServerId(serverId) {
    const { data, error } = await window.supabaseClient.from('reviews').select(`*, profiles ( username, avatar_url )`).eq('server_id', serverId).order('created_at', { ascending: false });
    if (error) { console.error("API Error (getReviewsByServerId):", error); throw error; }
    return data;
}

export async function addReview(reviewData) {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) throw new Error("Debes iniciar sesión para dejar una reseña.");
    const dataToInsert = { ...reviewData, user_id: session.user.id };
    const { error } = await window.supabaseClient.from('reviews').insert([dataToInsert]);
    if (error) { console.error("API Error (addReview):", error); throw new Error(error.message); }
}

export async function voteForServer(serverId) {
    const { data, error } = await window.supabaseClient.functions.invoke('vote-server', { body: { serverId: parseInt(serverId, 10) } });
    if (error) throw new Error("Error de red al intentar votar. Inténtalo de nuevo.");
    if (data.error) throw new Error(data.error);
    return data;
}

export async function getUserProfile(userId) {
    if (!userId) throw new Error("Se requiere un ID de usuario.");
    const { data, error } = await window.supabaseClient.from('profiles').select('id, username, avatar_url, role, status, updated_at').eq('id', userId).single();
    if (error) { console.error("API Error (getUserProfile):", error); throw new Error(`No se pudo obtener el perfil.`); }
    return data;
}

export async function getServersByUserId(userId) {
    const { data, error } = await window.supabaseClient.from('servers').select('id, name, image_url, version, type, status, created_at, votes_count, view_count, website_click_count, discord_click_count').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) { console.error("API Error (getServersByUserId):", error); throw new Error("No se pudieron obtener tus servidores."); }
    return data;
}

export async function getReviewsByUserId(userId) {
    const { data, error } = await window.supabaseClient.from('reviews').select('*, servers(id, name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
    if (error) { console.error("API Error (getReviewsByUserId):", error); throw new Error("No se pudieron obtener tus reseñas."); }
    return data;
}

export async function getOwnerDashboardStats(ownerId) {
    const { data, error } = await window.supabaseClient.from('servers').select('name, view_count, website_click_count, discord_click_count, votes_count').eq('user_id', ownerId);
    if (error) { console.error("API Error (getOwnerDashboardStats):", error); throw new Error("No se pudieron obtener las estadísticas del dashboard."); }
    return data;
}

export async function updateUserAvatar(userId, avatarPath) {
    const { error } = await window.supabaseClient.from('profiles').update({ avatar_url: avatarPath }).eq('id', userId);
    if (error) { console.error("API Error (updateUserAvatar):", error); throw new Error("No se pudo actualizar el avatar."); }
}

/**
 * --- INICIO DE LA CORRECCIÓN ---
 * Función de subida de archivos "a prueba de balas".
 * Incluye validaciones, logs detallados, y un timeout para evitar que la aplicación se congele.
 */
export async function uploadFile(file, bucket) {
    console.log(`[uploadFile] Iniciando subida: ${file.name} a bucket '${bucket}'`);

    // 1. Validaciones previas
    if (!file) {
        console.error("[uploadFile] Error: No se proporcionó ningún archivo.");
        throw new Error("No se seleccionó ningún archivo para subir.");
    }

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        console.error(`[uploadFile] Error: El archivo ${file.name} excede el límite de ${MAX_SIZE_MB}MB.`);
        throw new Error(`El archivo es demasiado grande. El límite es de ${MAX_SIZE_MB}MB.`);
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        console.error(`[uploadFile] Error: Tipo de archivo no permitido: ${file.type}`);
        throw new Error('Tipo de archivo no válido. Solo se permiten imágenes (JPEG, PNG, GIF, WebP).');
    }

    // 2. Verificación de sesión
    const { data: { session }, error: sessionError } = await window.supabaseClient.auth.getSession();
    if (sessionError || !session) {
        console.error("[uploadFile] Error: No hay sesión de usuario activa.");
        throw new Error("Debes iniciar sesión para subir archivos.");
    }
    console.log(`[uploadFile] Sesión verificada para usuario: ${session.user.id}`);

    // 3. Preparación del nombre del archivo
    const fileExtension = file.name.split('.').pop();
    const cleanFileName = file.name.substring(0, file.name.lastIndexOf('.')).replace(/[^a-zA-Z0-9_-]/g, '');
    const finalFileName = `${session.user.id}/${Date.now()}_${cleanFileName}.${fileExtension}`;
    console.log(`[uploadFile] Nombre de archivo final: ${finalFileName}`);

    // 4. Lógica de subida con Timeout
    const UPLOAD_TIMEOUT = 20000; // 20 segundos
    
    try {
        const uploadPromise = window.supabaseClient.storage
            .from(bucket)
            .upload(finalFileName, file, {
                cacheControl: '3600',
                upsert: false // No sobreescribir si ya existe
            });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('La subida del archivo tardó demasiado (Timeout). Revisa tu conexión a internet.')), UPLOAD_TIMEOUT);
        });

        // 5. Ejecutar la subida
        console.log("[uploadFile] Ejecutando Promise.race para la subida...");
        const result = await Promise.race([uploadPromise, timeoutPromise]);
        
        // La promesa de Supabase se resolvió, ahora verificamos si tuvo errores internos.
        if (result.error) {
            console.error('[uploadFile] Error devuelto por Supabase:', result.error);
            // Proporciona un mensaje más amigable basado en el error de Supabase
            if (result.error.message.includes("exceeds the maximum allowed size")) {
                throw new Error("El archivo excede el tamaño máximo permitido por el servidor.");
            }
            throw new Error(`Error del servidor de almacenamiento: ${result.error.message}`);
        }
        
        if (!result.data || !result.data.path) {
             console.error('[uploadFile] Error: La subida no devolvió una ruta de archivo válida.', result);
             throw new Error('El servidor de almacenamiento no devolvió una ruta válida para el archivo.');
        }

        console.log(`[uploadFile] Éxito. Ruta del archivo: ${result.data.path}`);
        return result.data.path;

    } catch (e) {
        // Captura tanto los errores del try como el error de timeout
        console.error(`[uploadFile] Fallo final en el proceso de subida:`, e);
        // Re-lanza el error para que sea capturado por el manejador del formulario.
        throw e;
    }
}
// --- FIN DE LA CORRECCIÓN ---


export async function addServer(serverData) {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) throw new Error("No estás autenticado.");
    const dataToInsert = { ...serverData, user_id: session.user.id, status: 'pendiente' };
    const { error } = await window.supabaseClient.from('servers').insert([dataToInsert]);
    if (error) { console.error("API Error (addServer):", error); throw new Error(error.message); }
}

export async function getServerForEdit(serverId, userId) {
    const { data: profile, error: profileError } = await window.supabaseClient.from('profiles').select('role').eq('id', userId).single();
    if (profileError) throw new Error("No se pudo verificar el usuario.");

    let query = window.supabaseClient.from('servers').select('*').eq('id', serverId);
    if (profile.role !== 'admin') {
        query = query.eq('user_id', userId);
    }
    const { data, error } = await query.single();
    if (error || !data) {
        throw new Error('Servidor no encontrado o no tienes permiso para editarlo.');
    }
    return data;
}

export async function updateServer(serverId, updatedData) {
    const { error } = await window.supabaseClient.from('servers').update(updatedData).eq('id', serverId);
    if (error) { console.error("API Error (updateServer):", error); throw error; }
}

export async function deleteServer(serverId) {
    const { error } = await window.supabaseClient.from('servers').delete().eq('id', serverId);
    if (error) { console.error("API Error (deleteServer):", error); throw error; }
}

export async function getServersByStatus(status) {
    const { data, error } = await window.supabaseClient.from('servers').select('id, name, image_url, version, type, status, created_at, user_id, owner:user_id (username)').eq('status', status);
    if (error) { console.error("API Error (getServersByStatus):", error); throw error; }
    return data;
}

export async function getAllServersForAdmin() {
    const { data, error } = await window.supabaseClient.from('servers').select('id, name, image_url, version, type, status, is_featured, created_at, user_id').neq('status', 'pendiente').order('created_at', { ascending: false });
    if (error) { console.error("API Error (getAllServersForAdmin):", error); throw error; }
    return data;
}

export async function getAllUsersForAdmin() {
    const { data, error } = await window.supabaseClient.from('profiles').select('id, username, email, avatar_url, role, status, updated_at');
    if (error) { console.error("API Error (getAllUsersForAdmin):", error); throw error; }
    return data.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
}

export async function updateUserProfile(userId, updateData) {
    const { error } = await window.supabaseClient.from('profiles').update(updateData).eq('id', userId);
    if (error) { console.error("API Error (updateUserProfile):", error); throw error; }
}

export async function getDataForSomAdmin() {
    const [winnerRes, serversRes] = await Promise.all([
        window.supabaseClient.from('servers').select('id, name, image_url').eq('is_server_of_the_month', true).maybeSingle(),
        window.supabaseClient.from('servers').select('id, name').eq('status', 'aprobado').order('name', { ascending: true })
    ]);
    if (winnerRes.error || serversRes.error) {
        const err = winnerRes.error || serversRes.error;
        throw new Error(`Error obteniendo datos del Servidor del Mes: ${err.message}`);
    }
    return { currentWinner: winnerRes.data, allServers: serversRes.data };
}

export async function setServerOfTheMonth(newWinnerId) {
    const { error } = await window.supabaseClient.rpc('set_server_of_the_month', { new_winner_id: newWinnerId });
    if (error) { console.error("API Error (setServerOfTheMonth):", error); throw new Error("No se pudo actualizar el Servidor del Mes."); }
}

export async function incrementServerView(serverId) {
    const { error } = await window.supabaseClient.rpc('increment_server_view', { server_id_param: serverId });
    if (error) console.error("API Error (incrementServerView):", error);
}

export async function incrementWebsiteClick(serverId) {
    const { error } = await window.supabaseClient.rpc('increment_website_click', { server_id_param: serverId });
    if (error) console.error("API Error (incrementWebsiteClick):", error);
}

export async function incrementDiscordClick(serverId) {
    const { error } = await window.supabaseClient.rpc('increment_discord_click', { server_id_param: serverId });
    if (error) console.error("API Error (incrementDiscordClick):", error);
}

export async function getRankingServers(rankingType = 'general', page = 1, pageSize = 15) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (rankingType === 'monthly') {
        const { data, error, count } = await window.supabaseClient
            .from('monthly_server_votes') 
            .select('*, average_rating, review_count', { count: 'exact' }) 
            .order('monthly_votes_count', { ascending: false, nullsFirst: false })
            .range(from, to);

        if (error) { 
            console.error("API Error (getRankingServers monthly):", error); 
            if (error.code === '42P01') { 
                 throw new Error("No se pudo encontrar la vista de ranking mensual ('monthly_server_votes').");
            }
            throw error; 
        }
        return { data: data || [], count };

    } else { // Ranking general
        const { data, error, count } = await window.supabaseClient
            .from('servers')
            .select('*, average_rating, review_count', { count: 'exact' })
            .eq('status', 'aprobado')
            .order('votes_count', { ascending: false, nullsFirst: false })
            .range(from, to);

        if (error) { 
            console.error("API Error (getRankingServers general):", error); 
            throw error; 
        }
        return { data: data || [], count };
    }
}