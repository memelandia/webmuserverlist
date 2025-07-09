// js/ranking.js (v13 - Controlador de la Página de Ranking)

// Importamos lo que necesitamos: la API para los datos, y la UI para dibujarlos.
import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

let currentPage = 1;
const pageSize = 15;
let currentRankingType = 'general';

// La función principal que se llamará desde main-app.js
export function initRankingPage() {
    console.log("🚀 Inicializando Página de Ranking (ranking.js)...");
    
    // Obtenemos referencias a los elementos del DOM.
    const generalBtn = document.getElementById('rank-general-btn');
    const monthlyBtn = document.getElementById('rank-monthly-btn');
    const paginationContainer = document.getElementById('pagination-controls');

    // Asignamos los eventos a los botones de filtro.
    generalBtn.addEventListener('click', () => setRankingType('general'));
    monthlyBtn.addEventListener('click', () => setRankingType('monthly'));

    // Asignamos eventos a la paginación (si se hace click en el contenedor)
    paginationContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-page]');
        if (button && !button.hasAttribute('disabled')) {
            currentPage = parseInt(button.dataset.page, 10);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            fetchAndRenderRanking();
        }
    });
    
    // Hacemos la carga inicial de datos.
    fetchAndRenderRanking();
}

function setRankingType(type) {
    if (currentRankingType === type) return; // No hacer nada si ya está seleccionado
    currentRankingType = type;
    currentPage = 1;
    fetchAndRenderRanking();
}

async function fetchAndRenderRanking() {
    const rankingContainer = document.getElementById('ranking-container');
    const paginationContainer = document.getElementById('pagination-controls');
    
    // Mostramos un mensaje de carga.
    ui.renderLoading(rankingContainer, '<tr><td colspan="9" class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando ranking...</td></tr>');
    paginationContainer.innerHTML = '';
    
    // Actualizamos el estilo de los botones de filtro.
    ui.updateRankingFilterButtons(currentRankingType);

    try {
        // 1. LLAMAMOS A LA API: Obtenemos los servidores y el conteo total.
        const { data, count } = await api.getRankingServers(currentRankingType, currentPage, pageSize);

        // 2. RENDERIZAMOS LA UI: Le pasamos los datos al módulo de UI.
        ui.renderRankingTable(rankingContainer, data, { 
            page: currentPage, 
            pageSize: pageSize, 
            rankingType: currentRankingType 
        });

        ui.renderPagination(paginationContainer, count, currentPage, pageSize);
    } catch (error) {
        console.error("Error al cargar el ranking:", error);
        ui.renderError(rankingContainer, `<tr><td colspan="9" class="error-text"><b>Error al cargar:</b> ${error.message}.</td></tr>`);
    }
}