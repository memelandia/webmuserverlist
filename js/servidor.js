// js/servidor.js (v4 - Completo con Sistema de Votación vía Edge Function)

document.addEventListener('DOMContentLoaded', () => {
    initServidor();
});

async function initServidor() {
    const mainContainer = document.getElementById('server-detail-content');
    if (!mainContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get('id');

    if (!serverId) {
        mainContainer.innerHTML = `<div class="page-header"><h1 class="error-text">Error: ID de servidor no especificado.</h1></div>`;
        return;
    }

    try {
        const { data: server, error } = await window.supabaseClient
            .from('servers')
            .select('*')
            .eq('id', serverId)
            .in('status', ['aprobado', 'pendiente'])
            .single();

        if (error || !server) {
            throw new Error('Servidor no encontrado o no disponible.');
        }

        renderServerPage(server);
        loadReviews(server.id);
        setupReviewForm(server.id);
        setupVoteButton(server.id); // <-- Llamada a la nueva función de votación

    } catch (error) {
        console.error('Error al cargar el servidor:', error);
        mainContainer.innerHTML = `<div class="page-header"><h1 class="error-text">${error.message}</h1></div>`;
    }
}

function renderServerPage(server) {
    document.title = `${server.name} - MuServerList`;
    const mainContainer = document.getElementById('server-detail-content');

    const eventsHtml = (server.events && server.events.length > 0)
        ? server.events.map(event => `<span class="event-tag">${event}</span>`).join('')
        : '<p>No hay eventos principales especificados.</p>';

    const galleryUrls = Array.isArray(server.gallery_urls) ? server.gallery_urls :
        (server.gallery_urls ? [server.gallery_urls] : []);

    const galleryHtml = (galleryUrls.length > 0)
        ? galleryUrls.map(url => {
            // Optimizar cada imagen de la galería
            const imageUrl = Array.isArray(url) ? url[0] : url;
            const optimizedGalleryImage = getOptimizedImageUrl('server-gallery', imageUrl, { width: 800, height: 600 }, 'https://via.placeholder.com/800x600');
            return `<a href="${optimizedGalleryImage}" target="_blank" rel="noopener noreferrer"><img src="${optimizedGalleryImage}" alt="Galería de ${server.name}"></a>`;
        }).join('')
        : '<p>No hay imágenes en la galería.</p>';

    // Optimizar banner y logo
    const optimizedBanner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 1200, height: 300 }, 'https://via.placeholder.com/1200x300.png?text=Banner');
    const optimizedLogo = getOptimizedImageUrl('server-images', server.image_url, { width: 180, height: 180 }, 'https://via.placeholder.com/180.png?text=Logo');

    mainContainer.innerHTML = `
        <header class="server-header" style="background-image: linear-gradient(rgba(15, 15, 15, 0.8), var(--bg-dark)), url(${optimizedBanner});">
            <div class="container server-header-content">
                 <img src="${optimizedLogo}" alt="Logo de ${server.name}" class="server-logo-detail">
                 <div class="server-header-info">
                     <h1>${server.name}</h1>
                     <div class="server-header-tags">
                         <span><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                         <span><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                         <span><i class="fa-solid fa-heart"></i> <span id="votes-count">${server.votes_count || 0}</span> Votos</span>
                     </div>
                 </div>
                 <div class="server-header-actions">
                     <button id="vote-btn" class="btn btn-primary"><i class="fa-solid fa-heart"></i> Votar por este Servidor</button>
                     <a href="${server.website_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-solid fa-globe"></i> Página Web</a>
                     <a href="${server.discord_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-brands fa-discord"></i> Discord</a>
                 </div>
            </div>
        </header>
        <div class="container server-body-grid">
            <main class="server-main-column">
                <div class="widget">
                    <h3><i class="fa-solid fa-file-alt"></i> Descripción del Servidor</h3>
                    <div class="server-description" style="white-space: pre-wrap;">${server.description || 'No hay una descripción disponible para este servidor.'}</div>
                </div>
                 <div class="widget">
                    <h3><i class="fa-solid fa-images"></i> Galería</h3>
                    <div class="gallery-grid">${galleryHtml}</div>
                </div>
                <div class="widget">
                    <h3><i class="fa-solid fa-comments"></i> Reseñas de la Comunidad</h3>
                    <div id="reviews-list">
                        <p class="loading-text">Cargando reseñas...</p>
                    </div>
                    <hr style="border-color: var(--border-color); margin: 2rem 0;">
                    <h4>Deja tu reseña</h4>
                    <form id="review-form" class="hidden">
                         <div class="form-group">
                            <label>Tu Puntuación:</label>
                            <div class="star-rating" id="review-star-rating">
                                <input type="radio" id="review-star5" name="rating" value="5" required/><label for="review-star5" title="5 stars">★</label>
                                <input type="radio" id="review-star4" name="rating" value="4" /><label for="review-star4" title="4 stars">★</label>
                                <input type="radio" id="review-star3" name="rating" value="3" /><label for="review-star3" title="3 stars">★</label>
                                <input type="radio" id="review-star2" name="rating" value="2" /><label for="review-star2" title="2 stars">★</label>
                                <input type="radio" id="review-star1" name="rating" value="1" /><label for="review-star1" title="1 star">★</label>
                            </div>
                         </div>
                         <div class="form-group">
                             <label for="review-comment">Tu Comentario (opcional):</label>
                             <textarea id="review-comment" rows="4" placeholder="¿Qué te pareció el servidor?"></textarea>
                         </div>
                         <button type="submit" id="submit-review-btn" class="btn btn-primary">Enviar Reseña</button>
                         <div id="review-feedback" class="feedback-message"></div>
                    </form>
                    <div id="review-login-prompt">
                        <p>Debes <a href="#" id="login-link">iniciar sesión</a> para dejar una reseña.</p>
                    </div>
                </div>
            </main>
            <aside class="server-sidebar-column">
                 <div class="widget">
                    <h3><i class="fa-solid fa-circle-info"></i> Ficha Técnica</h3>
                    <ul class="tech-details-list">
                        <li><strong>Experiencia:</strong> <span>${server.exp_rate ? server.exp_rate + 'x' : 'N/A'}</span></li>
                        <li><strong>Drop Rate:</strong> <span>${server.drop_rate ? server.drop_rate + '%' : 'N/A'}</span></li>
                        <li><strong>Reset Info:</strong> <span>${server.reset_info || 'N/A'}</span></li>
                        <li><strong>Anti-Hack:</strong> <span>${server.antihack_info || 'N/A'}</span></li>
                    </ul>
                </div>
                <div class="widget">
                    <h3><i class="fa-solid fa-calendar-check"></i> Eventos Principales</h3>
                    <div class="events-list">${eventsHtml}</div>
                </div>
            </aside>
        </div>
        <!-- Contenedor para el feedback de la votación -->
        <div id="vote-feedback" class="feedback-message" style="position: fixed; top: 90px; right: 20px; z-index: 1002; width: auto; max-width: 300px;"></div>
    `;
}

async function loadReviews(serverId) {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    try {
        const { data: reviews, error } = await window.supabaseClient
            .from('reviews')
            .select(`*, profiles ( username, avatar_url )`)
            .eq('server_id', serverId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p>Este servidor aún no tiene reseñas. ¡Sé el primero!</p>';
            return;
        }

        reviewsList.innerHTML = reviews.map(review => {
            const profile = review.profiles || { username: 'Anónimo', avatar_url: '' };
            const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            return `
                <div class="review-card">
                    <div class="review-header">
                        <img src="${profile.avatar_url || 'https://via.placeholder.com/40'}" alt="avatar" class="review-avatar">
                        <div class="review-user-info">
                            <strong>${profile.username}</strong>
                            <span class="review-date">${new Date(review.created_at).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div class="review-stars" style="color:var(--primary-color);">${starsHtml}</div>
                    </div>
                    ${review.comment ? `<p class="review-comment">“${review.comment}”</p>` : ''}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar reseñas:', error);
        reviewsList.innerHTML = '<p class="error-text">No se pudieron cargar las reseñas.</p>';
    }
}

async function setupReviewForm(serverId) {
    const form = document.getElementById('review-form');
    const loginPrompt = document.getElementById('review-login-prompt');
    const submitBtn = document.getElementById('submit-review-btn');
    const feedbackEl = document.getElementById('review-feedback');

    if (!form || !loginPrompt) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (session) {
        const { data } = await window.supabaseClient
            .from('reviews')
            .select('id')
            .eq('server_id', serverId)
            .eq('user_id', session.user.id)
            .single();

        if (data) {
            loginPrompt.innerHTML = '<p>Ya has dejado una reseña en este servidor.</p>';
            loginPrompt.classList.remove('hidden');
            form.classList.add('hidden');
        } else {
            loginPrompt.classList.add('hidden');
            form.classList.remove('hidden');
        }

    } else {
        form.classList.add('hidden');
        loginPrompt.classList.remove('hidden');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rating = form.rating.value;
        const comment = document.getElementById('review-comment').value;

        if (!rating) {
            feedbackEl.textContent = "Por favor, selecciona una puntuación de estrellas.";
            feedbackEl.className = 'feedback-message error';
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
        feedbackEl.className = 'feedback-message';
        feedbackEl.textContent = '';

        try {
            const { error: insertError } = await window.supabaseClient
                .from('reviews')
                .insert({
                    server_id: serverId,
                    user_id: session.user.id,
                    rating: parseInt(rating),
                    comment: comment || null
                });

            if (insertError) throw insertError;

            feedbackEl.textContent = "¡Reseña publicada con éxito!";
            feedbackEl.className = 'feedback-message success';
            form.reset();

            setTimeout(() => {
                form.style.display = 'none';
                loginPrompt.innerHTML = '<p>Gracias por tu reseña.</p>';
                loginPrompt.classList.remove('hidden');
                loadReviews(serverId);
            }, 2000);

        } catch (error) {
            feedbackEl.textContent = `Error: ${error.message}`;
            feedbackEl.className = 'feedback-message error';
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enviar Reseña';
        }
    });
}

async function setupVoteButton(serverId) {
    const voteBtn = document.getElementById('vote-btn');
    const voteFeedback = document.getElementById('vote-feedback');
    const votesCountEl = document.getElementById('votes-count');

    if (!voteBtn || !voteFeedback || !votesCountEl) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        voteBtn.textContent = 'Inicia sesión para votar';
        voteBtn.disabled = true;
        voteBtn.addEventListener('click', () => {
             // Esto abre el modal de login que está definido en auth-modal.js
            const loginButton = document.getElementById('login-button-main');
            if (loginButton) loginButton.click();
        });
        return;
    }

    voteBtn.addEventListener('click', async () => {
        voteBtn.disabled = true;
        voteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Votando...';
        voteFeedback.textContent = '';
        voteFeedback.className = 'feedback-message';

        try {
            const { data, error } = await window.supabaseClient.functions.invoke('vote-server', {
                body: { serverId: parseInt(serverId) },
            });

            if (error) throw new Error("Error de red al intentar votar. Inténtalo de nuevo.");
            if (data.error) throw new Error(data.error);

            // Éxito
            voteFeedback.textContent = data.message || '¡Voto registrado!';
            voteFeedback.className = 'feedback-message success active';
            votesCountEl.textContent = parseInt(votesCountEl.textContent, 10) + 1;
            voteBtn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Gracias por votar!';
            // No se reactiva el botón, ya que el cooldown está activo.

        } catch (error) {
            voteFeedback.textContent = error.message;
            voteFeedback.className = 'feedback-message error active';
            
            // Si el error no es por cooldown, reactivamos el botón.
            if (!error.message.includes('24 horas') && !error.message.includes('hoy')) {
                 voteBtn.innerHTML = '<i class="fa-solid fa-heart"></i> Votar por este Servidor';
                 setTimeout(() => {
                    voteBtn.disabled = false;
                 }, 3000);
            } else {
                // Si es por cooldown, dejamos el botón desactivado.
                 voteBtn.innerHTML = '<i class="fa-solid fa-clock"></i> Ya has votado';
            }
        } finally {
            // Ocultar el mensaje de feedback después de unos segundos
            setTimeout(() => {
                voteFeedback.classList.remove('active');
            }, 5000);
        }
    });
}
