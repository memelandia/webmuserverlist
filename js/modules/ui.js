// /js/modules/ui.js (Versión corregida y completa)

// Este módulo contiene funciones para renderizar componentes de la UI.
// No contiene lógica de obtención de datos, solo los recibe y los muestra.

import { getOptimizedImageUrl, renderStars } from './utils.js';

// --- Funciones de Estado de Carga y Error ---
export function renderLoading(container, message = "Cargando...") {
    if (!container) return;
    container.innerHTML = `<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> ${message}</div>`;
}

export function renderError(container, message = "Error al cargar.") {
    if (!container) return;
    container.innerHTML = `<p class="error-text">${message}</p>`;
}

// --- Componentes de la Página de Inicio (main.js) ---

export function renderFeaturedCarousel(container, servers) {
    if (!container) return;
    if (!servers || servers.length === 0) {
        container.innerHTML = '<p class="text-secondary" style="padding: 2rem;text-align:center;">No hay servidores destacados en este momento.</p>';
        return;
    }
    
    container.innerHTML = servers.map(server => {
        const openingDate = server.opening_date ? new Date(server.opening_date) : null;
        const isFutureOpening = openingDate && openingDate > new Date();
        const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 180, height: 180 }, 'https://via.placeholder.com/90');
        const banner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 400, height: 150 }, 'https://via.placeholder.com/400x150.png?text=Banner');

        return `
        <div class="carousel-card">
            <a href="servidor.html?id=${server.id}" class="card-banner-link" style="background-image: url('${banner}');"></a>
            <div class="carousel-card-info">
                <img src="${logo}" alt="Logo de ${server.name}" class="carousel-card-logo">
                <div>
                    <h3><a href="servidor.html?id=${server.id}">${server.name}</a></h3>
                    <div class="carousel-card-meta">
                        <span title="Versión"><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                        <span title="Tipo"><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                         <span title="Configuración"><i class="fa-solid fa-cogs"></i> ${server.configuration || 'N/A'}</span>
                    </div>
                    ${isFutureOpening ? `<div class="carousel-card-opening"><i class="fa-solid fa-calendar-days"></i> Apertura: ${openingDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</div>` : ''}
                </div>
                <a href="servidor.html?id=${server.id}" class="btn btn-primary" style="margin-top: auto;"><i class="fa-solid fa-eye"></i> Ver Servidor</a>
            </div>
        </div>`;
    }).join('');
}

export function initCarouselControls() {
    const carousel = document.getElementById('featured-carousel');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    if (!carousel || !prevBtn || !nextBtn) return;
    
    const updateButtons = () => { 
        const canScroll = carousel.scrollWidth > carousel.clientWidth;
        prevBtn.style.display = nextBtn.style.display = canScroll ? 'block' : 'none';
    };

    setTimeout(() => {
        updateButtons();
        const card = carousel.querySelector('.carousel-card');
        if (!card) return;
        const scrollAmount = card.offsetWidth + 24;
        nextBtn.addEventListener('click', () => carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
        prevBtn.addEventListener('click', () => carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
        window.addEventListener('resize', updateButtons);
    }, 500);
}

export function renderServerOfTheMonth(container, server) {
    if (!container) return;
    container.innerHTML = ''; // Limpiar el loading
    if (!server) {
        container.innerHTML = `<div class="som-content"><span class="som-badge"><i class="fa-solid fa-medal"></i> Servidor del Mes</span><h2>Aún no hay ganador</h2><p>¡Vota por tus servidores favoritos para que aparezcan aquí!</p></div>`;
        container.style.backgroundImage = 'none';
        return;
    }

    const banner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 1200, height: 400, resize: 'cover' }, '');
    container.style.backgroundImage = `url('${banner}')`;
    container.innerHTML = `<div class="som-content">
        <span class="som-badge"><i class="fa-solid fa-medal"></i> Servidor del Mes</span>
        <h2>${server.name}</h2>
        <div class="som-stats">
            <span class="som-stat-item"><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
            <span class="som-stat-item"><i class="fa-solid fa-bolt"></i> ${server.exp_rate ? server.exp_rate + 'x' : 'N/A'}</span>
            <span class="som-stat-item"><i class="fa-solid fa-gem"></i> ${server.drop_rate ? server.drop_rate + '%' : 'N/A'}</span>
        </div>
        <a href="servidor.html?id=${server.id}" class="btn btn-primary btn-lg">Ver Servidor</a>
    </div>`;
}

export function renderRankingWidget(container, servers) {
    if (!container) return;
    if (!servers || servers.length === 0) {
        container.innerHTML = '<p class="text-secondary" style="padding:1rem; text-align:center;">No hay servidores en el ranking.</p>';
        return;
    }
    
    container.innerHTML = servers.map((server, index) => {
        const medalIcon = ['gold', 'silver', 'bronze'][index] 
            ? `<i class="fa-solid fa-medal rank-medal ${['gold', 'silver', 'bronze'][index]}"></i>` : '';
        const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 80, height: 80 }, 'https://via.placeholder.com/40');
        
        return `
        <a href="servidor.html?id=${server.id}" class="ranking-item-link">
            <li class="ranking-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                <div class="rank-position-container">
                    <span class="rank-number">${index + 1}</span>
                    ${medalIcon}
                </div>
                <img src="${logo}" alt="${server.name}" class="ranking-logo-icon" width="40" height="40">
                <div class="ranking-item-info">
                    <span class="ranking-name">${server.name}</span>
                    <small>${server.version || 'N/A'}</small>
                </div>
                <div class="ranking-item-stats">
                    <span><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                    <span><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg> ${server.exp_rate || '?'}x</span>
                </div>
            </li>
        </a>`;
    }).join('');
}

export function renderCalendarWidget(container, servers) {
    if (!container) return;
    if (!servers || servers.length === 0) {
        container.innerHTML = '<p class="text-secondary" style="padding:1rem; text-align:center;">No hay próximas aperturas programadas.</p>';
        return;
    }
    container.innerHTML = servers.map(server => {
        const date = new Date(server.opening_date);
        return `
        <a href="servidor.html?id=${server.id}" class="opening-item-widget">
            <div class="opening-date-box">
                <span class="day">${date.getDate()}</span>
                <span class="month">${date.toLocaleString('es-ES', { month: 'short' }).replace('.', '').toUpperCase()}</span>
            </div>
            <div class="opening-info">
                <h4>${server.name}</h4>
                <p>${date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <i class="fa-solid fa-chevron-right arrow-icon"></i>
        </a>`;
    }).join('');
}

export function renderGlobalStats(stats) {
    const srvEl = document.getElementById('total-servers');
    const vtsEl = document.getElementById('total-votes');
    const usrEl = document.getElementById('total-users');

    if(srvEl) srvEl.textContent = stats.totalServers || 0;
    if(vtsEl) vtsEl.textContent = stats.totalVotes || 0;
    if(usrEl) usrEl.textContent = stats.totalUsers || 0;
}

// --- Componentes de la Página de Ranking ---

export function updateRankingFilterButtons(activeType) {
    const generalBtn = document.getElementById('rank-general-btn');
    const monthlyBtn = document.getElementById('rank-monthly-btn');
    if (!generalBtn || !monthlyBtn) return;
    
    if (activeType === 'general') {
        generalBtn.classList.add('btn-primary', 'active'); generalBtn.classList.remove('btn-secondary');
        monthlyBtn.classList.add('btn-secondary'); monthlyBtn.classList.remove('btn-primary', 'active');
    } else {
        monthlyBtn.classList.add('btn-primary', 'active'); monthlyBtn.classList.remove('btn-secondary');
        generalBtn.classList.add('btn-secondary'); generalBtn.classList.remove('btn-primary', 'active');
    }
}

export function renderRankingTable(container, servers, options) {
    if (!container) return;
    if (!servers || servers.length === 0) {
        renderError(container, '<tr><td colspan="9" style="text-align:center; padding: 2rem;">No se encontraron servidores.</td></tr>');
        return;
    }
    
    container.innerHTML = servers.map((server, index) => {
        const position = (options.page - 1) * options.pageSize + index + 1;
        const votes = options.rankingType === 'monthly' ? (server.monthly_votes_count || 0) : (server.votes_count || 0);
        const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 90, height: 90 }, 'https://via.placeholder.com/45');
        
        return `
            <tr>
                <td><span class="rank-position">${position}</span></td>
                <td class="server-info-cell">
                    <img src="${logo}" alt="Logo de ${server.name}" class="server-logo-table" width="45" height="45">
                    <div>
                        <a href="servidor.html?id=${server.id}" class="server-name-link">${server.name}</a>
                        <div class="server-version-tag">${server.version || 'N/A'}</div>
                    </div>
                </td>
                <td class="table-rating">
                    ${renderStars(server.average_rating)}
                    <span class="review-count">(${server.review_count || 0})</span>
                </td>
                <td>${server.type || 'N/A'}</td>
                <td>${server.configuration || 'N/A'}</td>
                <td>${server.exp_rate ? server.exp_rate + 'x' : 'N/A'}</td>
                <td>${server.drop_rate ? server.drop_rate + '%' : 'N/A'}</td>
                <td class="votes-count">${votes}</td>
                <td><a href="servidor.html?id=${server.id}" class="btn btn-primary btn-sm">Ver</a></td>
            </tr>
        `;
    }).join('');
}

export function renderPagination(container, totalItems, currentPage, pageSize) {
    if (!container) return;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = `
        <button class="btn btn-secondary" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-chevron-left"></i> Anterior
        </button>
        <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
        <button class="btn btn-secondary" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
            Siguiente <i class="fa-solid fa-chevron-right"></i>
        </button>`;
}
// Añade estas funciones a /js/modules/ui.js

// --- Componentes de la Página de Explorar ---

const expSteps = [1, 5, 10, 20, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 2000, 5000, 9999, 100000];

function getExpValueFromSlider(sliderValue) {
    return expSteps[parseInt(sliderValue, 10)];
}

export function initExpSlider() {
    const expSlider = document.getElementById('filter-exp-slider');
    const expValueSpan = document.getElementById('exp-value');
    if (!expSlider || !expValueSpan) return;

    const updateLabel = () => {
        const value = getExpValueFromSlider(expSlider.value);
        expValueSpan.textContent = value >= 99999 ? 'Cualquiera' : `≤ ${value}x`;
    };

    expSlider.addEventListener('input', updateLabel);
    updateLabel(); // Estado inicial
}

export function getExploreFilters() {
    return {
        name: document.getElementById('filter-name').value.trim(),
        version: document.getElementById('filter-version').value,
        type: document.getElementById('filter-type').value,
        configuration: document.getElementById('filter-configuration').value,
        exp: getExpValueFromSlider(document.getElementById('filter-exp-slider').value),
        sort: document.getElementById('filter-sort').value
    };
}

async function checkServerStatus(serverId, url) {
    const statusBadge = document.getElementById(`status-${serverId}`);
    if (!statusBadge) return;
    
    // La URL no es un buen indicador de status. Lo dejaremos pendiente
    // por ahora, o necesitaremos un endpoint real del servidor de juego.
    // De momento lo ocultamos para no mostrar un 'loading' eterno.
    statusBadge.style.display = 'none';
}


export function renderExploreServers(container, servers) {
    if (!container) return;
    if (!servers || servers.length === 0) {
        renderError(container, '<p style="text-align: center; grid-column: 1 / -1;">No se encontraron servidores con los filtros aplicados.</p>');
        return;
    }

    container.innerHTML = servers.map(server => {
        const shortDescription = server.description ? (server.description.substring(0, 100) + '...') : 'Sin descripción.';
        const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 160, height: 160 }, 'https://via.placeholder.com/80');
        const banner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 400, height: 120 }, 'https://via.placeholder.com/400x120.png?text=Banner');
        
        return `
        <div class="server-card-new">
            <div class="card-banner" style="background-image: url('${banner}')"></div>
            <div class="card-header">
                <img src="${logo}" alt="Logo de ${server.name}" class="card-logo" width="80" height="80" loading="lazy">
                <div class="card-status">
                    <div class="status-badge loading" id="status-${server.id}"><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>
            </div>
            <div class="card-content">
                <h3>${server.name}</h3>
                <div class="card-tags-icons">
                    <span class="card-tag-icon" title="Versión"><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                    <span class="card-tag-icon" title="Tipo"><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                    <span class="card-tag-icon" title="Experiencia"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg> ${server.exp_rate || '?'}x</span>
                    <span class="card-tag-icon" title="Drop"><i class="fa-solid fa-gem"></i> ${server.drop_rate || '?'}%</span>
                </div>
                <p class="card-description">${shortDescription}</p>
            </div>
            <div class="card-actions">
                 <a href="${server.website_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-solid fa-globe"></i> Sitio Web</a>
                 <a href="servidor.html?id=${server.id}" class="btn btn-primary"><i class="fa-solid fa-eye"></i> Ver Detalles</a>
            </div>
        </div>`;
    }).join('');
    
    servers.forEach(server => checkServerStatus(server.id, server.website_url));
}

// Añade estas funciones a /js/modules/ui.js

// --- Componentes de la Página de Calendario ---

let runningCountdownTimers = [];

export function startCountdownTimers() {
    // Limpiar timers anteriores para evitar fugas de memoria
    if (runningCountdownTimers.length > 0) {
        runningCountdownTimers.forEach(timer => clearInterval(timer));
        runningCountdownTimers = [];
    }

    document.querySelectorAll('[data-countdown]').forEach(card => {
        const target = new Date(card.dataset.countdown).getTime();
        const countdownEl = card.querySelector('.card-countdown');
        if (!countdownEl) return;
        
        const updateTimer = () => {
            const diff = target - Date.now();
            if (diff <= 0) {
                if (timer) clearInterval(timer);
                countdownEl.innerHTML = '<div class="countdown-live"><i class="fa-solid fa-circle-play"></i> ¡YA ABIERTO!</div>';
                return;
            }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            
            countdownEl.innerHTML = `
                <div class="countdown-main">
                    <span class="days">${d}</span>d
                </div>
                <div class="countdown-secondary">
                    ${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s
                </div>
            `;
        };
        
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        runningCountdownTimers.push(timer);
    });
}

export function renderCalendarPage(container, servers) {
    if (!container) return;
    if (!servers || servers.length === 0) {
        renderError(container, '<p style="text-align: center; padding: 2rem;">No hay próximas aperturas programadas.</p>');
        return;
    }
    
    container.innerHTML = servers.map(server => {
        const shortDescription = server.description ? (server.description.substring(0, 80) + '...') : 'Sin descripción.';
        const banner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 400, height: 120 }, 'https://via.placeholder.com/400x120.png?text=Banner');
        const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 120, height: 120 }, 'https://via.placeholder.com/60');
        
        const date = new Date(server.opening_date);
        const day = date.getDate();
        const month = date.toLocaleString('es-ES', { month: 'short' }).replace('.', '');

        return `
        <div class="calendar-card" data-countdown="${server.opening_date}">
            <div class="calendar-card-banner" style="background-image: url('${banner}');">
                <div class="calendar-date">
                    <span class="calendar-day">${day}</span>
                    <span class="calendar-month">${month.toUpperCase()}</span>
                </div>
            </div>
            <div class="calendar-card-content">
                <div class="calendar-card-header">
                    <img src="${logo}" alt="Logo de ${server.name}" class="calendar-card-logo" loading="lazy">
                    <h3><a href="servidor.html?id=${server.id}">${server.name}</a></h3>
                </div>
                <p class="calendar-card-description">${shortDescription}</p>
                <div class="calendar-card-meta">
                    <span><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                    <span><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                </div>
                <a href="servidor.html?id=${server.id}" class="btn btn-primary btn-sm">Ver Detalles</a>
            </div>
            <div class="card-countdown">
                <!-- El contador se renderiza aquí por JS -->
            </div>
        </div>`;
    }).join('');
}

// Añade estas funciones a /js/modules/ui.js

// --- Componentes de la Página de Servidor ---

function getEventIcon(eventName) {
    const iconMap = { 'Blood Castle': 'fa-solid fa-chess-rook', 'Devil Square': 'fa-solid fa-square', 'Chaos Castle': 'fa-solid fa-dungeon', 'Illusion Temple': 'fa-solid fa-eye', 'Doppelganger': 'fa-solid fa-clone', 'Castle Siege': 'fa-brands fa-fort-awesome', 'Crywolf Event': 'fa-brands fa-wolf-pack-battalion', 'Kanturu Event': 'fa-solid fa-biohazard', 'Last Man Standing': 'fa-solid fa-khanda', 'Golden Invasion': 'fa-solid fa-dragon', 'White Wizard': 'fa-solid fa-hat-wizard', 'Invasión de Conejos': 'fa-solid fa-carrot' };
    return iconMap[eventName] || 'fa-solid fa-star';
}

export function renderServerPage(container, server) {
    const eventsHtml = (server.events && server.events.length > 0)
        ? server.events.map(event => `<span class="event-tag"><i class="${getEventIcon(event)}"></i> ${event}</span>`).join('')
        : '<p>No hay eventos principales especificados.</p>';
        
    const galleryUrls = Array.isArray(server.gallery_urls) ? server.gallery_urls : [];
    const galleryHtml = galleryUrls.length > 0 
        ? galleryUrls.map(imgPath => {
            const fullUrl = getOptimizedImageUrl('server-gallery', imgPath, { quality: 85 });
            const thumbUrl = getOptimizedImageUrl('server-gallery', imgPath, { width: 300, height: 200, resize: 'cover' });
            return `<a href="${fullUrl}" class="gallery-item" data-gallery="server-gallery"><img src="${thumbUrl}" alt="Galería de ${server.name}" loading="lazy"></a>`;
        }).join('')
        : '<p>Este servidor no tiene imágenes en la galería.</p>';

    const banner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 1200, quality: 80 }, 'https://via.placeholder.com/1200x300.png?text=Banner');
    const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 360, height: 360 }, 'https://via.placeholder.com/180.png?text=Logo');
    
    // Convertir descripción de Markdown a HTML si existe, si no, un mensaje.
    const descriptionHtml = server.description
        ? (typeof showdown !== 'undefined' ? new showdown.Converter().makeHtml(server.description) : server.description)
        : 'No hay una descripción disponible para este servidor.';
        
    container.innerHTML = `
        <header class="server-header" style="background-image: linear-gradient(rgba(15, 15, 15, 0.8), var(--bg-dark)), url(${banner});">
            <div class="container server-header-content">
                 <img src="${logo}" alt="Logo de ${server.name}" class="server-logo-detail" width="180" height="180">
                 <div class="server-header-info">
                     <h1>${server.name}</h1>
                     <div class="server-header-tags">
                         <span><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                         <span><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                         <span><i class="fa-solid fa-heart"></i> <span id="votes-count">${server.votes_count || 0}</span> Votos</span>
                     </div>
                 </div>
                 <div class="server-header-actions">
                     <button id="vote-btn" class="btn btn-primary btn-lg"><i class="fa-solid fa-heart"></i> Votar</button>
                     <a href="${server.website_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-solid fa-globe"></i> Web</a>
                 </div>
            </div>
        </header>
        <div class="container server-body-grid page-container" style="padding-top:3rem;">
            <main class="server-main-column">
                <div class="widget"><h3 class="widget-title"><i class="fa-solid fa-file-alt"></i> Descripción</h3><div class="server-description-content">${descriptionHtml}</div></div>
                <div class="widget"><h3 class="widget-title"><i class="fa-solid fa-images"></i> Galería</h3><div class="gallery-grid">${galleryHtml}</div></div>
                <div class="widget" id="reviews-widget"></div>
            </main>
            <aside class="server-sidebar-column">
                <div class="widget">
                    <h3 class="widget-title"><i class="fa-solid fa-circle-info"></i> Ficha Técnica</h3>
                    <ul class="tech-details-list">
                        <li><strong><i class="fa-solid fa-cogs"></i>Configuración</strong> <span>${server.configuration || 'N/A'}</span></li>
                        <li><strong><i class="fa-solid fa-bolt"></i>Experiencia</strong> <span>${server.exp_rate ? server.exp_rate + 'x' : 'N/A'}</span></li>
                        <li><strong><i class="fa-solid fa-gem"></i>Drop Rate</strong> <span>${server.drop_rate ? server.drop_rate + '%' : 'N/A'}</span></li>
                        <li><strong><i class="fa-solid fa-sync-alt"></i>Reset Info</strong> <span>${server.reset_info || 'N/A'}</span></li>
                    </ul>
                </div>
                <div class="widget"><h3 class="widget-title"><i class="fa-solid fa-calendar-check"></i> Eventos</h3><div class="events-list">${eventsHtml}</div></div>
            </aside>
        </div>
        <div id="vote-feedback" class="feedback-message" style="position: fixed; top: 90px; right: 20px; z-index: 1002; width: auto; max-width: 300px;"></div>
    `;

    document.getElementById('reviews-widget').innerHTML = `
        <h3 class="widget-title"><i class="fa-solid fa-comments"></i> Reseñas</h3>
        <div id="reviews-list"><p class="loading-text">Cargando reseñas...</p></div>
        <hr style="border-color: var(--border-color); margin: 2rem 0;">
        <h4>Deja tu reseña</h4>
        <form id="review-form" class="hidden">
            <div class="form-group"><label>Puntuación:</label><div class="star-rating"><input type="radio" id="review-star5" name="rating" value="5" required/><label for="review-star5" title="5">★</label><input type="radio" id="review-star4" name="rating" value="4"/><label for="review-star4" title="4">★</label><input type="radio" id="review-star3" name="rating" value="3"/><label for="review-star3" title="3">★</label><input type="radio" id="review-star2" name="rating" value="2"/><label for="review-star2" title="2">★</label><input type="radio" id="review-star1" name="rating" value="1"/><label for="review-star1" title="1">★</label></div></div>
            <div class="form-group"><label for="review-comment">Comentario (opcional):</label><textarea id="review-comment" rows="4" placeholder="¿Qué te pareció?"></textarea></div>
            <button type="submit" id="submit-review-btn" class="btn btn-primary">Enviar</button>
            <div id="review-feedback" class="feedback-message"></div>
        </form>
        <div id="review-login-prompt"><p>Debes <a href="#" id="login-link">iniciar sesión</a> para dejar una reseña.</p></div>
    `;
}

export function renderReviews(container, reviews) {
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<p>Este servidor aún no tiene reseñas. ¡Sé el primero!</p>';
        return;
    }
    container.innerHTML = reviews.map(review => {
        const profile = review.profiles || { username: 'Anónimo', avatar_url: '' };
        const stars = renderStars(review.rating);
        const avatar = getOptimizedImageUrl('avatars', profile.avatar_url, { width: 80, height: 80 }, 'https://via.placeholder.com/40');
        
        return `
        <div class="review-card">
            <div class="review-header">
                <img src="${avatar}" alt="avatar" class="review-avatar" width="40" height="40" loading="lazy">
                <div class="review-user-info">
                    <strong>${profile.username}</strong>
                    <span class="review-date">${new Date(review.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div class="review-stars">${stars}</div>
            </div>
            ${review.comment ? `<p class="review-comment">“${review.comment}”</p>` : ''}
        </div>`;
    }).join('');
}

// Añade estas funciones a /js/modules/ui.js

// --- Componentes de la Página de Perfil ---

export function renderProfileLoginPrompt(container) {
    if (!container) return;
    container.innerHTML = `
        <div class="widget" style="text-align: center; margin-top: 4rem;">
            <h2><i class="fa-solid fa-lock"></i> Acceso Restringido</h2>
            <p>Debes iniciar sesión para ver tu perfil.</p>
            <button id="login-redirect-btn" class="btn btn-primary" style="margin-top:1rem;">Iniciar Sesión</button>
        </div>
    `;
}

export function renderProfilePage(container, data) {
    if (!container) return;
    const { session, profile, servers, reviews } = data;
    
    const serversHtml = servers.length > 0 ? servers.map(server => {
        const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 90, height: 90 }, 'https://via.placeholder.com/45');
        return `
        <div class="detail-card">
            <img src="${logo}" alt="Logo" class="server-logo-table" loading="lazy">
            <h4><a href="servidor.html?id=${server.id}" class="server-name-link">${server.name}</a></h4>
            <span class="status-tag status-${server.status || 'pendiente'}">${server.status || 'pendiente'}</span>
            <div class="actions">
                <a href="servidor.html?id=${server.id}" class="btn btn-sm btn-secondary">Ver</a>
                <a href="editar-servidor.html?id=${server.id}" class="btn btn-sm btn-primary">Editar</a>
            </div>
        </div>
    `}).join('') : '<p>Aún no has añadido ningún servidor.</p>';

    const reviewsHtml = reviews.length > 0 ? reviews.map(review => {
        const serverName = review.servers ? review.servers.name : 'Servidor eliminado';
        const serverLink = review.servers ? `<a href="servidor.html?id=${review.servers.id}">${serverName}</a>` : serverName;
        return `
        <div class="user-review-card">
            <div class="review-header">
                <div class="review-user-info">
                    <strong>Tu reseña para ${serverLink}</strong>
                    <span class="review-date">${new Date(review.created_at).toLocaleDateString('es-ES')}</span>
                </div>
                <div class="review-stars">${renderStars(review.rating)}</div>
            </div>
            <p class="review-comment">"${review.comment || '<em>Sin comentario.</em>'}"</p>
        </div>`;
    }).join('') : '<p>Aún no has dejado ninguna reseña.</p>';

    container.innerHTML = `
        <div class="page-header"><h1><i class="fa-solid fa-user-circle"></i> Mi Perfil</h1></div>
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
                        <h3 class="widget-title" style="margin:0; border:none; display:inline;">Mis Servidores</h3>
                        <a href="agregar.html" class="btn btn-primary btn-sm"><i class="fa-solid fa-plus"></i> Añadir</a>
                    </div>
                    <div class="servers-list">${serversHtml}</div>
                </div>
                <div class="widget">
                    <h3 class="widget-title" style="margin-bottom:1.5rem;"><i class="fa-solid fa-comment-dots"></i> Mis Últimas Reseñas</h3>
                    <div class="user-reviews-list">${reviewsHtml}</div>
                </div>
            </div>
        </div>
    `;
}

// Añade este bloque al final de /js/modules/ui.js

// --- Componentes del Panel de Administración ---

export function renderAdminPendingServers(container, servers) {
    if (!servers || servers.length === 0) {
        container.innerHTML = '<p>No hay servidores pendientes de aprobación.</p>';
        return;
    }
    container.innerHTML = servers.map(s => `
        <div class="detail-card">
            <h4>${s.name} <small>(${s.version})</small></h4>
            <div class="actions">
                <button data-id="${s.id}" class="btn btn-sm btn-primary approve-btn">Aprobar</button>
                <a href="servidor.html?id=${s.id}" target="_blank" class="btn btn-sm btn-secondary">Ver</a>
                <button data-id="${s.id}" class="btn btn-sm btn-danger deny-btn">Rechazar</button>
            </div>
        </div>`).join('');
}

export function renderAdminAllServers(container, servers) {
    container.innerHTML = servers.map(s => `
        <div class="detail-card">
            <h4>${s.name} <span class="status-tag status-${s.status}">${s.status}</span></h4>
            <div class="actions">
                <span>Destacado:</span>
                <label class="switch">
                    <input type="checkbox" class="featured-toggle" data-id="${s.id}" ${s.is_featured ? 'checked' : ''}>
                    <span class="slider"></span>
                </label>
                <a href="editar-servidor.html?id=${s.id}" class="btn btn-sm btn-secondary">Editar</a>
                <button data-id="${s.id}" class="btn btn-sm btn-danger deny-btn">Eliminar</button>
            </div>
        </div>`).join('');
}

export function renderAdminUsers(container, users) {
    container.innerHTML = users.map(u => `
        <div class="detail-card">
            <h4>${u.username || u.email}</h4>
            <div class="actions">
                <span>Rol:</span>
                <select class="user-role-select" data-id="${u.id}">
                    <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuario</option>
                    <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
                <!-- Aquí podrías añadir un botón de banear si tuvieras la columna 'status' en la tabla profiles -->
            </div>
        </div>`).join('');
}

export function renderAdminSoM(container, { currentWinner, allServers }) {
    let currentWinnerHtml = `
        <div id="som-current-winner">
            <i class="fa-solid fa-trophy fa-3x" style="color: var(--text-secondary);"></i>
            <div>
                <h4>Aún no hay ganador</h4>
                <p>Selecciona un servidor de la lista.</p>
            </div>
        </div>`;
    
    if (currentWinner) {
        const logo = getOptimizedImageUrl('server-images', currentWinner.image_url, { width: 160, height: 160 }, 'https://via.placeholder.com/80');
        currentWinnerHtml = `
            <div id="som-current-winner">
                <img src="${logo}" alt="Logo de ${currentWinner.name}">
                <div>
                     <h4>Ganador Actual: ${currentWinner.name}</h4>
                     <p>ID: ${currentWinner.id}</p>
                </div>
            </div>`;
    }

    const serverOptionsHtml = allServers.map(server => 
        `<option value="${server.id}">${server.name} (ID: ${server.id})</option>`
    ).join('');

    container.innerHTML = `
        ${currentWinnerHtml}
        <form id="som-selection-form" style="margin-top:2rem;">
            <div class="form-group">
                <label for="som-select" style="font-size:1.2rem; font-weight:600;">Seleccionar Nuevo Ganador</label>
                <select id="som-select" required style="padding: 0.8rem 1rem; width:100%; background:#252525; border:1px solid #333; color:white; border-radius:8px;">
                    <option value="">-- Elige un servidor --</option>
                    ${serverOptionsHtml}
                </select>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="margin-top:1rem;">Establecer como Ganador</button>
        </form>
        <div id="som-feedback" class="feedback-message" style="margin-top: 1rem;"></div>
    `;
}

export function setFormFeedback(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `feedback-message ${type} active`;
}