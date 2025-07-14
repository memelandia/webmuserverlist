-- Funciones RPC para incrementar contadores de métricas en MuServerList
-- Ejecutar estas funciones en el SQL Editor de Supabase

-- Función para incrementar el contador de vistas de servidor
CREATE OR REPLACE FUNCTION increment_server_view(server_id_param bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE servers 
    SET view_count = COALESCE(view_count, 0) + 1
    WHERE id = server_id_param;
END;
$$;

-- Función para incrementar el contador de clics en sitio web
CREATE OR REPLACE FUNCTION increment_website_click(server_id_param bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE servers 
    SET website_click_count = COALESCE(website_click_count, 0) + 1
    WHERE id = server_id_param;
END;
$$;

-- Función para incrementar el contador de clics en Discord
CREATE OR REPLACE FUNCTION increment_discord_click(server_id_param bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE servers 
    SET discord_click_count = COALESCE(discord_click_count, 0) + 1
    WHERE id = server_id_param;
END;
$$;

-- Verificar que las columnas existen (opcional - para debugging)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'servers'
-- AND column_name IN ('view_count', 'website_click_count', 'discord_click_count');

-- =====================================================
-- FUNCIÓN RPC OPTIMIZADA PARA HOMEPAGE
-- Combina todas las consultas de la homepage en una sola
-- Reduce de 8 consultas a 1 sola llamada
-- =====================================================

CREATE OR REPLACE FUNCTION get_homepage_data()
RETURNS JSON AS $$
DECLARE
    featured_servers JSON;
    server_of_month JSON;
    top_ranking JSON;
    upcoming_openings JSON;
    global_stats JSON;
    total_servers_count INTEGER;
    total_users_count INTEGER;
    total_votes_sum INTEGER;
    result JSON;
BEGIN
    -- 1. Servidores Destacados (Featured)
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'image_url', image_url,
            'banner_url', banner_url,
            'version', version,
            'type', type,
            'configuration', configuration,
            'exp_rate', exp_rate,
            'drop_rate', drop_rate,
            'opening_date', opening_date
        )
    ) INTO featured_servers
    FROM (
        SELECT id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, opening_date
        FROM servers
        WHERE status = 'aprobado' AND is_featured = true
        LIMIT 5
    ) featured;

    -- 2. Servidor del Mes
    SELECT row_to_json(som)
    INTO server_of_month
    FROM (
        SELECT *
        FROM servers
        WHERE is_server_of_the_month = true
        LIMIT 1
    ) som;

    -- 3. Top 5 Ranking
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'image_url', image_url,
            'votes_count', votes_count,
            'version', version,
            'type', type,
            'exp_rate', exp_rate
        )
    ) INTO top_ranking
    FROM (
        SELECT id, name, image_url, votes_count, version, type, exp_rate
        FROM servers
        WHERE status = 'aprobado'
        ORDER BY votes_count DESC NULLS LAST
        LIMIT 5
    ) ranking;

    -- 4. Próximas Aperturas
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'opening_date', opening_date
        )
    ) INTO upcoming_openings
    FROM (
        SELECT id, name, opening_date
        FROM servers
        WHERE opening_date IS NOT NULL
        AND opening_date > NOW()
        ORDER BY opening_date ASC
        LIMIT 3
    ) upcoming;

    -- 5. Estadísticas Globales
    -- Contar servidores aprobados
    SELECT COUNT(*) INTO total_servers_count
    FROM servers
    WHERE status = 'aprobado';

    -- Contar usuarios totales
    SELECT COUNT(*) INTO total_users_count
    FROM profiles;

    -- Sumar todos los votos
    SELECT COALESCE(SUM(votes_count), 0) INTO total_votes_sum
    FROM servers
    WHERE status = 'aprobado';

    -- Construir objeto de estadísticas
    SELECT json_build_object(
        'totalServers', total_servers_count,
        'totalUsers', total_users_count,
        'totalVotes', total_votes_sum
    ) INTO global_stats;

    -- 6. Construir resultado final
    SELECT json_build_object(
        'featuredServers', COALESCE(featured_servers, '[]'::json),
        'serverOfTheMonth', server_of_month,
        'topRanking', COALESCE(top_ranking, '[]'::json),
        'upcomingOpenings', COALESCE(upcoming_openings, '[]'::json),
        'globalStats', global_stats,
        'timestamp', extract(epoch from now()),
        'success', true
    ) INTO result;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'timestamp', extract(epoch from now())
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
