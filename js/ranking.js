// js/ranking.js

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

let currentPage = 1;
const pageSize = 15;
let currentRankingType = 'general';

export function initRankingPage() {
    console.log("🚀 Inicializando Página de Ranking (ranking.js)...");
    
    const generalBtn = document.getElementById('rank-general-btn');
    const monthlyBtn = document.getElementById('rank-monthly-btn');
    const paginationContainer = document.getElementById('pagination-controls');

    if (!generalBtn || !monthlyBtn || !paginationContainer) {
        console.error("Elementos de UI para el ranking no encontrados.");
        return;
    }

    generalBtn.addEventListener('click', () => setRankingType('general'));
    monthlyBtn.addEventListener('click', () => setRankingType('monthly'));

    paginationContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button[data-page]');
        if (button && !button.disabled) {
            currentPage = parseInt(button.dataset.page, 10);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            fetchAndRenderRanking();
        }
    });
    
    fetchAndRenderRanking();
}

function setRankingType(type) {
    if (currentRankingType === type) return; 
    currentRankingType = type;
    currentPage = 1;
    fetchAndRenderRanking();
}

async function fetchAndRenderRanking() {
    const rankingContainer = document.getElementById('ranking-container');
    const paginationContainer = document.getElementById('pagination-controls');
    
    // Mostrar skeleton loading para tabla de ranking
    ui.renderSkeletonLoading(rankingContainer, 'ranking', 15);
    paginationContainer.innerHTML = '';
    
    ui.updateRankingFilterButtons(currentRankingType);

    try {
        const { data, count } = await api.getRankingServers(currentRankingType, currentPage, pageSize);

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