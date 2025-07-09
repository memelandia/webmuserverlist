// js/profile.js (v13 - Controlador de la Página de Perfil)

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

// Función principal que se llamará desde main-app.js
export async function initProfilePage() {
    console.log("🚀 Inicializando Página de Perfil (profile.js)...");

    const profileContent = document.getElementById('profile-content');
    if (!profileContent) return;

    // Verificar sesión. Esto se puede hacer aquí o delegar a la UI
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        ui.renderProfileLoginPrompt(profileContent);
        return;
    }
    
    ui.renderLoading(profileContent);

    try {
        const [profile, servers, reviews] = await Promise.all([
            api.getUserProfile(session.user.id),
            api.getServersByUserId(session.user.id),
            api.getReviewsByUserId(session.user.id)
        ]);
        
        ui.renderProfilePage(profileContent, {
            session,
            profile,
            servers,
            reviews
        });

    } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
        ui.renderError(profileContent, `<p class="error-text">No se pudieron cargar los datos del perfil. ${error.message}</p>`);
    }
}