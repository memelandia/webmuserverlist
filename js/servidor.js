// js/servidor.js

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

let lightbox = null;

export function initServidorPage() {
    console.log("🚀 Inicializando Página de Servidor (servidor.js)...");
    loadServerDetails();
}

async function loadServerDetails() {
    const mainContainer = document.getElementById('server-detail-content');
    if (!mainContainer) return;

    const urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get('id');

    if (!serverId) {
        ui.renderError(mainContainer, '<div class="page-header"><h1>Error: ID de servidor no especificado.</h1></div>');
        return;
    }
    
    ui.renderLoading(mainContainer, '<div class="loading-text" style="padding: 5rem 0;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Cargando datos del servidor...</p></div>');

    try {
        const server = await api.getServerById(serverId);
        document.title = `${server.name} - MuServerList`;
        
        ui.renderServerPage(mainContainer, server);
        
        // Inicializar GLightbox para la galería
        if (lightbox) lightbox.destroy();
        if (typeof GLightbox !== 'undefined') {
            lightbox = GLightbox({ selector: '.gallery-item' });
        }
        
        loadReviews(server.id);
        setupReviewForm(server.id);
        setupVoteButton(server.id);
        
    } catch (error) {
        console.error("Error cargando detalles del servidor:", error);
        document.title = 'Servidor no encontrado - MuServerList';
        ui.renderError(mainContainer, '<div class="page-header"><h1>Servidor no encontrado</h1><p>El servidor que buscas no existe o no está disponible.</p></div>');
    }
}

async function loadReviews(serverId) {
    const reviewsContainer = document.getElementById('reviews-list');
    if (!reviewsContainer) return;

    try {
        const reviews = await api.getReviewsByServerId(serverId);
        ui.renderReviews(reviewsContainer, reviews);
    } catch (error) {
        console.error("Error cargando reseñas:", error);
        ui.renderError(reviewsContainer, "<p>No se pudieron cargar las reseñas.</p>");
    }
}

async function setupReviewForm(serverId) {
    const form = document.getElementById('review-form');
    const loginPrompt = document.getElementById('review-login-prompt');
    if (!form || !loginPrompt) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (session) {
        try {
            const { data: existingReview, error } = await window.supabaseClient
                .from('reviews')
                .select('id')
                .eq('server_id', serverId)
                .eq('user_id', session.user.id)
                .maybeSingle(); // Usar maybeSingle para evitar error si no hay reseña

            if (error) throw error;
            
            if (existingReview) {
                loginPrompt.innerHTML = '<p>Ya has dejado una reseña en este servidor.</p>';
                form.classList.add('hidden');
                loginPrompt.classList.remove('hidden');
            } else {
                loginPrompt.classList.add('hidden');
                form.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Error verificando reseña existente:", error);
            loginPrompt.innerHTML = '<p>Error al verificar si ya has reseñado. Intenta recargar la página.</p>';
            form.classList.add('hidden');
            loginPrompt.classList.remove('hidden');
        }
    } else {
        form.classList.add('hidden');
        loginPrompt.classList.remove('hidden');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const feedbackEl = document.getElementById('review-feedback');
        const submitBtn = document.getElementById('submit-review-btn');
        const rating = form.rating.value;
        const comment = document.getElementById('review-comment').value.trim();
        
        if (!rating) {
            ui.setFormFeedback(feedbackEl, "Por favor, selecciona una puntuación.", 'error');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';
        
        try {
            await api.addReview({ server_id: serverId, rating: parseInt(rating), comment });

            ui.setFormFeedback(feedbackEl, "¡Reseña publicada con éxito!", 'success');
            setTimeout(() => {
                form.classList.add('hidden');
                loginPrompt.innerHTML = '<p>¡Gracias por tu reseña!</p>';
                loginPrompt.classList.remove('hidden');
                loadReviews(serverId); // Recargar las reseñas
            }, 2000);
            
        } catch (error) {
            ui.setFormFeedback(feedbackEl, `Error: ${error.message}`, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enviar';
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
        voteBtn.classList.add('disabled');
        return;
    }

    voteBtn.addEventListener('click', async () => {
        voteBtn.disabled = true;
        voteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Votando...';
        voteFeedback.className = 'feedback-message';

        try {
            const result = await api.voteForServer(serverId);
            
            voteFeedback.textContent = result.message || '¡Voto registrado con éxito!';
            voteFeedback.className = 'feedback-message success active';
            votesCountEl.textContent = parseInt(votesCountEl.textContent) + 1;
            voteBtn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Gracias por tu voto!';

        } catch (error) {
            voteFeedback.textContent = error.message;
            voteFeedback.className = 'feedback-message error active';
            voteBtn.innerHTML = error.message.includes('24 horas') 
                ? '<i class="fa-solid fa-clock"></i> Ya votaste hoy' 
                : '<i class="fa-solid fa-heart"></i> Votar de nuevo';

            if (!error.message.includes('24 horas')) {
                 setTimeout(() => { voteBtn.disabled = false; }, 3000);
            }
        } finally {
            setTimeout(() => { voteFeedback.classList.remove('active'); }, 5000);
        }
    });
}