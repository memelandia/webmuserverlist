// js/profile.js (v15 - Controlador de Perfil con Roles y Dashboard)

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

export async function initProfilePage() {
    console.log("🚀 Inicializando Página de Perfil Avanzada (profile.js)...");

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
        
        switch (profile.role) {
            case 'owner':
                await loadOwnerDashboard(profileContent, profile, session);
                break;
            case 'admin':
            case 'player':
            default:
                await loadPlayerProfile(profileContent, profile, session);
                break;
        }
        
        initAvatarUploader(session.user.id);

    } catch (error) {
        console.error("Error al cargar datos del perfil:", error);
        ui.renderError(profileContent, `<p class="error-text">No se pudieron cargar los datos del perfil. ${error.message}</p>`);
    }
}

async function loadPlayerProfile(container, profile, session) {
    ui.renderLoading(container, "Cargando tu información...");
    const [servers, reviews] = await Promise.all([
        api.getServersByUserId(session.user.id),
        api.getReviewsByUserId(session.user.id)
    ]);
    
    ui.renderPlayerProfile(container, { session, profile, servers, reviews });
}

async function loadOwnerDashboard(container, profile, session) {
    ui.renderLoading(container, "Cargando tu dashboard...");
    const [servers, reviews, dashboardStats] = await Promise.all([
        api.getServersByUserId(session.user.id),
        api.getReviewsByUserId(session.user.id),
        api.getOwnerDashboardStats(session.user.id)
    ]);

    ui.renderOwnerDashboard(container, { session, profile, servers, reviews, dashboardStats });

    if (typeof Chart !== 'undefined' && dashboardStats.length > 0) {
        ui.initOwnerCharts(dashboardStats);
    }
}

function initAvatarUploader(userId) {
    const uploadInput = document.getElementById('avatar-upload-input');
    const feedbackEl = document.getElementById('avatar-feedback');

    if (!uploadInput || !feedbackEl) return;

    uploadInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        feedbackEl.textContent = 'Subiendo...';
        feedbackEl.style.color = 'var(--text-secondary)';

        try {
            const avatarPath = await api.uploadFile(file, 'avatars');
            await api.updateUserAvatar(userId, avatarPath);
            
            feedbackEl.textContent = '¡Avatar actualizado!';
            feedbackEl.style.color = 'var(--success-color)';
            
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            console.error('Error al subir avatar:', error);
            feedbackEl.textContent = `Error: ${error.message}`;
            feedbackEl.style.color = 'var(--primary-color)';
        }
    });
}