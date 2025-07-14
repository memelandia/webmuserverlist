// /js/main-app.js

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Aplicación MuServerList iniciada.");

    if (!window.supabaseClient) {
        console.error("❌ ERROR CRÍTICO: Cliente de Supabase no está disponible.");
        document.body.innerHTML = '<h1>Error de Conexión</h1><p>No se pudo conectar con el servicio. Por favor, recarga la página o inténtalo más tarde.</p>';
        return;
    }

    try {
        const pageId = document.body.id || 'unknown';
        console.log(`Página actual detectada: "${pageId}"`);

        // La autenticación es necesaria en casi todas las páginas
        const { initAuth } = await import('./modules/auth.js');
        await initAuth();

        // Cargar módulos específicos de la página dinámicamente
        switch (pageId) {
            case 'page-home':
                const { initHomePage } = await import('./main.js');
                initHomePage();
                break;
            case 'page-explorar':
                const { initExplorarPage } = await import('./explorar.js');
                initExplorarPage();
                break;
            case 'page-ranking':
                const { initRankingPage } = await import('./ranking.js');
                initRankingPage();
                break;
            case 'page-calendario':
                const { initCalendarioPage } = await import('./calendario.js');
                initCalendarioPage();
                break;
            case 'page-servidor':
                const { initServidorPage } = await import('./servidor.js');
                initServidorPage();
                break;
            case 'page-profile':
                const { initProfilePage } = await import('./profile.js');
                initProfilePage();
                break;
            case 'page-agregar':
                const { initAddServerPage } = await import('./add-server.js');
                initAddServerPage();
                break;
            case 'page-editar-servidor':
                const { initEditServerPage } = await import('./editar-servidor.js');
                initEditServerPage();
                break;
            case 'page-admin':
                 const { initAdminPage } = await import('./admin.js');
                 initAdminPage();
                break;
            default:
                console.log(`📄 Página "${pageId}" no requiere un módulo de inicialización específico.`);
                break;
        }
        console.log(`✅ Página "${pageId}" cargada correctamente.`);

    } catch (error) {
        console.error("❌ Error general al inicializar la aplicación:", error);
    }
});