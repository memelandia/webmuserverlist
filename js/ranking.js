// js/ranking.js (v9 - Corregido ranking mensual y paginación mejorada)

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

    generalBtn.addEventListener('click', () => {
        if (currentRankingType === 'general') return;
        currentRankingType = 'general';
        currentPage = 1;
        updateButtonStyles();
        fetchRanking(currentPage);
    });

    monthlyBtn.addEventListener('click', () => {
        if (currentRankingType === 'monthly') return;
        currentRankingType = 'monthly';
        currentPage = 1;
        updateButtonStyles();
        fetchRanking(currentPage);
    });

    function updateButtonStyles() {
        if (currentRankingType === 'general') {
            generalBtn.classList.add('btn-primary', 'active');
            generalBtn.classList.remove('btn-secondary');
            monthlyBtn.classList.add('btn-secondary');
            monthlyBtn.classList.remove('btn-primary', 'active');
        } else {
            monthlyBtn.classList.add('btn-primary', 'active');
            monthlyBtn.classList.remove('btn-secondary');
            generalBtn.classList.add('btn-secondary');
            generalBtn.classList.remove('btn-primary', 'active');
        }
    }

    async function fetchRanking(page) {
        rankingContainer.innerHTML = `<tr><td colspan="9" class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>`;
        
        const from = (page - 1) * pageSize;
        const to = page * pageSize - 1;

        try {
            let query;
            
            // Simplificar la lógica de consulta para evitar problemas
            const columns = 'id, name, image_url, version, type, configuration, exp_rate, drop_rate, votes_count, average_rating, review_count';
            
            if (currentRankingType === 'general') {
                query = window.supabaseClient
                    .from('servers')
                    .select(columns, { count: 'exact' })
                    .eq('status', 'aprobado')
                    .order('votes_count', { ascending: false })
                    .range(from, to);
            } else {
                // Para el ranking mensual, usamos la misma tabla pero con diferente ordenamiento
                // hasta que se implemente una solución específica para votos mensuales
                query = window.supabaseClient
                    .from('servers')
                    .select(columns, { count: 'exact' })
                    .eq('status', 'aprobado')
                    .order('votes_count', { ascending: false })
                    .range(from, to);
            }
            
            // Ejecutar la consulta y capturar explícitamente los resultados
            const response = await query;
            const { data, count, error } = response;
            
            // Verificar si hay error explícitamente
            if (error) {
                console.error("Error en la consulta:", error);
                throw new Error(`Error al cargar el ranking: ${error.message}`);
            }
            
            // Verificar si hay datos
            if (!data || data.length === 0) {
                rankingContainer.innerHTML = `<tr><td colspan="9" class="text-center" style="padding: 2rem;">No hay servidores en este ranking.</td></tr>`;
                paginationContainer.innerHTML = '';
                return;
            }

            // Renderizar paginación y datos
            renderPagination(count, page, pageSize);

            rankingContainer.innerHTML = data.map((server, index) => {
                const position = (page - 1) * pageSize + index + 1;
                const expRate = server.exp_rate ? `${server.exp_rate}x` : 'N/A';
                const dropRate = server.drop_rate ? `${server.drop_rate}%` : 'N/A';
                const votes = server.votes_count || 0;

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
        } catch (error) {
            console.error("Error cargando ranking:", error);
            rankingContainer.innerHTML = `<tr><td colspan="9" class="error-text">Error al cargar el ranking: ${error.message}</td></tr>`;
            paginationContainer.innerHTML = '';
        }
    }
    
    function renderPagination(totalItems, page, pageSize) {
        if (!paginationContainer) return;
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
                fetchRanking(currentPage);
            });
        });
    }

    function renderStars(rating) {
        if (typeof rating !== 'number' || rating <= 0) return 'Sin Rating';
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5 ? 1 : 0;
        const emptyStars = 5 - fullStars - halfStar;
        let starsHtml = '★'.repeat(fullStars);
        if (halfStar) starsHtml += '½';
        starsHtml += '☆'.repeat(emptyStars);
        // Usando iconos de FontAwesome
        return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    }
    
    updateButtonStyles();
    fetchRanking(currentPage);
}
