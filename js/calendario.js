// js/calendario.js (v7 - Diseño de tarjeta y contador corregidos)

document.addEventListener('DOMContentLoaded', () => {
    initCalendario();
});

// ¡NUEVO! Función para formatear la fecha de apertura.
function formatOpeningDate(dateString) {
    if (!dateString) return { day: '?', month: '???' };
    const date = new Date(dateString);
    return {
        day: date.getDate(),
        month: date.toLocaleString('es-ES', { month: 'short' }).replace('.', ''),
    };
}

async function initCalendario() {
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;

    calendarContainer.innerHTML = `<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</div>`;

    try {
        const { data, error } = await window.supabaseClient
            .from('servers')
            .select('id, name, image_url, banner_url, description, version, type, configuration, exp_rate, opening_date')
            .not('opening_date', 'is', null)
            .gt('opening_date', new Date().toISOString())
            .order('opening_date', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
            calendarContainer.innerHTML = `<p style="text-align: center; padding: 2rem;">No hay próximas aperturas programadas.</p>`;
            return;
        }

        calendarContainer.innerHTML = data.map(server => {
            const shortDescription = server.description ? server.description.substring(0, 80) + '...' : 'Sin descripción.';
            const optimizedBanner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 400, height: 120 }, 'https://via.placeholder.com/400x120.png?text=Banner');
            const optimizedLogo = getOptimizedImageUrl('server-images', server.image_url, { width: 120, height: 120 }, 'https://via.placeholder.com/60');
            const { day, month } = formatOpeningDate(server.opening_date);
            
            // ¡CORRECCIÓN! HTML de la tarjeta completamente rediseñado y funcional
            return `
            <div class="calendar-card" data-countdown="${server.opening_date}">
                <div class="calendar-card-banner" style="background-image: url('${optimizedBanner}');">
                    <div class="calendar-date">
                        <span class="calendar-day">${day}</span>
                        <span class="calendar-month">${month}</span>
                    </div>
                </div>
                <div class="calendar-card-content">
                    <div class="calendar-card-header">
                        <img src="${optimizedLogo}" alt="Logo de ${server.name}" class="calendar-card-logo">
                        <h3><a href="servidor.html?id=${server.id}">${server.name || 'Nombre no disponible'}</a></h3>
                    </div>
                    <p class="calendar-card-description">${shortDescription}</p>
                    <div class="calendar-card-meta">
                        <span><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                        <span><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                        <span><i class="fa-solid fa-cogs"></i> ${server.configuration || 'N/A'}</span>
                        <span><i class="fa-solid fa-bolt"></i> ${server.exp_rate ? server.exp_rate + 'x' : 'N/A'}</span>
                    </div>
                     <div class="card-countdown">
                        <!-- El contenido del contador se insertará aquí por JS -->
                     </div>
                    <a href="servidor.html?id=${server.id}" class="btn btn-primary btn-sm">Ver Detalles</a>
                </div>
            </div>`;
        }).join('');
        
        startCountdownTimers();

    } catch (error) {
        console.error("Error cargando calendario:", error);
        calendarContainer.innerHTML = `<p class="error-text">Error al cargar el calendario: ${error.message}</p>`;
    }
}

// ¡CORRECCIÓN! Lógica del contador mejorada y adaptada al nuevo HTML
function startCountdownTimers() {
    if (window.runningCountdownTimers) {
        window.runningCountdownTimers.forEach(timer => clearInterval(timer));
    }
    window.runningCountdownTimers = [];

    document.querySelectorAll('[data-countdown]').forEach(card => {
        const target = new Date(card.dataset.countdown).getTime();
        const countdownEl = card.querySelector('.card-countdown');
        if (!countdownEl) return;

        const updateTimer = () => {
            const diff = target - Date.now();
            if (diff <= 0) {
                clearInterval(timer);
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
                    <span class="hours">${String(h).padStart(2, '0')}</span>h :
                    <span class="minutes">${String(m).padStart(2, '0')}</span>m :
                    <span class="seconds">${String(s).padStart(2, '0')}</span>s
                </div>
            `;
        };
        
        const timer = setInterval(updateTimer, 1000);
        window.runningCountdownTimers.push(timer);
        updateTimer();
    });
}