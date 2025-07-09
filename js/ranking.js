// js/ranking.js (v12 - SOLUCIÓN RANKING MENSUAL)

document.addEventListener('DOMContentLoaded', () => {
    console.log("==> SCRIPT DE RANKING INICIADO (DOM COMPLETAMENTE CARGADO) <==");
    initRanking();
});

function initRanking() {
    const rankingContainer = document.getElementById('ranking-container');
    const paginationContainer = document.getElementById('pagination-controls');
    const generalBtn = document.getElementById('rank-general-btn');
    const monthlyBtn = document.getElementById('rank-monthly-btn');

    if (!rankingContainer || !paginationContainer || !generalBtn || !monthlyBtn) {
        console.error("ERROR CRÍTICO: No se encontraron todos los elementos necesarios. Verifica que los IDs en ranking.html coincidan.");
        return;
    }

    let currentPage = 1;
    const pageSize = 15;
    // Hacemos que la variable sea accesible en todo el scope de initRanking
    let currentRankingType = 'general'; 

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

    async function fetchRankingData(page) {
        console.log(`Fetching data for ranking type: "${currentRankingType}", page: ${page}`);
        rankingContainer.innerHTML = `<tr><td colspan="9" class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>`;
        paginationContainer.innerHTML = '';

        try {
            let query;

            if (currentRankingType === 'general') {
                console.log("Querying 'servers' table for general ranking.");
                query = window.supabaseClient
                    .from('servers')
                    .select('id, name, image_url, version, type, configuration, exp_rate, drop_rate, votes_count, average_rating, review_count', { count: 'exact' })
                    .eq('status', 'aprobado')
                    .order('votes_count', { ascending: false, nullsFirst: false });

            } else {
                // <-- CAMBIO CLAVE 1: Usar la vista correcta para el ranking mensual.
                console.log("Querying 'monthly_server_votes' view for monthly ranking.");
                query = window.supabaseClient
                    .from('monthly_server_votes')
                    .select('*', { count: 'exact' }) // La vista ya tiene las columnas que necesitamos
                    .order('monthly_votes_count', { ascending: false, nullsFirst: false }); // <-- CAMBIO CLAVE 2: Ordenar por votos mensuales.
            }

            // Aplicar paginación a la consulta
            const { data, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
            
            console.log("Supabase response received:", { data, count, error });

            if (error) {
                // Si hay un error, lo lanzamos para que el bloque catch lo capture.
                throw new Error(error.message);
            }

            if (!data || data.length === 0) {
                console.log("No data found for this ranking/page.");
                rankingContainer.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 2rem;">No hay servidores en este ranking.</td></tr>`;
                return;
            }

            console.log(`Rendering ${data.length} servers.`);
            renderRankingTable(data, page);
            
            console.log(`Rendering pagination for a total of ${count} items.`);
            renderPagination(count, page);

        } catch (err) {
            console.error("CRITICAL ERROR while fetching ranking data:", err);
            rankingContainer.innerHTML = `<tr><td colspan="9" class="error-text"><b>Error al cargar:</b> ${err.message}. Revisa la consola (F12) para más detalles.</td></tr>`;
        }
    }

    function renderRankingTable(servers, page) {
        rankingContainer.innerHTML = servers.map((server, index) => {
            const position = (page - 1) * pageSize + index + 1;
            const expRate = server.exp_rate ? `${server.exp_rate}x` : 'N/A';
            const dropRate = server.drop_rate ? `${server.drop_rate}%` : 'N/A';
            
            // <-- CAMBIO CLAVE 3: Mostrar los votos correctos según el tipo de ranking.
            const votes = currentRankingType === 'monthly'
                ? server.monthly_votes_count || 0
                : server.votes_count || 0;
            
            const optimizedLogo = getOptimizedImageUrl('server-images', server.image_url, { width: 90, height: 90 }, 'https://via.placeholder.com/45');
            return `
                <tr>
                    <td><span class="rank-position">${position}</span></td>
                    <td class="server-info-cell">
                        <img src="${optimizedLogo}" alt="Logo de ${server.name}" class="server-logo-table" width="45" height="45">
                        <div><a href="servidor.html?id=${server.id}" class="server-name-link">${server.name}</a><div class="server-version-tag">${server.version || 'N/A'}</div></div>
                    </td>
                    <td class="table-rating"><span class="stars">${renderStars(server.average_rating || 0)}</span><span class="review-count">(${server.review_count || 0})</span></td>
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
        if (totalPages <= 1) { paginationContainer.innerHTML = ''; return; }
        const prevDisabled = page === 1 ? 'disabled' : '';
        const nextDisabled = page === totalPages ? 'disabled' : '';
        paginationContainer.innerHTML = `
            <button class="btn btn-secondary" data-page="${page - 1}" ${prevDisabled}><i class="fa-solid fa-chevron-left"></i> Anterior</button>
            <span class="pagination-info">Página ${page} de ${totalPages}</span>
            <button class="btn btn-secondary" data-page="${page + 1}" ${nextDisabled}>Siguiente <i class="fa-solid fa-chevron-right"></i></button>`;
        paginationContainer.querySelectorAll('button[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); if (btn.hasAttribute('disabled')) return;
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
        const full = '★'.repeat(Math.floor(rating));
        const empty = '☆'.repeat(5 - Math.floor(rating));
        return `${full}${empty}`;
    }

    // Carga inicial
    updateButtonStyles();
    fetchRankingData(currentPage);
}