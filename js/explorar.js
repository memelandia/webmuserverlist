// js/explorar.js (v13 - Controlador de la Página de Explorar)

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

// La función principal que se llamará desde main-app.js
export function initExplorarPage() {
    console.log("🚀 Inicializando Página de Explorar (explorar.js)...");
    
    // Referencias a los elementos del DOM
    const filtersForm = document.getElementById('explore-filters-form');
    const resetBtn = document.getElementById('reset-filters-btn');

    // Manejadores de eventos del formulario
    filtersForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loadServers();
    });

    resetBtn.addEventListener('click', () => {
        filtersForm.reset();
        // Disparamos un evento 'input' para que la etiqueta del slider se actualice
        document.getElementById('filter-exp-slider').dispatchEvent(new Event('input'));
        loadServers();
    });
    
    // Lógica del slider de experiencia
    ui.initExpSlider();
    
    // Carga inicial de servidores
    loadServers();
}

async function loadServers() {
    const serversGridContainer = document.getElementById('servers-grid-container');
    if (!serversGridContainer) return;

    ui.renderLoading(serversGridContainer, "Buscando servidores...");
    
    try {
        // 1. Obtener filtros desde la UI
        const filters = ui.getExploreFilters();

        // 2. Llamar a la API con los filtros
        const servers = await api.getExploreServers(filters);

        // 3. Renderizar los resultados con el módulo UI
        ui.renderExploreServers(serversGridContainer, servers);

    } catch (error) {
        console.error("Error cargando servidores en explorar:", error);
        ui.renderError(serversGridContainer, "Error al cargar los servidores.");
    }
}