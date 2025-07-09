// js/profile.js (v5 - Con Reseñas del Usuario)

document.addEventListener('DOMContentLoaded', () => {
    initProfile();
});

async function initProfile() {
    const profileContent = document.getElementById('profile-content');
    if (!profileContent) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        profileContent.innerHTML = `
            <div class="widget" style="text-align: center;">
                <h2><i class="fa-solid fa-lock"></i> Acceso Restringido</h2>
                <p>Debes iniciar sesión para ver tu perfil.</p>
                <button id="login-redirect-btn" class="btn btn-primary">Iniciar Sesión</button>
            </div>
        `;
        return;
    }

    try {
        profileContent.innerHTML = `<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando perfil...</div>`;

        const [profileResponse, serversResponse, reviewsResponse] = await Promise.all([
            window.supabaseClient.from('profiles').select('*').eq('id', session.user.id).single(),
            window.supabaseClient.from('servers').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
            window.supabaseClient.from('reviews')
                .select('*, servers(name, id)')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false })
                .limit(5)
        ]);
        
        const { data: profile, error: profileError } = profileResponse;
        const { data: servers, error: serversError } = serversResponse;
        const { data: reviews, error: reviewsError } = reviewsResponse;

        if (profileError || serversError || reviewsError) {
            throw new Error(profileError?.message || serversError?.message || reviewsError?.message);
        }

        renderProfile(profile, servers || [], reviews || [], session);

    } catch (error) {
        console.error('Error al cargar datos del perfil:', error);
        profileContent.innerHTML = `<p class="error-text">No se pudieron cargar los datos del perfil. ${error.message}</p>`;
    }
}

function renderProfile(profile, servers, reviews, session) {
    const profileContent = document.getElementById('profile-content');
    
    const serversHtml = servers.length > 0 ? servers.map(server => `
        <div class="detail-card">
            <img src="${server.image_url || 'https://via.placeholder.com/45'}" alt="Logo" class="server-logo-table">
            <h4><a href="servidor.html?id=${server.id}" class="server-name">${server.name}</a></h4>
            <span class="status-tag status-${server.status || 'pendiente'}">${server.status || 'pendiente'}</span>
            <div class="actions">
                <a href="servidor.html?id=${server.id}" class="btn btn-sm btn-secondary">Ver</a>
                <a href="editar-servidor.html?id=${server.id}" class="btn btn-sm btn-primary">Editar</a>
            </div>
        </div>
    `).join('') : '<p>Aún no has añadido ningún servidor.</p>';

    const reviewsHtml = reviews.length > 0 ? reviews.map(review => {
        const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const serverName = review.servers ? review.servers.name : 'Servidor eliminado';
        const serverLink = review.servers ? `<a href="servidor.html?id=${review.servers.id}">${serverName}</a>` : serverName;

        return `
            <div class="user-review-card">
                <div class="review-header">
                    <div class="review-user-info">
                        <strong>Tu reseña para ${serverLink}</strong>
                        <span class="review-date">${new Date(review.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div class="review-stars" style="color:var(--primary-color);">${starsHtml}</div>
                </div>
                <p class="review-comment">"${review.comment || '<em>Sin comentario.</em>'}"</p>
            </div>
        `;
    }).join('') : '<p>Aún no has dejado ninguna reseña.</p>';

    profileContent.innerHTML = `
        <div class="page-header">
            <h1><i class="fa-solid fa-user-circle"></i> Mi Perfil</h1>
        </div>
        <div class="profile-grid">
            <aside class="profile-sidebar">
                <div class="widget">
                    <h2>${profile.username || 'Usuario'}</h2>
                    <p class="text-secondary">${session.user.email}</p>
                    <p class="text-secondary">Miembro desde: ${new Date(session.user.created_at).toLocaleDateString('es-ES')}</p>
                    <hr style="border-color: var(--border-color); margin: 1rem 0;">
                    <p><strong>Rol:</strong> <span class="status-tag status-${profile.role === 'admin' ? 'aprobado' : 'pendiente'}">${profile.role}</span></p>
                </div>
            </aside>
            <div class="profile-main-content">
                <div class="widget">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                        <h3>Mis Servidores</h3>
                        <a href="agregar.html" class="btn btn-primary btn-sm">Añadir Servidor</a>
                    </div>
                    <div class="servers-list">
                        ${serversHtml}
                    </div>
                </div>
                <div class="widget">
                    <h3><i class="fa-solid fa-comment-dots"></i> Mis Últimas Reseñas</h3>
                    <div class="user-reviews-list">
                        ${reviewsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para renderizar la lista de servidores del usuario
function renderUserServers(servers) {
    const serversContainer = document.getElementById('user-servers');
    if (!serversContainer) return;
    
    const serversHtml = servers.length > 0 ? servers.map(server => {
        // Usar la función de optimización de imágenes
        const optimizedLogo = getOptimizedImageUrl('server-images', server.image_url, { width: 90, height: 90 }, 'https://via.placeholder.com/45');
        
        return `
        <div class="detail-card">
            <img src="${optimizedLogo}" alt="Logo" class="server-logo-table" width="45" height="45">
            <h4><a href="servidor.html?id=${server.id}" class="server-name">${server.name}</a></h4>
            <span class="status-tag status-${server.status || 'pendiente'}">${server.status || 'pendiente'}</span>
            <div class="actions">
                <a href="servidor.html?id=${server.id}" class="btn btn-sm btn-secondary">Ver</a>
                <a href="editar-servidor.html?id=${server.id}" class="btn btn-sm btn-primary">Editar</a>
            </div>
        </div>
        `;
    }).join('') : '<p>Aún no has añadido ningún servidor.</p>';
    
    serversContainer.innerHTML = serversHtml;
}
