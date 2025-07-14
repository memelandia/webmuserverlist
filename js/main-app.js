// /js/main-app.js
// TEMPORAL: Imports simplificados para debugging
// import { initAuth } from './modules/auth.js';
// import { initHomePage } from './main.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Aplicación MuServerList iniciada.");

    try {
        // Verificar que Supabase esté disponible
        if (!window.supabaseClient) {
            console.log("⏳ Esperando Supabase...");
            await waitForSupabase();
        }

        console.log("✅ Supabase disponible");

        const pageId = document.body.id;
        console.log(`Página actual detectada: "${pageId}"`);

        // Cargar módulos dinámicamente según la página
        switch (pageId) {
            case 'page-home':
                console.log("🏠 Cargando página de inicio...");
                try {
                    const { initAuth } = await import('./modules/auth.js');
                    const { initHomePage } = await import('./main.js');

                    await initAuth();
                    initHomePage();
                    console.log("✅ Página de inicio cargada");
                } catch (error) {
                    console.error("❌ Error cargando página de inicio:", error);
                }
                break;
            case 'page-explorar':
                console.log("🔍 Cargando página de explorar...");
                try {
                    const { initAuth } = await import('./modules/auth.js');
                    const { initExplorarPage } = await import('./explorar.js');

                    await initAuth();
                    initExplorarPage();
                    console.log("✅ Página de explorar cargada");
                } catch (error) {
                    console.error("❌ Error cargando página de explorar:", error);
                }
                break;
            case 'page-ranking':
                console.log("🏆 Cargando página de ranking...");
                try {
                    const { initAuth } = await import('./modules/auth.js');
                    const { initRankingPage } = await import('./ranking.js');

                    await initAuth();
                    initRankingPage();
                    console.log("✅ Página de ranking cargada");
                } catch (error) {
                    console.error("❌ Error cargando página de ranking:", error);
                }
                break;
            case 'page-calendario':
                console.log("📅 Cargando página de calendario...");
                try {
                    const { initAuth } = await import('./modules/auth.js');
                    const { initCalendarioPage } = await import('./calendario.js');

                    await initAuth();
                    initCalendarioPage();
                    console.log("✅ Página de calendario cargada");
                } catch (error) {
                    console.error("❌ Error cargando página de calendario:", error);
                }
                break;
            case 'page-servidor':
                console.log("🖥️ Cargando página de servidor...");
                try {
                    const { initAuth } = await import('./modules/auth.js');
                    const { initServidorPage } = await import('./servidor.js');

                    await initAuth();
                    initServidorPage();
                    console.log("✅ Página de servidor cargada");
                } catch (error) {
                    console.error("❌ Error cargando página de servidor:", error);
                }
                break;
            case 'page-profile':
                console.log("👤 Cargando página de perfil...");
                try {
                    const { initAuth } = await import('./modules/auth.js');
                    const { initProfilePage } = await import('./profile.js');

                    await initAuth();
                    initProfilePage();
                    console.log("✅ Página de perfil cargada");
                } catch (error) {
                    console.error("❌ Error cargando página de perfil:", error);
                }
                break;
            default:
                console.log(`📄 Página "${pageId}" - cargando solo autenticación`);
                try {
                    const { initAuth } = await import('./modules/auth.js');
                    await initAuth();
                    console.log("✅ Autenticación cargada");
                } catch (error) {
                    console.error("❌ Error cargando autenticación:", error);
                }
                break;
        }
    } catch (error) {
        console.error("❌ Error general inicializando aplicación:", error);
    }
});

// Función para esperar a que Supabase esté disponible
function waitForSupabase() {
    return new Promise((resolve) => {
        const checkSupabase = () => {
            if (window.supabaseClient) {
                resolve();
            } else {
                setTimeout(checkSupabase, 100);
            }
        };
        checkSupabase();
    });
}