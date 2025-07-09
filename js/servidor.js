// js/servidor.js (v13 - Controlador de la Página de Servidor)

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
    
    ui.renderLoading(mainContainer, '<div style="padding: 5rem 0;"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p>Cargando datos del servidor...</p></div>');

    try {
        const server = await api.getServerById(serverId);
        
        document.title = `${server.name} - MuServerList`;
        
        // Renderizar la página principal
        ui.renderServerPage(mainContainer, server);
        
        // Inicializar GLightbox para la galería
        if (lightbox) lightbox.destroy();
        if (typeof GLightbox !== 'undefined') {
            lightbox = GLightbox({ selector: '.gallery-item' });
        }
        
        // Cargar las reseñas
        loadReviews(server.id);

        // Configurar los formularios y botones
        setupReviewForm(server.id);
        setupVoteButton(server.id, server.votes_count);
        
    } catch (error) {
        console.error("Error cargando detalles del servidor:", error);
        ui.renderError(mainContainer, '<div class="page-header"><h1>Servidor no encontrado o no disponible.</h1></div>');
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
        ui.renderError(reviewsContainer, "No se pudieron cargar las reseñas.");
    }
}

async function setupReviewForm(serverId) {
    const form = document.getElementById('review-form');
    const loginPrompt = document.getElementById('review-login-prompt');
    const feedbackEl = document.getElementById('review-feedback');
    const submitBtn = document.getElementById('submit-review-btn');
    if (!form || !loginPrompt) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (session) {
        const { data: existingReview } = await window.supabaseClient.from('reviews').select('id').eq('server_id', serverId).eq('user_id', session.user.id).single();
        
        if (existingReview) {
            loginPrompt.innerHTML = '<p>Ya has dejado una reseña en este servidor.</p>';
            form.classList.add('hidden');
            loginPrompt.classList.remove('hidden');
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
            feedbackEl.textContent = "Por favor, selecciona una puntuación.";
            feedbackEl.className = 'feedback-message error active';
            return;
        }

        submitBtn.disabled = true;
        feedbackEl.className = 'feedback-message';
        
        try {
            const { error } = await window.supabaseClient.from('reviews').insert({ server_id: serverId, user_id: session.user.id, rating: parseInt(rating), comment: comment || null });
            if (error) throw error;
            
            feedbackEl.textContent = "¡Reseña publicada!";
            feedbackEl.className = 'feedback-message success active';
            
            setTimeout(() => {
                form.style.display = 'none';
                loginPrompt.innerHTML = '<p>Gracias por tu reseña.</p>';
                loginPrompt.classList.remove('hidden');
                loadReviews(serverId);
            }, 2000);
            
        } catch (error) {
            feedbackEl.textContent = `Error: ${error.message}`;
            feedbackEl.className = 'feedback-message error active';
            submitBtn.disabled = false;
        }
    });
}

async function setupVoteButton(serverId, initialVotes) {
    const voteBtn = document.getElementById('vote-btn');
    const voteFeedback = document.getElementById('vote-feedback');
    const votesCountEl = document.getElementById('votes-count');
    if (!voteBtn) return;
    
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        voteBtn.textContent = 'Inicia sesión para votar';
        voteBtn.classList.add('disabled');
        return;
    }

    voteBtn.addEventListener('click', async () => {
        voteBtn.disabled = true;
        voteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        voteFeedback.className = 'feedback-message';

        try {
            const result = await api.voteForServer(serverId);
            
            voteFeedback.textContent = result.message || '¡Voto registrado!';
            voteFeedback.className = 'feedback-message success active';
            votesCountEl.textContent = initialVotes + 1;
            voteBtn.innerHTML = '<i class="fa-solid fa-check"></i> ¡Votado!';
        } catch (error) {
            voteFeedback.textContent = error.message;
            voteFeedback.className = 'feedback-message error active';
            voteBtn.innerHTML = error.message.includes('24 horas') 
                ? '<i class="fa-solid fa-clock"></i> Ya votaste' 
                : '<i class="fa-solid fa-heart"></i> Votar';

            if (!error.message.includes('24 horas')) {
                setTimeout(() => { voteBtn.disabled = false; }, 3000);
            }
        } finally {
            setTimeout(() => { voteFeedback.classList.remove('active'); }, 5000);
        }
    });
}