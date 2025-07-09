// supabase/functions/check-status/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Headers para permitir peticiones desde tu web (CORS)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // O la URL de tu web para más seguridad
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejar la petición pre-vuelo de CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extraer la URL del cuerpo de la petición
    const { url } = await req.json();
    if (!url || !url.startsWith('http')) {
      throw new Error("URL inválida o no proporcionada.");
    }

    let status = 'offline';
    try {
      // Intentar hacer una petición a la web del servidor
      // Timeout después de 5 segundos para no esperar indefinidamente
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      // Si la respuesta es exitosa (2xx), consideramos el servidor online
      if (response.ok) {
        status = 'online';
      }
    } catch (fetchError) {
      // Cualquier error en el fetch (timeout, DNS, etc.) significa offline
      status = 'offline';
    }
    
    // Devolver el estado
    const responseData = { status: status };
    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})