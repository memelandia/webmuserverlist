// js/explorar.js

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

export function initExplorarPage() {
    console.log("🚀 Inicializando Página de Explorar (explorar.js)...");
    
    const filtersForm = document.getElementById('explore-filters-form');
    const resetBtn = document.getElementById('reset-filters-btn');

    if (!filtersForm || !resetBtn) {
        console.error("No se encontraron los elementos del formulario de filtros.");
        return;
    }

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
    
    ui.initExpSlider();
    
    loadServers();
}

async function loadServers() {
    const serversGridContainer = document.getElementById('servers-grid-container');
    if (!serversGridContainer) return;

    ui.renderLoading(serversGridContainer, "Buscando servidores...");
    
    try {
        const filters = ui.getExploreFilters();
        const servers = await api.getExploreServers(filters);
        ui.renderExploreServers(serversGridContainer, servers);
    } catch (error) {
        console.error("Error cargando servidores en explorar:", error);
        ui.renderError(serversGridContainer, "No se pudieron cargar los servidores. Inténtalo de nuevo.");
    }
}