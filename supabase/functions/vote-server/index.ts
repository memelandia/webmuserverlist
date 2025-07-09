import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Manejo de la solicitud pre-vuelo CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { serverId } = await req.json()
    if (!serverId) {
      throw new Error("El ID del servidor es requerido.");
    }

    // Crear un cliente de Supabase con los privilegios del usuario que hace la llamada.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // Verificar si el usuario está autenticado
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Debes iniciar sesión para votar.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      })
    }
    
    // Crear un cliente con 'service_role' para saltarse RLS al consultar y escribir
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Lógica del Cooldown: Verificar el último voto del usuario para este servidor
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: lastVote, error: voteError } = await supabaseAdmin
      .from('votes')
      .select('voted_at')
      .eq('user_id', user.id)
      .eq('server_id', serverId)
      .gt('voted_at', twentyFourHoursAgo)
      .single(); // Usamos single() para ver si existe al menos un voto reciente

    if (voteError && voteError.code !== 'PGRST116') { // PGRST116 = "No rows found", lo cual es bueno
        throw voteError;
    }

    if (lastVote) {
      return new Response(JSON.stringify({ error: 'Ya has votado por este servidor en las últimas 24 horas.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 429, // 429 Too Many Requests es un buen código para esto
      })
    }

    // Si pasó todas las validaciones, insertar el nuevo voto
    const { error: insertError } = await supabaseAdmin
      .from('votes')
      .insert({ user_id: user.id, server_id: serverId });

    if (insertError) {
      // Si el error es por la restricción UNIQUE del día, damos un mensaje más amigable
      if (insertError.code === '23505') {
          return new Response(JSON.stringify({ error: 'Ya has votado por este servidor hoy.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          });
      }
      throw insertError;
    }

    return new Response(JSON.stringify({ message: '¡Voto registrado con éxito!' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})