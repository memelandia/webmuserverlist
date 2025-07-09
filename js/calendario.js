// js/calendario.js (v6 - Con imágenes optimizadas)

document.addEventListener('DOMContentLoaded', () => {
    initCalendario();
});

// La función checkServerStatus no necesita cambios
async function checkServerStatus(serverId, url) {
    const statusBadge = document.getElementById(`status-${serverId}`);
    if (!statusBadge || !url) {
        if (statusBadge) statusBadge.style.display = 'none';
        return;
    }
    try {
        const { data, error } = await window.supabaseClient.functions.invoke('check-status', { body: JSON.stringify({ url: url }) });
        if (error) throw error;
        statusBadge.classList.remove('loading');
        if (data.status === 'online') {
            statusBadge.classList.add('online');
            statusBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Online`;
        } else {
            statusBadge.classList.add('offline');
            statusBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Offline`;
        }
    } catch (e) {
        statusBadge.classList.remove('loading');
        statusBadge.classList.add('offline');
        statusBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Error`;
    }
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
            
            // ¡OPTIMIZACIÓN!
            const optimizedBanner = getOptimizedImageUrl('server-banners', server.banner_url, { width: 400, height: 120 }, 'https://via.placeholder.com/400x120.png?text=Banner');
            const optimizedLogo = getOptimizedImageUrl('server-images', server.image_url, { width: 160, height: 160 }, 'https://via.placeholder.com/80');

            return `
            <div class="calendar-card">
                <div class="calendar-card-banner" style="background-image: url('${optimizedBanner}');">
                    <div class="calendar-date">
                        <span class="calendar-day">${new Date(server.opening_date).getDate()}</span>
                        <span class="calendar-month">${new Date(server.opening_date).toLocaleString('es-ES', {month: 'short'})}</span>
                    </div>
                </div>
                <div class="calendar-card-content">
                    <div class="calendar-card-header">
                        <img src="${optimizedLogo}" alt="${server.name}" class="calendar-card-logo">
                        <h3><a href="servidor.html?id=${server.id}">${server.name}</a></h3>
                    </div>
                    <p class="calendar-card-description">${shortDescription}</p>
                    <div class="calendar-card-meta">
                        <span><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                        <span><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                        <span><i class="fa-solid fa-cogs"></i> ${server.configuration || 'N/A'}</span>
                        <span><i class="fa-solid fa-bolt"></i> ${server.exp_rate ? server.exp_rate + 'x' : 'N/A'}</span>
                    </div>
                    <a href="servidor.html?id=${server.id}" class="btn btn-primary btn-sm">Ver Detalles</a>
                </div>
            </div>`;
        }).join('');

        startCountdownTimers();
        data.forEach(server => checkServerStatus(server.id, server.website_url));

    } catch (error) {
        calendarContainer.innerHTML = `<p class="error-text">No se pudo cargar el calendario.</p>`;
    }
}

function startCountdownTimers() {
    if (window.runningCountdownTimers) {
        window.runningCountdownTimers.forEach(timer => clearInterval(timer));
    }
    window.runningCountdownTimers = [];

    document.querySelectorAll('[data-countdown]').forEach(el => {
        const target = new Date(el.dataset.countdown).getTime();
        
        const daysEl = el.querySelector('.countdown-main .days');
        const hoursEl = el.querySelector('.countdown-secondary .hours');
        const minutesEl = el.querySelector('.countdown-secondary .minutes');
        const secondsEl = el.querySelector('.countdown-secondary .seconds');
        
        const updateTimer = () => {
            const diff = target - Date.now();
            if (diff <= 0) {
                clearInterval(timer);
                el.innerHTML = '<div class="countdown-live"><i class="fa-solid fa-circle-play"></i> ¡YA ABIERTO!</div>';
                return;
            }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff % 86400000) / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            
            daysEl.textContent = d;
            hoursEl.textContent = String(h).padStart(2, '0');
            minutesEl.textContent = String(m).padStart(2, '0');
            secondsEl.textContent = String(s).padStart(2, '0');
        };
        
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        window.runningCountdownTimers.push(timer);
    });
}
