// js/ranking.js (v10 - Usando RPC para máxima fiabilidad)

document.addEventListener('DOMContentLoaded', () => {
    initRanking();
});

function initRanking() {
    const rankingContainer = document.getElementById('ranking-table-body');
    const paginationContainer = document.getElementById('pagination-controls');
    const generalBtn = document.getElementById('rank-general-btn');
    const monthlyBtn = document.getElementById('rank-monthly-btn');

    if (!rankingContainer || !generalBtn || !monthlyBtn) return;

    let currentPage = 1;
    const pageSize = 15;
    let currentRankingType = 'general';

    // --- MANEJADORES DE EVENTOS PARA LOS BOTONES ---
    generalBtn.addEventListener('click', () => {
        if (currentRankingType === 'general') return;
        currentRankingType = 'general';
        currentPage = 1;
        updateButtonStyles();
        fetchRankingData(currentPage);
    });

    monthlyBtn.addEventListener('click', () => {
        if (currentRankingType === 'monthly') return;
        currentRankingType = 'monthly';
        currentPage = 1;
        updateButtonStyles();
        fetchRankingData(currentPage);
    });

    // --- FUNCIÓN PRINCIPAL PARA OBTENER Y RENDERIZAR DATOS ---
    async function fetchRankingData(page) {
        rankingContainer.innerHTML = `<tr><td colspan="9" class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>`;
        paginationContainer.innerHTML = ''; // Limpiar paginación mientras carga

        try {
            let data, count, error;

            if (currentRankingType === 'general') {
                // RANKING GENERAL: Consulta directa a la tabla
                const from = (page - 1) * pageSize;
                const to = page * pageSize - 1;
                
                const response = await window.supabaseClient
                    .from('servers')
                    .select('id, name, image_url, version, type, configuration, exp_rate, drop_rate, votes_count, average_rating, review_count', { count: 'exact' })
                    .eq('status', 'aprobado')
                    .order('votes_count', { ascending: false, nullsFirst: false })
                    .range(from, to);
                
                data = response.data;
                count = response.count;
                error = response.error;

            } else {
                // RANKING MENSUAL: Llamada a la función RPC
                const { data: rpcData, error: rpcError } = await window.supabaseClient
                    .rpc('get_monthly_ranking', { page_size: pageSize, page_num: page });

                // Para la paginación, llamamos a la función de conteo
                const { data: totalCount, error: countError } = await window.supabaseClient
                    .rpc('get_total_monthly_servers_count');

                data = rpcData;
                count = totalCount;
                error = rpcError || countError; // Si alguna de las dos llamadas falla
            }
            
            // Manejo de errores unificado
            if (error) {
                throw new Error(error.message);
            }

            // Si no hay datos, mostrar mensaje amigable
            if (!data || data.length === 0) {
                rankingContainer.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 2rem;">No hay servidores en este ranking.</td></tr>`;
                return;
            }

            // Si todo está bien, renderizar tabla y paginación
            renderRankingTable(data, page);
            renderPagination(count, page);

        } catch (err) {
            console.error("Error definitivo cargando el ranking:", err);
            rankingContainer.innerHTML = `<tr><td colspan="9" class="error-text">Error al cargar el ranking: ${err.message}</td></tr>`;
        }
    }

    // --- FUNCIONES AUXILIARES DE RENDERIZADO ---
    function renderRankingTable(servers, page) {
        rankingContainer.innerHTML = servers.map((server, index) => {
            const position = (page - 1) * pageSize + index + 1;
            const expRate = server.exp_rate ? `${server.exp_rate}x` : 'N/A';
            const dropRate = server.drop_rate ? `${server.drop_rate}%` : 'N/A';
            const votes = (currentRankingType === 'general' ? server.votes_count : server.monthly_votes_count) || 0;

            const optimizedLogo = getOptimizedImageUrl('server-images', server.image_url, { width: 90, height: 90 }, 'https://via.placeholder.com/45');

            return `
                <tr>
                    <td><span class="rank-position">${position}</span></td>
                    <td class="server-info-cell">
                        <img src="${optimizedLogo}" alt="Logo de ${server.name}" class="server-logo-table" width="45" height="45">
                        <div>
                            <a href="servidor.html?id=${server.id}" class="server-name-link">${server.name}</a>
                            <div class="server-version-tag">${server.version || 'N/A'}</div>
                        </div>
                    </td>
                    <td class="table-rating">
                        <span class="stars">${renderStars(server.average_rating || 0)}</span>
                        <span class="review-count">(${server.review_count || 0})</span>
                    </td>
                    <td>${server.type || 'N/A'}</td>
                    <td>${server.configuration || 'N/A'}</td>
                    <td>${expRate}</td>
                    <td>${dropRate}</td>
                    <td class="votes-count">${votes}</td>
                    <td><a href="servidor.html?id=${server.id}" class="btn btn-primary btn-sm">Ver</a></td>
                </tr>
            `;
        }).join('');
    }

    function renderPagination(totalItems, page) {
        const totalPages = Math.ceil(totalItems / pageSize);
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            return;
        }

        const prevDisabled = page === 1 ? 'disabled' : '';
        const nextDisabled = page === totalPages ? 'disabled' : '';

        paginationContainer.innerHTML = `
            <button class="btn btn-secondary" data-page="${page - 1}" ${prevDisabled}><i class="fa-solid fa-chevron-left"></i> Anterior</button>
            <span class="pagination-info">Página ${page} de ${totalPages}</span>
            <button class="btn btn-secondary" data-page="${page + 1}" ${nextDisabled}>Siguiente <i class="fa-solid fa-chevron-right"></i></button>`;
        
        paginationContainer.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if(btn.hasAttribute('disabled')) return;
                currentPage = parseInt(btn.dataset.page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                fetchRankingData(currentPage);
            });
        });
    }

    function updateButtonStyles() {
        if (currentRankingType === 'general') {
            generalBtn.classList.add('btn-primary', 'active'); generalBtn.classList.remove('btn-secondary');
            monthlyBtn.classList.add('btn-secondary'); monthlyBtn.classList.remove('btn-primary', 'active');
        } else {
            monthlyBtn.classList.add('btn-primary', 'active'); monthlyBtn.classList.remove('btn-secondary');
            generalBtn.classList.add('btn-secondary'); generalBtn.classList.remove('btn-primary', 'active');
        }
    }
    
    function renderStars(rating) {
        if (typeof rating !== 'number' || rating <= 0) return 'Sin Rating';
        const fullStars = '★'.repeat(Math.floor(rating));
        const emptyStars = '☆'.repeat(5 - Math.floor(rating));
        return `${fullStars}${emptyStars}`;
    }

    // Carga inicial
    updateButtonStyles();
    fetchRankingData(currentPage);
}