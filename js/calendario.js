// js/calendario.js (v5 - Diseño y Lógica de Tarjeta Corregidos - Final)

document.addEventListener('DOMContentLoaded', () => {
    initCalendario();
});

// Función para comprobar el estado online/offline de un servidor
async function checkServerStatus(serverId, url) {
    const statusBadge = document.getElementById(`status-${serverId}`);
    if (!statusBadge || !url) {
        if (statusBadge) statusBadge.style.display = 'none';
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.functions.invoke('check-status', {
            body: JSON.stringify({ url: url }),
        });

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
        console.error(`Error al chequear estado para ${url}:`, e);
        statusBadge.classList.remove('loading');
        statusBadge.classList.add('offline');
        statusBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Error`;
    }
}

// Función principal para inicializar la página del calendario
async function initCalendario() {
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;

    calendarContainer.innerHTML = `<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando calendario...</div>`;

    try {
        const { data, error } = await window.supabaseClient
            .from('servers')
            .select('id, name, image_url, banner_url, opening_date, version, type, website_url, description')
            .not('opening_date', 'is', null)
            .gt('opening_date', new Date().toISOString())
            .order('opening_date', { ascending: true })
            .eq('status', 'aprobado');

        if (error) throw error;

        if (!data || data.length === 0) {
            calendarContainer.innerHTML = `<p style="text-align: center; padding: 2rem;">No hay próximas aperturas programadas en este momento.</p>`;
            return;
        }

        calendarContainer.innerHTML = data.map(server => {
            const shortDescription = server.description ? server.description.substring(0, 80) + (server.description.length > 80 ? '...' : '') : 'Sin descripción.';
            
            // CORREGIDO: Aseguramos que banner_url e image_url sean strings, no arrays
            const bannerUrl = Array.isArray(server.banner_url) ? server.banner_url[0] : server.banner_url;
            const imageUrl = Array.isArray(server.image_url) ? server.image_url[0] : server.image_url;
            
            return `
            <div class="server-card-new opening-card">
                <div class="card-banner" style="background-image: url('${bannerUrl || 'https://via.placeholder.com/400x120.png?text=Banner'}')"></div>
                <div class="card-header">
                    <img src="${imageUrl || 'https://via.placeholder.com/80'}" alt="Logo de ${server.name}" class="card-logo">
                    <div class="card-status">
                         <div class="status-badge loading" id="status-${server.id}"><i class="fa-solid fa-spinner fa-spin"></i></div>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${server.name}</h3>
                    <div class="card-tags-icons">
                        <span title="Versión"><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                        <span title="Tipo"><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                    </div>
                     <p class="card-description">${shortDescription}</p>
                </div>
                <div class="card-countdown" data-countdown="${server.opening_date}">
                    <div class="countdown-main">
                        <span class="days">...</span> DÍAS
                    </div>
                    <div class="countdown-secondary">
                       <span class="hours">00</span>h : <span class="minutes">00</span>m : <span class="seconds">00</span>s
                    </div>
                </div>
                <div class="card-actions">
                    <a href="${server.website_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-solid fa-globe"></i> Sitio Web</a>
                    <a href="servidor.html?id=${server.id}" class="btn btn-primary"><i class="fa-solid fa-eye"></i> Ver Detalles</a>
                </div>
            </div>
        `;
        }).join('');

        startCountdownTimers();
        data.forEach(server => checkServerStatus(server.id, server.website_url));

    } catch (error) {
        console.error('Error cargando calendario:', error);
        calendarContainer.innerHTML = `<p class="error-text">No se pudo cargar el calendario: ${error.message}</p>`;
    }
}

// Función para manejar todos los contadores de tiempo en la página
function startCountdownTimers() {
    // Limpia contadores previos para evitar duplicados si se llama de nuevo
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
            const now = Date.now();
            const diff = target - now;

            if (diff <= 0) {
                clearInterval(timer);
                el.innerHTML = '<div class="countdown-live"><i class="fa-solid fa-circle-play"></i> ¡YA ABIERTO!</div>';
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            
            daysEl.textContent = d;
            hoursEl.textContent = String(h).padStart(2, '0');
            minutesEl.textContent = String(m).padStart(2, '0');
            secondsEl.textContent = String(s).padStart(2, '0');
        };
        
        updateTimer(); // Llamada inicial para no esperar 1s
        const timer = setInterval(updateTimer, 1000);
        window.runningCountdownTimers.push(timer);
    });
}
