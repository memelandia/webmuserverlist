// js/calendario.js (v13 - Controlador de la Página de Calendario)

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

// Función principal que se llamará desde main-app.js
export function initCalendarioPage() {
    console.log("🚀 Inicializando Página de Calendario (calendario.js)...");
    loadCalendarOpenings();
}

async function loadCalendarOpenings() {
    const calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) return;

    ui.renderLoading(calendarContainer, "Cargando próximas aperturas...");

    try {
        // 1. Llamar a la API
        const servers = await api.getCalendarOpenings();
        
        // 2. Renderizar con el módulo de UI
        ui.renderCalendarPage(calendarContainer, servers);
        
        // 3. Iniciar los contadores
        ui.startCountdownTimers();
        
    } catch (error) {
        console.error("Error cargando el calendario:", error);
        ui.renderError(calendarContainer, `Error al cargar el calendario: ${error.message}`);
    }
}