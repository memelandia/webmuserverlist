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
