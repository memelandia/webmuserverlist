// js/modules/api-clean.js
// Versión limpia para test de restauración

export async function getFeaturedServers() {
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
    return data;
}

export async function getServerOfTheMonth() {
    const { data, error } = await window.supabaseClient
        .from('servers')
        .select('id, name, image_url, banner_url, description, version, type, configuration, exp_rate, drop_rate, website_url, discord_url, opening_date, votes_count, average_rating, review_count')
        .eq('is_server_of_the_month', true)
        .maybeSingle();
    if (error) { 
        console.error("API Error (getServerOfTheMonth):", error); 
        throw error; 
    }
    return data;
}

export async function getTopRankingWidget() {
    const { data, error } = await window.supabaseClient
        .from('servers')
        .select('id, name, image_url, votes_count, version, type, exp_rate')
        .eq('status', 'aprobado')
        .order('votes_count', { ascending: false, nullsFirst: false })
        .limit(5);
    if (error) { 
        console.error("API Error (getTopRankingWidget):", error); 
        throw error; 
    }
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
    if (error) { 
        console.error("API Error (getUpcomingOpeningsWidget):", error); 
        throw error; 
    }
    return data;
}

export async function getGlobalStats() {
    const [serverCount, userCount, votesData] = await Promise.all([
        window.supabaseClient.from('servers').select('*', { count: 'exact', head: true }).eq('status', 'aprobado'),
        window.supabaseClient.from('profiles').select('*', { count: 'exact', head: true }),
        window.supabaseClient.from('servers').select('votes_count').eq('status', 'aprobado')
    ]);

    if (serverCount.error || userCount.error || votesData.error) {
        const error = serverCount.error || userCount.error || votesData.error;
        console.error("API Error (getGlobalStats):", error);
        throw new Error("No se pudieron obtener las estadísticas globales.");
    }

    const totalVotes = votesData.data ? votesData.data.reduce((acc, s) => acc + (s.votes_count || 0), 0) : 0;
    return { totalServers: serverCount.count, totalUsers: userCount.count, totalVotes: totalVotes };
}

console.log('✅ API Clean module loaded');
