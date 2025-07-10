// js/modules/ui.js (v19 - COMPLETO con todas las funciones de renderizado, sin omisiones)

import { getOptimizedImageUrl, renderStars } from './utils.js';

// --- Funciones de Estado y Ayuda ---
export function renderLoading(container, message = "Cargando...") {
    if(container) container.innerHTML = `<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> ${message}</div>`;
}

export function renderError(container, message = "Error al cargar.") {
    if(container) container.innerHTML = `<p class="error-text"><b>Error:</b> ${message}</p>`;
}

export function setFormFeedback(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `feedback-message ${type} active`;
}

// --- Componentes de la Página de Inicio (main.js) ---

export function renderFeaturedCarousel(container, servers) {
    if (!container || !servers || servers.length === 0) {
        if(container) container.innerHTML = '<p class="text-secondary" style="padding: 2rem;text-align:center;">No hay servidores destacados en este momento.</p>';
        return;
    }
    
    container.innerHTML = servers.map(server => {
        const openingDate = server.opening_date ? new Date(server.opening_date) : null;
        const isFutureOpening = openingDate && openingDate > new Date();
        const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 180, height: 180 }, 'img/logo_placeholder_small.png');
        const banner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 400, height: 150 }, 'img/banner_placeholder.png');

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
    container.innerHTML = '';
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
    if (!container || !servers || servers.length === 0) {
        if(container) container.innerHTML = '<p class="text-secondary" style="padding:1rem; text-align:center;">No hay servidores en el ranking.</p>';
        return;
    }
    
    container.innerHTML = servers.map((server, index) => {
        const medalIcon = ['gold', 'silver', 'bronze'][index] 
            ? `<i class="fa-solid fa-medal rank-medal ${['gold', 'silver', 'bronze'][index]}"></i>` : '';
        const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 80, height: 80 }, 'img/logo_placeholder_small.png');
        
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
    if (!container || !servers || servers.length === 0) {
        if(container) container.innerHTML = '<p class="text-secondary" style="padding:1rem; text-align:center;">No hay próximas aperturas programadas.</p>';
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
    document.getElementById('total-servers').textContent = stats.totalServers || 0;
    document.getElementById('total-votes').textContent = stats.totalVotes || 0;
    document.getElementById('total-users').textContent = stats.totalUsers || 0;
}

// --- Componentes de la Página de Ranking ---

export function updateRankingFilterButtons(activeType) {
    const generalBtn = document.getElementById('rank-general-btn');
    const monthlyBtn = document.getElementById('rank-monthly-btn');
    if (!generalBtn || !monthlyBtn) return;
    
    generalBtn.classList.toggle('btn-primary', activeType === 'general');
    generalBtn.classList.toggle('btn-secondary', activeType !== 'general');
    monthlyBtn.classList.toggle('btn-primary', activeType === 'monthly');
    monthlyBtn.classList.toggle('btn-secondary', activeType !== 'monthly');
}

export function renderRankingTable(container, servers, options) {
    if (!container || !servers || servers.length === 0) {
        if(container) renderError(container, '<tr><td colspan="9" style="text-align:center; padding: 2rem;">No se encontraron servidores.</td></tr>');
        return;
    }
    
    container.innerHTML = servers.map((server, index) => {
        const position = (options.page - 1) * options.pageSize + index + 1;
        const votes = options.rankingType === 'monthly' ? (server.monthly_votes_count || 0) : (server.votes_count || 0);
        const logo = getOptimizedImageUrl('server-images', server.image_url, { width: 90, height: 90 }, 'img/logo_placeholder_small.png');
        
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
                    <span class="review-count">(${(server.review_count || 0)})</span>
                </td>
                <td>${server.type || 'N/A'}</td>
                <td>${server.configuration || 'N/A'}</td>
                <td>${server.exp_rate ? server.exp_rate + 'x' : 'N/A'}</td>
                <td>${server.drop_rate ? server.drop_rate + '%' : 'N/A'}</td>
                <td class="votes-count">${votes}</td>
                <td><a href="servidor.html?id=${server.id}" class="btn btn-primary btn-sm">Ver</a></td>
            </tr>`;
    }).join('');
}

export function renderPagination(container, totalItems, currentPage, pageSize) {
    if (!container) return;
    const totalPages = Math.ceil(totalItems / pageSize);
    container.innerHTML = (totalPages > 1) ? `
        <button class="btn btn-secondary" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fa-solid fa-chevron-left"></i> Anterior
        </button>
        <span class="pagination-info">Página ${currentPage} de ${totalPages}</span>
        <button class="btn btn-secondary" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
            Siguiente <i class="fa-solid fa-chevron-right"></i>
        </button>` : '';
}

// --- Componentes de la Página de Explorar ---
const expSteps = [1, 5, 10, 20, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 2000, 5000, 9999, 100000];
function getExpValueFromSlider(sliderValue) { return expSteps[parseInt(sliderValue, 10)]; }
export function initExpSlider() { const s=document.getElementById("filter-exp-slider"),e=document.getElementById("exp-value"); if(!s||!e)return;const t=()=>{const t=getExpValueFromSlider(s.value);e.textContent=t>=99999?"Cualquiera":`≤ ${t}x`};s.addEventListener("input",t),t() }
export function getExploreFilters() { return{name:document.getElementById("filter-name").value.trim(),version:document.getElementById("filter-version").value,type:document.getElementById("filter-type").value,configuration:document.getElementById("filter-configuration").value,exp:getExpValueFromSlider(document.getElementById("filter-exp-slider").value),sort:document.getElementById("filter-sort").value}}
export function renderExploreServers(container, servers) { if(!container||!servers)return;if(0===servers.length){renderError(container,'<p style="text-align: center; grid-column: 1 / -1;">No se encontraron servidores con los filtros aplicados.</p>');return}container.innerHTML=servers.map(server=>{const e=server.description?server.description.substring(0,100)+"...":"Sin descripción.",t=getOptimizedImageUrl("server-images",server.image_url,{width:160,height:160},"img/logo_placeholder_small.png"),i=getOptimizedImageUrl("server-banners",server.banner_url,{width:400,height:120},"img/banner_placeholder.png");return` <div class="server-card-new"> <div class="card-banner" style="background-image: url('${i}')"></div> <div class="card-header"> <img src="${t}" alt="Logo de ${server.name}" class="card-logo" width="80" height="80" loading="lazy"> </div> <div class="card-content"> <h3>${server.name}</h3> <div class="card-tags-icons"> <span class="card-tag-icon" title="Versión"><i class="fa-solid fa-gamepad"></i> ${server.version||"N/A"}</span> <span class="card-tag-icon" title="Tipo"><i class="fa-solid fa-shield-halved"></i> ${server.type||"N/A"}</span> <span class="card-tag-icon" title="Experiencia"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg> ${server.exp_rate||"?"}x</span> <span class="card-tag-icon" title="Drop"><i class="fa-solid fa-gem"></i> ${server.drop_rate||"?"}%</span> </div> <p class="card-description">${e}</p> </div> <div class="card-actions"> <a href="${server.website_url||"#"}" id="website-link-${server.id}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-solid fa-globe"></i> Sitio Web</a> <a href="servidor.html?id=${server.id}" class="btn btn-primary"><i class="fa-solid fa-eye"></i> Ver Detalles</a> </div> </div>`}).join("")}

// --- Componentes de la Página de Calendario ---
let runningCountdownTimers=[];export function startCountdownTimers(){runningCountdownTimers.length>0&&(runningCountdownTimers.forEach(e=>clearInterval(e)),runningCountdownTimers=[]),document.querySelectorAll("[data-countdown]").forEach(e=>{const t=new Date(e.dataset.countdown).getTime(),n=e.querySelector(".card-countdown");if(!n)return;const r=()=>{const o=t-Date.now();if(o<=0)return timer&&clearInterval(timer),void(n.innerHTML='<div class="countdown-live"><i class="fa-solid fa-circle-play"></i> ¡YA ABIERTO!</div>');const i=Math.floor(o/864e5),a=Math.floor(o%864e5/36e5),l=Math.floor(o%36e5/6e4),s=Math.floor(o%6e4/1e3);n.innerHTML=` <div class="countdown-main"> <span class="days">${i}</span>d </div> <div class="countdown-secondary"> ${String(a).padStart(2,"0")}h : ${String(l).padStart(2,"0")}m : ${String(s).padStart(2,"0")}s </div>`};r();const timer=setInterval(r,1e3);runningCountdownTimers.push(timer)})}
export function renderCalendarPage(container,servers){if(!container||!servers)return;if(0===servers.length)return void renderError(container,'<p style="text-align: center; padding: 2rem;">No hay próximas aperturas programadas.</p>');container.innerHTML=servers.map(server=>{const e=server.description?server.description.substring(0,80)+"...":"Sin descripción.",t=getOptimizedImageUrl("server-banners",server.banner_url,{width:400,height:120},"img/banner_placeholder.png"),n=getOptimizedImageUrl("server-images",server.image_url,{width:120,height:120},"img/logo_placeholder_small.png"),r=new Date(server.opening_date),i=r.getDate(),o=r.toLocaleString("es-ES",{month:"short"}).replace(".","");return` <div class="calendar-card" data-countdown="${server.opening_date}"> <div class="calendar-card-banner" style="background-image: url('${t}');"> <div class="calendar-date"> <span class="calendar-day">${i}</span> <span class="calendar-month">${o.toUpperCase()}</span> </div> </div> <div class="calendar-card-content"> <div class="calendar-card-header"> <img src="${n}" alt="Logo de ${server.name}" class="calendar-card-logo" loading="lazy"> <h3><a href="servidor.html?id=${server.id}">${server.name}</a></h3> </div> <p class="calendar-card-description">${e}</p> <div class="calendar-card-meta"> <span><i class="fa-solid fa-gamepad"></i> ${server.version||"N/A"}</span> <span><i class="fa-solid fa-shield-halved"></i> ${server.type||"N/A"}</span> </div> <a href="servidor.html?id=${server.id}" class="btn btn-primary btn-sm">Ver Detalles</a> </div> <div class="card-countdown"></div> </div>`}).join("")}

// --- Componentes de la Página de Servidor ---
function getEventIcon(e){return{ "Blood Castle":"fa-solid fa-chess-rook","Devil Square":"fa-solid fa-square","Chaos Castle":"fa-solid fa-dungeon","Illusion Temple":"fa-solid fa-eye",Doppelganger:"fa-solid fa-clone","Castle Siege":"fa-brands fa-fort-awesome","Crywolf Event":"fa-brands fa-wolf-pack-battalion","Kanturu Event":"fa-solid fa-biohazard","Last Man Standing":"fa-solid fa-khanda","Golden Invasion":"fa-solid fa-dragon","White Wizard":"fa-solid fa-hat-wizard","Invasión de Conejos":"fa-solid fa-carrot"}[e]||"fa-solid fa-star"}
export function renderServerPage(container,server){const e=server.events&&server.events.length>0?server.events.map(e=>`<span class="event-tag"><i class="${getEventIcon(e)}"></i> ${e}</span>`).join(""): "<p>No hay eventos principales especificados.</p>",t=Array.isArray(server.gallery_urls)?server.gallery_urls:[],n=t.length>0?t.map(e=>{const t=getOptimizedImageUrl("server-gallery",e,{quality:85}),n=getOptimizedImageUrl("server-gallery",e,{width:300,height:200,resize:"cover"});return`<a href="${t}" class="gallery-item" data-gallery="server-gallery"><img src="${n}" alt="Galería de ${server.name}" loading="lazy"></a>`}).join(""): "<p>Este servidor no tiene imágenes en la galería.</p>",r=getOptimizedImageUrl("server-banners",server.banner_url,{width:1200,quality:80},"img/banner_placeholder.png"),i=getOptimizedImageUrl("server-images",server.image_url,{width:360,height:360},"img/logo_placeholder.png"),o=server.description?typeof showdown!="undefined"?new showdown.Converter({ghCompatibleHeaderId: true, simpleLineBreaks: true}).makeHtml(server.description):server.description:"No hay una descripción disponible para este servidor.";container.innerHTML=` <header class="server-header" style="background-image: linear-gradient(rgba(15, 15, 15, 0.8), var(--bg-dark)), url(${r});"> <div class="container server-header-content"> <img src="${i}" alt="Logo de ${server.name}" class="server-logo-detail" width="180" height="180"> <div class="server-header-info"> <h1>${server.name}</h1> <div class="server-header-tags"> <span><i class="fa-solid fa-gamepad"></i> ${server.version||"N/A"}</span> <span><i class="fa-solid fa-shield-halved"></i> ${server.type||"N/A"}</span> <span><i class="fa-solid fa-heart"></i> <span id="votes-count">${server.votes_count||0}</span> Votos</span> </div> </div> <div class="server-header-actions"> <button id="vote-btn" class="btn btn-primary btn-lg"><i class="fa-solid fa-heart"></i> Votar</button> <a id="website-link" href="${server.website_url||"#"}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-solid fa-globe"></i> Web</a> </div> </div> </header> <div class="container server-body-grid page-container" style="padding-top:3rem;"> <main class="server-main-column"> <div class="widget"><h3 class="widget-title"><i class="fa-solid fa-file-alt"></i> Descripción</h3><div class="server-description-content">${o}</div></div> <div class="widget"><h3 class="widget-title"><i class="fa-solid fa-images"></i> Galería</h3><div class="gallery-grid">${n}</div></div> <div class="widget" id="reviews-widget"></div> </main> <aside class="server-sidebar-column"> <div class="widget"> <h3 class="widget-title"><i class="fa-solid fa-circle-info"></i> Ficha Técnica</h3> <ul class="tech-details-list"> <li><strong><i class="fa-solid fa-cogs"></i>Configuración</strong> <span>${server.configuration||"N/A"}</span></li> <li><strong><i class="fa-solid fa-bolt"></i>Experiencia</strong> <span>${server.exp_rate?server.exp_rate+"x":"N/A"}</span></li> <li><strong><i class="fa-solid fa-gem"></i>Drop Rate</strong> <span>${server.drop_rate?server.drop_rate+"%":"N/A"}</span></li> <li><strong><i class="fa-solid fa-sync-alt"></i>Reset Info</strong> <span>${server.reset_info||"N/A"}</span></li> </ul> </div> <div class="widget"><h3 class="widget-title"><i class="fa-solid fa-calendar-check"></i> Eventos</h3><div class="events-list">${e}</div></div> </aside> </div> <div id="vote-feedback" class="feedback-message" style="position: fixed; top: 90px; right: 20px; z-index: 1002; width: auto; max-width: 300px;"></div>`,document.getElementById("reviews-widget").innerHTML=` <h3 class="widget-title"><i class="fa-solid fa-comments"></i> Reseñas</h3> <div id="reviews-list"><p class="loading-text">Cargando reseñas...</p></div> <hr style="border-color: var(--border-color); margin: 2rem 0;"> <h4>Deja tu reseña</h4> <form id="review-form" class="hidden"> <div class="form-group"><label>Puntuación:</label><div class="star-rating"><input type="radio" id="review-star5" name="rating" value="5" required/><label for="review-star5" title="5">★</label><input type="radio" id="review-star4" name="rating" value="4"/><label for="review-star4" title="4">★</label><input type="radio" id="review-star3" name="rating" value="3"/><label for="review-star3" title="3">★</label><input type="radio" id="review-star2" name="rating" value="2"/><label for="review-star2" title="2">★</label><input type="radio" id="review-star1" name="rating" value="1"/><label for="review-star1" title="1">★</label></div></div> <div class="form-group"><label for="review-comment">Comentario (opcional):</label><textarea id="review-comment" rows="4" placeholder="¿Qué te pareció?"></textarea></div> <button type="submit" id="submit-review-btn" class="btn btn-primary">Enviar</button> <div id="review-feedback" class="feedback-message"></div> </form> <div id="review-login-prompt"><p>Debes <a href="#" id="login-link">iniciar sesión</a> para dejar una reseña.</p></div>`}
export function renderReviews(container,reviews){if(!reviews||0===reviews.length)return void(container.innerHTML="<p>Este servidor aún no tiene reseñas. ¡Sé el primero!</p>");container.innerHTML=reviews.map(review=>{const e=review.profiles||{username:"Anónimo",avatar_url:""},t=renderStars(review.rating),n=getOptimizedImageUrl("avatars",e.avatar_url,{width:80,height:80},"img/avatar_default.png");return` <div class="review-card"> <div class="review-header"> <img src="${n}" alt="avatar" class="review-avatar" width="40" height="40" loading="lazy"> <div class="review-user-info"> <strong>${e.username}</strong> <span class="review-date">${new Date(review.created_at).toLocaleDateString("es-ES")}</span> </div> <div class="review-stars">${t}</div> </div> ${review.comment?`<p class="review-comment">“${review.comment}”</p>`:""} </div>`}).join("")}

// --- Componentes de la Página de Perfil (AVANZADO Y COMPLETO) ---
export function renderUserProfile(container, data) {
    const { session, profile, servers, reviews } = data;
    const avatar = getOptimizedImageUrl('avatars', profile.avatar_url, { width: 300, height: 300, resize: "cover" }, "img/avatar_default.png");
    
    const serversHtml = servers && servers.length > 0 
        ? servers.map(server => `
            <div class="detail-card">
                <img src="${getOptimizedImageUrl('server-images', server.image_url, {width:90, height:90}, 'img/logo_placeholder_small.png')}" class="server-logo-table" loading="lazy" alt="Logo de ${server.name}">
                <h4><a href="servidor.html?id=${server.id}" class="server-name-link">${server.name}</a></h4>
                <span class="status-tag status-${server.status || "pendiente"}">${server.status || "pendiente"}</span>
                <div class="actions">
                    <a href="servidor.html?id=${server.id}" class="btn btn-sm btn-secondary">Ver</a>
                    ${profile.id === server.user_id || profile.role === 'admin' ? `<a href="editar-servidor.html?id=${server.id}" class="btn btn-sm btn-primary">Editar</a>` : ""}
                </div>
            </div>`).join('') 
        : '<p>Aún no has añadido ningún servidor. <a href="agregar.html">¿Tienes uno?</a></p>';

    const reviewsHtml = reviews && reviews.length > 0
        ? reviews.map(review => `
            <div class="user-review-card">
                <div class="review-header">
                    <div class="review-user-info">
                        <strong>Tu reseña para <a href="servidor.html?id=${review.servers.id}">${review.servers?.name || "Servidor Eliminado"}</a></strong>
                        <span class="review-date">${new Date(review.created_at).toLocaleDateString("es-ES")}</span>
                    </div>
                    <div class="review-stars">${renderStars(review.rating)}</div>
                </div>
                ${review.comment ? `<p class="review-comment">“${review.comment}”</p>` : ''}
            </div>`).join('') 
        : "<p>Aún no has dejado ninguna reseña.</p>";

    container.innerHTML = `
        <div class="page-header"><h1><i class="fa-solid fa-user-circle"></i> Mi Perfil</h1></div>
        <div class="profile-grid">
            <aside class="profile-sidebar">
                <div class="widget" style="text-align:center;">
                    <div class="profile-avatar-container">
                        <img src="${avatar}" alt="Avatar de ${profile.username}" id="profile-avatar-img" class="profile-avatar-img">
                        <label for="avatar-upload-input" id="avatar-upload-label" title="Cambiar avatar"><i class="fa-solid fa-camera"></i></label>
                        <input type="file" id="avatar-upload-input" accept="image/png, image/jpeg, image/gif">
                    </div>
                    <div id="avatar-feedback"></div>
                    <h2>${profile.username || "Usuario"}</h2>
                    <p class="text-secondary" style="word-wrap:break-word;">${session.user.email}</p>
                    <p class="text-secondary">Rol: <span style="text-transform: capitalize;">${profile.role}</span></p>
                    <small class="text-secondary">Miembro desde: ${new Date(session.user.created_at).toLocaleDateString("es-ES")}</small>
                </div>
            </aside>
            <main class="profile-main-content">
                <div class="widget">
                    <h3 class="widget-title">Mis Servidores Publicados</h3>
                    <div class="servers-list">${serversHtml}</div>
                </div>
                <div class="widget">
                    <h3 class="widget-title">Mis Reseñas Recientes</h3>
                    <div class="user-reviews-list">${reviewsHtml}</div>
                </div>
            </main>
        </div>`;
}
export function renderOwnerDashboard(container, data){
    const { session, profile, servers, dashboardStats } = data;
    const avatar = getOptimizedImageUrl("avatars", profile.avatar_url, { width: 300, height: 300, resize: "cover" }, "img/avatar_default.png");
    
    const totals = (dashboardStats || []).reduce((acc, srv) => {
        acc.views += srv.view_count || 0;
        acc.webClicks += srv.website_click_count || 0;
        acc.discordClicks += srv.discord_click_count || 0;
        acc.votes += srv.votes_count || 0;
        return acc;
    }, { views: 0, webClicks: 0, discordClicks: 0, votes: 0 });

    const serversHtml = servers && servers.length > 0 
        ? servers.map(server => `
        <div class="detail-card">
            <img src="${getOptimizedImageUrl('server-images', server.image_url, {width:90, height:90}, 'img/logo_placeholder_small.png')}" class="server-logo-table" loading="lazy" alt="Logo de ${server.name}">
            <h4><a href="servidor.html?id=${server.id}" class="server-name-link">${server.name}</a></h4>
            <span class="status-tag status-${server.status || "pendiente"}">${server.status || "pendiente"}</span>
            <div class="actions">
                <a href="servidor.html?id=${server.id}" class="btn btn-sm btn-secondary">Ver</a>
                <a href="editar-servidor.html?id=${server.id}" class="btn btn-sm btn-primary">Editar</a>
            </div>
        </div>`).join('') 
        : `<p>Aún no has añadido ningún servidor. <a href="agregar.html">¡Publica el primero!</a></p>`;
        
    container.innerHTML = `
        <div class="page-header"><h1><i class="fa-solid fa-chart-line"></i> Dashboard de Servidores</h1></div>
        <div class="profile-grid">
            <aside class="profile-sidebar">
                 <div class="widget" style="text-align:center;">
                    <div class="profile-avatar-container">
                        <img src="${avatar}" alt="Avatar de ${profile.username}" id="profile-avatar-img" class="profile-avatar-img">
                        <label for="avatar-upload-input" id="avatar-upload-label" title="Cambiar avatar"><i class="fa-solid fa-camera"></i></label>
                        <input type="file" id="avatar-upload-input" accept="image/png, image/jpeg, image/gif">
                    </div>
                    <div id="avatar-feedback"></div>
                    <h2>${profile.username || "Usuario"}</h2>
                    <p class="text-secondary" style="word-wrap:break-word;">${session.user.email}</p>
                    <p class="text-secondary">Rol: <span style="text-transform: capitalize;">${profile.role}</span></p>
                </div>
            </aside>
            <main class="profile-main-content">
                ${(servers && servers.length > 0) ? `
                <div class="widget">
                    <h3 class="widget-title">Rendimiento Global</h3>
                    <div class="owner-stats-grid">
                        <div class="stat-card"><div class="stat-card-icon"><i class="fa-solid fa-eye"></i></div><div class="stat-card-value">${totals.views.toLocaleString("es-ES")}</div><div class="stat-card-label">Vistas Totales</div></div>
                        <div class="stat-card"><div class="stat-card-icon"><i class="fa-solid fa-mouse-pointer"></i></div><div class="stat-card-value">${totals.webClicks.toLocaleString("es-ES")}</div><div class="stat-card-label">Clics a Web</div></div>
                        <div class="stat-card"><div class="stat-card-icon"><i class="fab fa-discord"></i></div><div class="stat-card-value">${totals.discordClicks.toLocaleString("es-ES")}</div><div class="stat-card-label">Clics a Discord</div></div>
                        <div class="stat-card"><div class="stat-card-icon"><i class="fa-solid fa-heart"></i></div><div class="stat-card-value">${totals.votes.toLocaleString("es-ES")}</div><div class="stat-card-label">Votos Totales</div></div>
                    </div>
                    <div class="owner-charts-grid">
                        <div class="widget" style="margin-bottom:0;"><h3 class="widget-title" style="margin-bottom: 1.5rem">Interacciones</h3><canvas id="interactions-chart"></canvas></div>
                        <div class="widget" style="margin-bottom:0;"><h3 class="widget-title" style="margin-bottom: 1.5rem">Distribución de Votos</h3><canvas id="votes-chart"></canvas></div>
                    </div>
                </div>` : ''}
                <div class="widget">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;"><h3 class="widget-title" style="margin:0;border:0;">Mis Servidores</h3><a href="agregar.html" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Añadir Nuevo</a></div>
                    <div class="servers-list">${serversHtml}</div>
                </div>
            </main>
        </div>`;
}

export function initOwnerCharts(stats) {
    const interactionsCtx = document.getElementById("interactions-chart")?.getContext("2d");
    const votesCtx = document.getElementById("votes-chart")?.getContext("2d");
    if (!interactionsCtx || !votesCtx) return;
    const labels = stats.map(s => s.name.substring(0, 20));
    
    new Chart(interactionsCtx, {type: "bar", data: {labels, datasets: [{label: "Vistas", data: stats.map(s => s.view_count), backgroundColor: "rgba(255, 51, 51, 0.5)"}, {label: "Clics Web", data: stats.map(s => s.website_click_count), backgroundColor: "rgba(51, 153, 255, 0.5)"}, {label: "Clics Discord", data: stats.map(s => s.discord_click_count), backgroundColor: "rgba(114, 137, 218, 0.5)"}]}, options: {responsive: true, maintainAspectRatio: false, scales: {y: {beginAtZero: true, ticks: {color: "var(--text-secondary)"}}, x: {ticks: {color: "var(--text-secondary)"}}}, plugins: {legend: {labels: {color: "var(--text-primary)"}}}}});
    new Chart(votesCtx, {type: "doughnut", data: {labels, datasets: [{label: "Votos", data: stats.map(s => s.votes_count), backgroundColor: ["#ff3333", "#b42424", "#8b1d1d", "#e62e2e", "#621616", "#410e0e"], borderColor: "var(--bg-light)", borderWidth: 2}]}, options: {responsive: true, maintainAspectRatio: false, plugins: {legend: {position: "top", labels: {color: "var(--text-primary)"}}}}});
}

// --- Componentes del Panel de Administración ---
export function renderAdminPendingServers(servers) { if (!servers || servers.length === 0) { return '<p style="padding: 2rem; text-align: center;">No hay servidores pendientes de aprobación.</p>'; } return servers.map(s => ` <div class="detail-card"> <img src="${getOptimizedImageUrl('server-images', s.image_url, {width: 90, height: 90}, 'img/logo_placeholder_small.png')}" class="server-logo-table" loading="lazy" alt="Logo"> <h4>${s.name} <small>(${s.version})</small></h4> <div class="actions"> <button data-id="${s.id}" class="btn btn-sm btn-success approve-btn"><i class="fa-solid fa-check"></i> Aprobar</button> <a href="servidor.html?id=${s.id}" target="_blank" class="btn btn-sm btn-secondary"><i class="fa-solid fa-eye"></i> Ver</a> <button data-id="${s.id}" class="btn btn-sm btn-danger deny-btn"><i class="fa-solid fa-times"></i> Rechazar</button> </div> </div>`).join(''); }
export function renderAdminAllServers(servers) { if (!servers || servers.length === 0) { return '<p style="padding: 2rem; text-align: center;">No hay servidores para gestionar.</p>'; } return servers.map(s => ` <div class="detail-card"> <img src="${getOptimizedImageUrl('server-images', s.image_url, {width: 90, height: 90}, 'img/logo_placeholder_small.png')}" class="server-logo-table" loading="lazy" alt="Logo"> <h4>${s.name} <span class="status-tag status-${s.status}">${s.status}</span></h4> <div class="actions"> <span>Destacado:</span> <label class="switch"> <input type="checkbox" class="featured-toggle" data-id="${s.id}" ${s.is_featured ? 'checked' : ''}> <span class="slider"></span> </label> <a href="editar-servidor.html?id=${s.id}" class="btn btn-sm btn-secondary">Editar</a> <button data-id="${s.id}" class="btn btn-sm btn-danger deny-btn">Eliminar</button> </div> </div>`).join(''); }
export function renderAdminUsers(users) { if (!users || users.length === 0) { return '<p style="padding: 2rem; text-align: center;">No hay usuarios para gestionar.</p>'; } return users.map(u => ` <div class="detail-card"> <img src="${getOptimizedImageUrl('avatars', u.avatar_url, {width: 90, height: 90}, 'img/avatar_default.png')}" class="server-logo-table" loading="lazy" alt="Avatar"> <h4>${u.username || u.email.split('@')[0]} <small>(${u.email})</small></h4> <div class="actions"> <span>Rol:</span> <select class="user-role-select" data-id="${u.id}" data-initial-role="${u.role}"> <option value="player" ${u.role === 'player' ? 'selected' : ''}>Player</option> <option value="owner" ${u.role === 'owner' ? 'selected' : ''}>Owner</option> <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option> </select> </div> </div>`).join(''); }
export function renderAdminSoM({ currentWinner, allServers }) { let e = ` <div id="som-current-winner"> <i class="fa-solid fa-trophy fa-3x" style="color: var(--text-secondary);"></i> <div> <h4>Aún no hay ganador</h4> <p>Selecciona un servidor de la lista.</p> </div> </div>`; if (currentWinner) { const t = getOptimizedImageUrl("server-images", currentWinner.image_url, { width: 160, height: 160 }, "img/logo_placeholder.png"); e = ` <div id="som-current-winner"> <img src="${t}" alt="Logo de ${currentWinner.name}"> <div> <h4>Ganador Actual: ${currentWinner.name}</h4> <p>ID: ${currentWinner.id}</p> </div> </div>`; } const t = allServers.map(e => `<option value="${e.id}">${e.name} (ID: ${e.id})</option>`).join(""); return ` ${e} <form id="som-selection-form" style="margin-top:2rem;"> <div class="form-group"> <label for="som-select" style="font-size: 1.2rem; font-weight: 600;">Seleccionar Nuevo Ganador</label> <select id="som-select" required style="padding: 0.8rem 1rem; width:100%; background-color: var(--bg-dark); border:1px solid var(--border-color); color:white; border-radius:var(--border-radius);"> <option value="">-- Elige un servidor --</option> ${t} </select> </div> <button type="submit" class="btn btn-primary btn-lg" style="margin-top:1rem;">Establecer como Ganador</button> </form> <div id="som-feedback" class="feedback-message" style="margin-top: 1rem;"></div>`; }