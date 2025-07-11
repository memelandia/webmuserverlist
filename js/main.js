// js/main.js (Controlador de la Página de Inicio)

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

export function initHomePage() {
    console.log("🚀 Inicializando Página de Inicio (main.js)...");
    
    initParticles();
    initMobileNavigation();
    loadHomeWidgets();
}

function initParticles() {
    const particlesContainer = document.getElementById('particles-js');
    if (particlesContainer && typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', { "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" } }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#ff3333", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 4, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "push": { "particles_nb": 4 } } }, "retina_detect": true });
    }
}

function initMobileNavigation() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            navMenu.classList.toggle('active'); 
        });
        // Cierra el menú si se hace clic fuera de él
        document.addEventListener('click', (e) => { 
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) { 
                navMenu.classList.remove('active'); 
            } 
        });
    }
}

function loadHomeWidgets() {
    loadFeaturedCarousel();
    loadServerOfTheMonth();
    loadTopRankingWidget();
    loadUpcomingEventsWidget();
    loadGlobalStats();
}

async function loadFeaturedCarousel() {
    const container = document.getElementById('featured-carousel');
    if (!container) return;

    ui.renderLoading(container, "Cargando servidores destacados...");
    try {
        const servers = await api.getFeaturedServers();
        ui.renderFeaturedCarousel(container, servers);
        ui.initCarouselControls();
    } catch (error) {
        console.error("Error cargando carrusel:", error);
        ui.renderError(container, "No se pudieron cargar los servidores destacados.");
    }
}

async function loadServerOfTheMonth() {
    const container = document.getElementById('server-of-the-month-widget');
    if (!container) return;
    ui.renderLoading(container);
    try {
        const server = await api.getServerOfTheMonth();
        ui.renderServerOfTheMonth(container, server);
    } catch (error) {
        console.error("Error cargando Servidor del Mes:", error);
        ui.renderError(container, "No se pudo cargar el Servidor del Mes.");
    }
}

async function loadTopRankingWidget() {
    const container = document.getElementById('ranking-widget-list');
    if (!container) return;
    ui.renderLoading(container);
    try {
        const servers = await api.getTopRankingWidget();
        ui.renderRankingWidget(container, servers);
    } catch (error) {
        console.error("Error cargando widget de ranking:", error);
        ui.renderError(container, "No se pudo cargar el ranking.");
    }
}

async function loadUpcomingEventsWidget() {
    const container = document.getElementById('calendar-widget-list');
    if (!container) return;
    ui.renderLoading(container);
    try {
        const servers = await api.getUpcomingOpeningsWidget();
        ui.renderCalendarWidget(container, servers);
    } catch (error) {
        console.error("Error cargando widget de calendario:", error);
        ui.renderError(container, "No se pudo cargar el calendario.");
    }
}

async function loadGlobalStats() {
    try {
        const stats = await api.getGlobalStats();
        ui.renderGlobalStats(stats);
    } catch (error) {
        console.error("Error cargando estadísticas globales:", error);
    }
}