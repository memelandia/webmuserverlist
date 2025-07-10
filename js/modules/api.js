// js/modules/api.js (v19 - Con Ranking Definitivo)

const supabase = window.supabaseClient;

// --- API de Servidores y Widgets ---

export async function getFeaturedServers() {
    const { data, error } = await supabase.from('servers').select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, opening_date').eq('status', 'aprobado').eq('is_featured', true).limit(5);
    if (error) { console.error("API Error (getFeaturedServers):", error); throw error; }
    return data;
}

export async function getServerOfTheMonth() {
    const { data, error } = await supabase.from('servers').select('*').eq('is_server_of_the_month', true).single();
    if (error && error.code !== 'PGRST116') { console.error("API Error (getServerOfTheMonth):", error); throw error; }
    return data;
}

export async function getTopRankingWidget() {
    const { data, error } = await supabase.from('servers').select('id, name, image_url, votes_count, version, type, exp_rate').eq('status', 'aprobado').order('votes_count', { ascending: false, nullsFirst: false }).limit(5);
    if (error) { console.error("API Error (getTopRankingWidget):", error); throw error; }
    return data;
}

export async function getUpcomingOpeningsWidget() {
    const { data, error } = await supabase.from('servers').select('id, name, opening_date').not('opening_date', 'is', null).gt('opening_date', new Date().toISOString()).order('opening_date', { ascending: true }).limit(3);
    if (error) { console.error("API Error (getUpcomingOpeningsWidget):", error); throw error; }
    return data;
}

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
    let query = supabase.from('servers').select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, description, website_url, opening_date').eq('status', 'aprobado');
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
    const { data, error } = await supabase.from('servers').select('id, name, image_url, banner_url, description, version, type, configuration, exp_rate, opening_date').not('opening_date', 'is', null).gt('opening_date', new Date().toISOString()).order('opening_date', { ascending: true });
    if (error) { console.error("API Error (getCalendarOpenings):", error); throw error; }
    return data;
}

export async function getServerById(id) {
    const { data, error } = await supabase.from('servers').select('*').eq('id', id).in('status', ['aprobado', 'pendiente']).single();
    if (error) { console.error("API Error (getServerById):", error); throw new Error("Servidor no encontrado o no disponible."); }
    return data;
}

export async function getReviewsByServerId(serverId) {
    const { data, error } = await supabase.from('reviews').select(`*, profiles ( username, avatar_url )`).eq('server_id', serverId).order('created_at', { ascending: false });
    if (error) { console.error("API Error (getReviewsByServerId):", error); throw error; }
    return data;
}

// --- API de Funciones y Seguimiento ---

export async function voteForServer(serverId) {
    const { data, error } = await supabase.functions.invoke('vote-server', { body: { serverId: parseInt(serverId) } });
    if (error) throw new Error("Error de red. Inténtalo de nuevo.");
    if (data.error) throw new Error(data.error);
    return data;
}

export async function incrementServerView(serverId) {
    const { error } = await supabase.rpc('increment_server_view', { p_server_id: serverId });
    if (error) console.error('API Error (incrementServerView):', error.message);
}
export async function incrementWebsiteClick(serverId) {
    const { error } = await supabase.rpc('increment_website_click', { p_server_id: serverId });
    if (error) console.error('API Error (incrementWebsiteClick):', error.message);
}
export async function incrementDiscordClick(serverId) {
    const { error } = await supabase.rpc('increment_discord_click', { p_server_id: serverId });
    if (error) console.error('API Error (incrementDiscordClick):', error.message);
}


// --- API de Usuario y Perfil ---

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


// --- API de Formularios y Admin ---

export async function uploadFile(file, bucket) {
    if (!file) return null;
    const { data: buckets, error: bucketsError } = await window.supabaseClient.storage.listBuckets();
    if (bucketsError) throw new Error(`Error al verificar buckets: ${bucketsError.message}`);
    const bucketExists = buckets.some(b => b.name === bucket);
    if (!bucketExists) throw new Error(`El bucket "${bucket}" no existe en Supabase Storage.`);
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-_]/g, '')}`;
    if (file.size > 2 * 1024 * 1024) { throw new Error(`El archivo excede el límite de 2MB.`); }
    const { data, error } = await window.supabaseClient.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert: false });
    if (error) throw new Error(`Fallo al subir el archivo al Storage: ${error.message}`);
    return data.path;
}

export async function addServer(serverData) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No estás autenticado.");
    const dataToInsert = { ...serverData, user_id: session.user.id, status: 'pendiente' };
    const { error } = await supabase.from('servers').insert([dataToInsert]);
    if (error) { console.error("API Error (addServer):", error); throw new Error(error.message); }
}

export async function getServerForEdit(serverId, userId) {
    const { data: profile } = await getUserProfile(userId);
    let query = supabase.from('servers').select('*').eq('id', serverId);
    if (profile.role !== 'admin') query = query.eq('user_id', userId);
    const { data, error } = await query.single();
    if (error || !data) { console.error("API Error (getServerForEdit):", error); throw new Error('Servidor no encontrado o no tienes permiso para editarlo.'); }
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
    if (winnerRes.error || serversRes.error) { console.error("API Error (getDataForSomAdmin):", winnerRes.error || serversRes.error); throw new Error(winnerRes.error?.message || serversRes.error?.message); }
    return { currentWinner: winnerRes.data, allServers: serversRes.data };
}
export async function setServerOfTheMonth(newWinnerId) {
    const { error } = await supabase.rpc('set_server_of_the_month', { new_winner_id: newWinnerId });
    if (error) { console.error("API Error (setServerOfTheMonth):", error); throw new Error("No se pudo actualizar el Servidor del Mes."); }
}

// --- API de Ranking ---
// SOLUCIÓN DEFINITIVA Y ROBUSTA
export async function getRankingServers(rankingType = 'general', page = 1, pageSize = 15) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    if (rankingType === 'monthly') {
        try {
            // Primero, hagamos una consulta para ver la estructura de la vista
            const { data: viewStructure, error: structureError } = await supabase
                .from('monthly_server_votes')
                .select('*')
                .limit(1);
                
            if (structureError) throw structureError;
            
            // Determinamos el nombre de la columna que contiene el ID del servidor
            // Asumimos que puede ser 'id', 'server_id' o 'serverId'
            const serverIdColumn = Object.keys(viewStructure[0] || {}).find(
                key => key === 'id' || key === 'server_id' || key === 'serverId'
            ) || 'id';
            
            // Ahora hacemos la consulta real con el nombre correcto de la columna
            const { data: monthlyData, error: monthlyError, count } = await supabase
                .from('monthly_server_votes')
                .select(`*, ${serverIdColumn}`, { count: 'exact' })
                .order('monthly_votes_count', { ascending: false })
                .range(from, to);
                
            if (monthlyError) throw monthlyError;
            
            if (!monthlyData || monthlyData.length === 0) {
                return { data: [], count: 0 };
            }
            
            // Obtenemos los servidores correspondientes a esos IDs
            const serverIds = monthlyData.map(item => item[serverIdColumn]);
            const { data: serversData, error: serversError } = await supabase
                .from('servers')
                .select('*, average_rating, review_count')
                .eq('status', 'aprobado')
                .in('id', serverIds);
                
            if (serversError) throw serversError;
            
            // Combinamos los datos
            const resultData = monthlyData.map(monthlyItem => {
                const server = serversData.find(s => s.id === monthlyItem[serverIdColumn]);
                return server ? { 
                    ...server, 
                    monthly_votes_count: monthlyItem.monthly_votes_count 
                } : null;
            }).filter(Boolean);
            
            return { data: resultData, count };
        } catch (error) {
            console.error("API Error (getRankingServers - monthly):", error);
            throw error;
        }
    } else {
        // La consulta al ranking general se mantiene igual
        const { data, error, count } = await supabase
            .from('servers')
            .select('*, average_rating, review_count', { count: 'exact' })
            .eq('status', 'aprobado')
            .order('votes_count', { ascending: false, nullsFirst: false })
            .range(from, to);

        if (error) {
            console.error("API Error (getRankingServers - general):", error);
            throw error;
        }
        
        return { data, count };
    }
}
