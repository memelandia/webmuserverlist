// js/calendario.js

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

export function initCalendarioPage() {
    console.log("🚀 Inicializando Página de Calendario (calendario.js)...");
    loadCalendarOpenings();
}

async function loadCalendarOpenings() {
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;

    ui.renderLoading(calendarContainer, "Cargando próximas aperturas...");

    try {
        const servers = await api.getCalendarOpenings();
        ui.renderCalendarPage(calendarContainer, servers);
        
        // Iniciar los contadores de cuenta regresiva después de renderizar
        ui.startCountdownTimers();
        
    } catch (error) {
        console.error("Error cargando el calendario:", error);
        ui.renderError(calendarContainer, `Error al cargar el calendario: ${error.message}`);
    }
}