// js/supabase-init.js

const SUPABASE_URL = 'https://bqipsuaxtkhcwtjawtpy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxaXBzdWF4dGtoY3d0amF3dHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNTcyNjIsImV4cCI6MjA2NjkzMzI2Mn0.XVbUzRExUXVGCu4WFS_qYSQrNFSXVKPCB2rqgvlNmeo';

try {
    // Adjuntamos el cliente de Supabase al objeto window para que sea accesible globalmente.
    // Esto es útil para una migración sencilla y para poder usarlo en módulos sin pasarlo como parámetro.
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Cliente Supabase inicializado GLOBALMENTE.');
} catch (error) {
    console.error('⛔ Error fatal inicializando Supabase:', error);
    // Opcional: Mostrar un mensaje de error al usuario en la UI
    document.body.innerHTML = '<h1>Error de Conexión</h1><p>No se pudo conectar con el servicio. Por favor, intente más tarde.</p>';
}