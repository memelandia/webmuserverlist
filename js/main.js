// js/main.js (v8 - Con optimización de imágenes en todos los widgets)

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavigation();
    loadHomeWidgets();
});

function loadHomeWidgets() {
    loadFeaturedCarousel();
    loadServerOfTheMonth();
    loadTopRanking();
    loadUpcomingEvents();
    loadStats();
}

// Inicializa las partículas del fondo
function initParticles() {
    const particlesContainer = document.getElementById('particles-js');
    if (particlesContainer) {
        particlesJS('particles-js', {
            "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" } }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#ff3333", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 4, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false } },
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 1 } }, "push": { "particles_nb": 4 } } },
            "retina_detect": true
        });
    }
}

// Configura el menú de navegación para móviles
function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
        });
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('active') && !navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
}

// --- CARRUSEL DE DESTACADOS (CON IMÁGENES OPTIMIZADAS) ---
async function loadFeaturedCarousel() {
    const container = document.getElementById('featured-carousel');
    if (!container) return;

    container.innerHTML = `<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando servidores destacados...</div>`;
    try {
        const { data, error } = await window.supabaseClient
            .from('servers')
            .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, opening_date')
            .eq('status', 'aprobado')
            .eq('is_featured', true)
            .limit(5);

        if (error) throw error;
        if (!data || data.length === 0) {
            container.innerHTML = '<p style="padding: 2rem; text-align: center;">No hay servidores destacados.</p>';
            return;
        }

        container.innerHTML = data.map(server => {
            const openingDate = server.opening_date ? new Date(server.opening_date) : null;
            const isFutureOpening = openingDate && openingDate > new Date();
            const expRate = server.exp_rate ? `${server.exp_rate}x` : '?x';
            const dropRate = server.drop_rate ? `${server.drop_rate}%` : '?%';
            
            // ¡OPTIMIZACIÓN!
            const optimizedLogo = getOptimizedImageUrl('server-images', server.image_url, { width: 400, height: 400 }, 'https://via.placeholder.com/90');
            const optimizedBanner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 400, height: 150 }, 'https://via.placeholder.com/400x150.png?text=Banner');

            return `
            <div class="carousel-card">
                <a href="servidor.html?id=${server.id}" class="card-banner-link" style="background-image: url('${optimizedBanner}');"></a>
                <div class="carousel-card-info">
                    <img src="${optimizedLogo}" alt="Logo de ${server.name}" class="carousel-card-logo" width="200" height="200">
                    <h3><a href="servidor.html?id=${server.id}">${server.name}</a></h3>
                    <div class="carousel-card-meta">
                        <span title="Versión"><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                        <span title="Tipo"><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                        <span title="Configuración"><i class="fa-solid fa-cogs"></i> ${server.configuration || 'N/A'}</span>
                    </div>
                    <div class="carousel-card-rates">
                        <span title="Experiencia"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg> ${expRate}</span>
                         <span title="Drop"><i class="fa-solid fa-gem"></i> ${dropRate}</span>
                    </div>
                    ${isFutureOpening ? `<div class="carousel-card-opening"><i class="fa-solid fa-calendar-days"></i> Apertura: ${openingDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</div>` : ''}
                    <a href="servidor.html?id=${server.id}" class="btn btn-primary" style="width:100%; margin-top: auto;"><i class="fa-solid fa-eye"></i> Ver Servidor</a>
                </div>
            </div>`;
        }).join('');

        initCarousel();

    } catch (error) {
        container.innerHTML = `<p class="error-text">No se pudieron cargar los servidores.</p>`;
    }
}

function initCarousel() {
    const carousel = document.getElementById('featured-carousel');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    if (!carousel || !prevBtn || !nextBtn) return;

    const updateButtons = () => {
        const canScroll = carousel.scrollWidth > carousel.clientWidth;
        prevBtn.style.display = canScroll ? 'block' : 'none';
        nextBtn.style.display = canScroll ? 'block' : 'none';
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

// --- WIDGET SERVIDOR DEL MES (CON IMAGEN OPTIMIZADA) ---
async function loadServerOfTheMonth() {
    const container = document.getElementById('server-of-the-month-widget');
    if (!container) return;

    try {
        const { data, error } = await window.supabaseClient
            .from('server_of_the_month')
            .select('*')
            .single();

        if (error || !data) {
            container.innerHTML = `
                <div class="som-content">
                    <span class="som-badge"><i class="fa-solid fa-medal"></i> Servidor del Mes</span>
                    <h2>Aún no hay ganador</h2>
                    <p>¡Vota por tus servidores favoritos para que aparezcan aquí!</p>
                </div>`;
            return;
        }
        
        // ¡OPTIMIZACIÓN!
        const optimizedBanner = getOptimizedImageUrl('server-banners', data.banner_url, { width: 1200, height: 400, resize: 'contain' }, 'https://via.placeholder.com/1200x300.png?text=Banner');
        container.style.backgroundImage = `url('${optimizedBanner}')`;

        container.innerHTML = `
            <div class="som-content">
                <span class="som-badge"><i class="fa-solid fa-medal"></i> Servidor del Mes</span>
                <h2>${data.name}</h2>
                <p>${data.description ? data.description.substring(0, 150) + '...' : 'El servidor más votado.'}</p>
                <a href="servidor.html?id=${data.id}" class="btn btn-primary btn-lg">Ver Servidor</a>
            </div>`;

    } catch (error) {
        container.innerHTML = `<p class="error-text">No se pudo cargar el Servidor del Mes.</p>`;
    }
}


// --- WIDGET DE RANKING (CON IMÁGENES OPTIMIZADAS) ---
async function loadTopRanking() {
    const container = document.getElementById('ranking-widget-list');
    if (!container) return;

    container.innerHTML = `<li class="loading-text">Cargando ranking...</li>`;
    try {
        const { data, error } = await window.supabaseClient
            .from('servers')
            .select('id, name, image_url, votes_count, version, type, exp_rate')
            .eq('status', 'aprobado')
            .order('votes_count', { ascending: false, nullsFirst: false })
            .limit(5);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            container.innerHTML = data.map((server, index) => {
                const rankClass = index < 3 ? `top-${index + 1}` : '';
                const medalIcon = ['gold', 'silver', 'bronze'][index] ? `<i class="fa-solid fa-medal rank-medal ${['gold', 'silver', 'bronze'][index]}"></i>` : '';
                const expRate = server.exp_rate ? `${server.exp_rate}x` : '?x';
                
                // ¡OPTIMIZACIÓN!
                const optimizedLogo = getOptimizedImageUrl('server-images', server.image_url, { width: 80, height: 80 }, 'https://via.placeholder.com/40');

                return `
                <a href="servidor.html?id=${server.id}" class="ranking-item-link">
                    <li class="ranking-item ${rankClass}">
                        <div class="rank-position-container"><span class="rank-number">${index + 1}</span>${medalIcon}</div>
                        <img src="${optimizedLogo}" alt="${server.name}" class="ranking-logo-icon" width="40" height="40">
                        <div class="ranking-item-info">
                          <span class="ranking-name">${server.name}</span>
                          <small>${server.version || 'N/A'}</small>
                        </div>
                        <div class="ranking-item-stats">
                           <span><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                           <span><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg> ${expRate}</span>
                        </div>
                    </li>
                </a>`;
            }).join('');
        } else {
            container.innerHTML = '<li class="loading-text">No hay servidores en el ranking.</li>';
        }
    } catch (error) {
        container.innerHTML = '<li class="error-text">Error al cargar ranking.</li>';
    }
}

// Carga próximas aperturas
async function loadUpcomingEvents() {
    const container = document.getElementById('calendar-widget-list');
    if (!container) return;
    
    container.innerHTML = `<p class="loading-text">Cargando calendario...</p>`;
    try {
        const { data, error } = await window.supabaseClient
            .from('servers')
            .select('id, name, opening_date')
            .not('opening_date', 'is', null)
            .gt('opening_date', new Date().toISOString())
            .order('opening_date', { ascending: true })
            .limit(3);
            
        if (error) throw error;
        
        if (data && data.length > 0) {
            container.innerHTML = data.map(server => `
                <a href="servidor.html?id=${server.id}" class="opening-item-widget">
                    <div>
                        <h4>${server.name}</h4>
                        <p><i class="fa-solid fa-calendar-day"></i> ${new Date(server.opening_date).toLocaleDateString('es-ES', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    </div>
                    <i class="fa-solid fa-chevron-right"></i>
                </a>`).join('');
        } else {
            container.innerHTML = '<p class="loading-text">No hay próximas aperturas.</p>';
        }
    } catch (error) {
        container.innerHTML = '<p class="error-text">Error al cargar calendario.</p>';
    }
}

// Carga las estadísticas generales
async function loadStats() {
    const totalServersEl = document.getElementById('total-servers');
    const totalVotesEl = document.getElementById('total-votes');
    const totalUsersEl = document.getElementById('total-users');

    try {
        const { count: serverCount } = await window.supabaseClient
            .from('servers').select('*', { count: 'exact', head: true }).eq('status', 'aprobado');
            
        const { count: userCount } = await window.supabaseClient
            .from('profiles').select('*', { count: 'exact', head: true });
        
        const { data: servers, error } = await window.supabaseClient
            .from('servers').select('votes_count').eq('status', 'aprobado');
            
        let totalVotes = servers ? servers.reduce((acc, s) => acc + (s.votes_count || 0), 0) : 0;

        if (totalServersEl) totalServersEl.textContent = serverCount || 0;
        if (totalUsersEl) totalUsersEl.textContent = userCount || 0;
        if (totalVotesEl) totalVotesEl.textContent = totalVotes;

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}
