// /js/modules/api.js (v3 - Simplificado)

// Accedemos directamente al cliente global. Esto es más robusto.
const supabase = window.supabaseClient;

// --- API de Servidores ---

export async function getFeaturedServers() {
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, opening_date')
        .eq('status', 'aprobado')
        .eq('is_featured', true)
        .limit(5);
    if (error) throw error;
    return data;
}

export async function getServerOfTheMonth() {
    const { data, error } = await supabase
        .from('servers')
        .select('*')
        .eq('is_server_of_the_month', true)
        .single();
    if (error && error.code !== 'PGRST116') throw error; // Ignorar error "not found"
    return data;
}

export async function getTopRankingWidget() {
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, image_url, votes_count, version, type, exp_rate')
        .eq('status', 'aprobado')
        .order('votes_count', { ascending: false, nullsFirst: false })
        .limit(5);
    if (error) throw error;
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
    if (error) throw error;
    return data;
}

export async function getGlobalStats() {
    const [serverCount, userCount, votesData] = await Promise.all([
        supabase.from('servers').select('*', { count: 'exact', head: true }).eq('status', 'aprobado'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('servers').select('votes_count').eq('status', 'aprobado')
    ]);

    if (serverCount.error || userCount.error || votesData.error) {
        console.error("Error fetching stats:", serverCount.error || userCount.error || votesData.error);
        return { totalServers: 0, totalUsers: 0, totalVotes: 0 };
    }
    
    const totalVotes = votesData.data ? votesData.data.reduce((acc, s) => acc + (s.votes_count || 0), 0) : 0;

    return {
        totalServers: serverCount.count,
        totalUsers: userCount.count,
        totalVotes: totalVotes,
    };
}

export async function getExploreServers(filters) {
    let query = supabase
        .from('servers')
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
        default: query = query.order('votes_count', { ascending: false, nullsFirst: false }); break;
    }
    const { data, error } = await query.order('is_featured', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getCalendarOpenings() {
    const { data, error } = await supabase
        .from('servers')
        .select('id, name, image_url, banner_url, description, version, type, configuration, exp_rate, opening_date')
        .not('opening_date', 'is', null)
        .gt('opening_date', new Date().toISOString())
        .order('opening_date', { ascending: true });

    if (error) throw error;
    return data;
}


// --- API de Funciones (Votos, etc) ---

export async function voteForServer(serverId) {
    const { data, error } = await supabase.functions.invoke('vote-server', { 
        body: { serverId: parseInt(serverId) } 
    });
    if (error) throw new Error("Error de red. Inténtalo de nuevo.");
    if (data.error) throw new Error(data.error);
    return data;
}

// --- API de Usuario ---

export async function getUserProfile(userId) {
    const { data, error } = await supabase
        .from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
}

export async function getServersByUserId(userId) {
    const { data, error } = await supabase
        .from('servers').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}

export async function getReviewsByUserId(userId) {
    const { data, error } = await supabase
        .from('reviews').select('*, servers(id, name)').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
    if (error) throw error;
    return data;
}

export async function getServerById(id) {
    const { data, error } = await supabase
        .from('servers').select('*').eq('id', id).in('status', ['aprobado', 'pendiente']).single();
    if (error) throw error;
    return data;
}

export async function getReviewsByServerId(serverId) {
    const { data, error } = await supabase
        .from('reviews').select(`*, profiles ( username, avatar_url )`).eq('server_id', serverId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}


// --- API de Formularios (Add/Edit) y Admin ---

export async function uploadFile(file, bucket) {
    if (!file) return null;
    
    // Validar el archivo
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    if (file.size > 50 * 1024 * 1024) {
        throw new Error(`El archivo ${file.name} excede el límite de 50MB.`);
    }
    
    console.log(`Iniciando subida de ${file.name} (${file.size} bytes) a ${bucket}/${fileName}`);
    
    try {
        // Usamos window.supabaseClient para asegurar que estamos usando la instancia global
        const { data, error } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, { 
                cacheControl: '3600', 
                upsert: false 
            });
        
        if (error) {
            console.error("Error en Supabase Storage:", error);
            throw new Error(`Fallo al subir el archivo al Storage: ${error.message}`);
        }
        
        console.log(`Archivo subido exitosamente a ${bucket}/${fileName}`);
        return data.path;
    } catch (error) {
        console.error(`Error al subir archivo ${file.name}:`, error);
        throw error;
    }
}

export async function addServer(serverData) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No estás autenticado.");
    const dataToInsert = { ...serverData, user_id: session.user.id, status: 'pendiente' };
    const { error } = await supabase.from('servers').insert([dataToInsert]);
    if (error) throw new Error(error.message);
}

export async function getServerForEdit(serverId, userId) {
    const { data: profile } = await getUserProfile(userId);
    let query = supabase.from('servers').select('*').eq('id', serverId);
    if (profile.role !== 'admin') query = query.eq('user_id', userId);
    const { data, error } = await query.single();
    if (error || !data) throw new Error('Servidor no encontrado o no tienes permiso para editarlo.');
    return data;
}

export async function updateServer(serverId, updatedData) {
    const { error } = await supabase.from('servers').update(updatedData).eq('id', serverId);
    if (error) throw error;
}

// ... Resto de funciones de API del Admin
export async function getServersByStatus(status) {
    const { data, error } = await supabase.from('servers').select('*').eq('status', status);
    if (error) throw error;
    return data;
}
export async function getAllServersForAdmin() {
    const { data, error } = await supabase.from('servers').select('*').neq('status', 'pendiente').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
}
export async function deleteServer(serverId) {
    const { error } = await supabase.from('servers').delete().eq('id', serverId);
    if (error) throw error;
}
export async function getAllUsersForAdmin() {
    const { data, error } = await supabase.from('profiles').select('*').order('role');
    if (error) throw error;
    return data;
}
export async function updateUserProfile(userId, updateData) {
    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId);
    if (error) throw error;
}
export async function getDataForSomAdmin() {
    const [winnerRes, serversRes] = await Promise.all([
        supabase.from('servers').select('id, name, image_url').eq('is_server_of_the_month', true).maybeSingle(),
        supabase.from('servers').select('id, name').eq('status', 'aprobado').order('name', { ascending: true })
    ]);
    if (winnerRes.error || serversRes.error) throw new Error(winnerRes.error?.message || serversRes.error?.message);
    return { currentWinner: winnerRes.data, allServers: serversRes.data };
}
export async function setServerOfTheMonth(newWinnerId) {
    const { error } = await supabase.rpc('set_server_of_the_month', { new_winner_id: newWinnerId });
    if (error) throw new Error("No se pudo actualizar el Servidor del Mes.");
}

// --- API de Ranking ---

export async function getRankingServers(rankingType = 'general', page = 1, pageSize = 15) {
    console.log(`Obteniendo ranking ${rankingType}, página ${page}, tamaño ${pageSize}`);
    
    // Determinamos la tabla/vista a consultar según el tipo de ranking
    const source = rankingType === 'monthly' ? 'monthly_server_votes' : 'servers';
    
    let query = supabase
        .from(source)
        .select(`
            id, name, image_url, version, type, configuration, 
            exp_rate, drop_rate, votes_count
            ${rankingType === 'monthly' ? ', monthly_votes_count' : ''}
            , average_rating, review_count
        `)
        .eq('status', 'aprobado');
    
    // Ordenamos según el tipo de ranking
    if (rankingType === 'monthly') {
        query = query.order('monthly_votes_count', { ascending: false, nullsFirst: false });
    } else {
        query = query.order('votes_count', { ascending: false, nullsFirst: false });
    }
    
    // Calculamos el rango para la paginación
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // Obtenemos los datos paginados
    const { data, error, count } = await query
        .range(from, to)
        .order('is_featured', { ascending: false })
        .select('*', { count: 'exact' });
    
    if (error) {
        console.error("Error al obtener ranking:", error);
        throw error;
    }
    
    return { data, count };
}
