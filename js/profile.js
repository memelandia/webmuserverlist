// js/profile.js (v17 - Final con router de perfiles y subida de avatar)

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

export async function initProfilePage() {
    console.log("🚀 Inicializando Página de Perfil con Router de Roles (profile.js)...");

    const profileContent = document.getElementById('profile-content');
    if (!profileContent) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        ui.renderProfileLoginPrompt(profileContent);
        return;
    }

    ui.renderLoading(profileContent, "Cargando tu perfil...");

    try {
        const profile = await api.getUserProfile(session.user.id);
        
        // --- ROUTER DE PERFILES ---
        // Decide qué tipo de perfil o dashboard cargar basado en el rol del usuario.
        switch (profile.role) {
            case 'owner':
                await loadOwnerDashboard(profileContent, profile, session);
                break;
            case 'admin': // Admin ve el perfil de player por ahora, su panel es aparte.
            case 'player':
            default:
                await loadUserProfile(profileContent, profile, session);
                break;
        }
        
        // La inicialización del avatar se hace DESPUÉS de que el HTML del perfil esté renderizado.
        initAvatarUploader(session.user.id, profile);

    } catch (error) {
        console.error("Error crítico al cargar el perfil:", error);
        ui.renderError(profileContent, `<p class="error-text">No se pudieron cargar los datos del perfil. ${error.message}</p>`);
    }
}

// Carga el perfil estándar para 'player' o 'admin'
async function loadUserProfile(container, profile, session) {
    ui.renderLoading(container, "Cargando tu información...");
    // Usamos Promise.all para cargar servidores y reseñas en paralelo
    const [servers, reviews] = await Promise.all([
        api.getServersByUserId(session.user.id),
        api.getReviewsByUserId(session.user.id)
    ]);
    
    ui.renderUserProfile(container, { session, profile, servers, reviews });
}

// Carga el dashboard para un dueño de servidor ('owner')
async function loadOwnerDashboard(container, profile, session) {
    ui.renderLoading(container, "Cargando tu dashboard de creador...");
    // Cargamos todos los datos necesarios para el dashboard en paralelo
    const [servers, reviews, dashboardStats] = await Promise.all([
        api.getServersByUserId(session.user.id),
        api.getReviewsByUserId(session.user.id),
        api.getOwnerDashboardStats(session.user.id)
    ]);

    ui.renderOwnerDashboard(container, { session, profile, servers, reviews, dashboardStats });

    // Inicializamos los gráficos solo si hay datos y la librería Chart.js está disponible
    if (typeof Chart !== 'undefined' && dashboardStats && dashboardStats.length > 0) {
        ui.initOwnerCharts(dashboardStats);
    }
}

// Lógica para la subida del avatar
function initAvatarUploader(userId, profile) {
    const uploadInput = document.getElementById('avatar-upload-input');
    const feedbackEl = document.getElementById('avatar-feedback');

    if (!uploadInput || !feedbackEl) {
        console.warn("Elementos para subir avatar no encontrados en el DOM.");
        return;
    }

    uploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // Límite de 2MB
             feedbackEl.textContent = 'Archivo muy grande (máx 2MB).';
             feedbackEl.style.color = 'var(--primary-color)';
             uploadInput.value = ''; // Limpiar el input
             return;
        }

        feedbackEl.textContent = 'Subiendo...';
        feedbackEl.style.color = 'var(--text-secondary)';

        try {
            // Organizar avatares por usuario para mejor seguridad y organización
            const filePath = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-_]/g, '')}`;
            
            // Borrar avatar antiguo para no acumular basura en el Storage.
            if (profile.avatar_url) {
                try {
                    // La ruta guardada es solo el path, no el nombre del bucket
                    await window.supabaseClient.storage.from('avatars').remove([profile.avatar_url]);
                } catch (deleteError) {
                    console.warn('No se pudo eliminar el avatar anterior:', deleteError);
                    // No es un error crítico, continuamos con la subida
                }
            }
            
            // Subir nuevo avatar
            const { data, error } = await window.supabaseClient.storage
                .from('avatars')
                .upload(filePath, file, { 
                    cacheControl: '3600', 
                    upsert: false // No sobreescribir, generamos nombres únicos
                });
                
            if (error) throw error;
            
            // Actualizar el perfil del usuario con la nueva URL del avatar
            await api.updateUserAvatar(userId, filePath);
            
            feedbackEl.textContent = '¡Avatar actualizado!';
            feedbackEl.style.color = 'var(--success-color)';
            
            // Recargar la página para ver el cambio reflejado en todas partes
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            console.error('Error al subir avatar:', error);
            feedbackEl.textContent = `Error: ${error.message}`;
            feedbackEl.style.color = 'var(--primary-color)';
        }
    });
}