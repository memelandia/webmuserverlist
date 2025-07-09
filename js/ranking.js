// js/ranking.js (v8 - Con optimización de imágenes y rankings General/Mensual)

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
        rankingContainer.innerHTML = `<tr><td colspan="8" class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>`;
        
        const from = (page - 1) * pageSize;
        const to = page * pageSize - 1;

        let query;
        if (currentRankingType === 'general') {
            query = window.supabaseClient
                .from('servers')
                .select('id, name, image_url, version, average_rating, review_count, type, exp_rate, drop_rate, votes_count', { count: 'exact' })
                .eq('status', 'aprobado')
                .order('votes_count', { ascending: false, nullsFirst: false });
        } else {
            query = window.supabaseClient
                .from('monthly_server_votes')
                .select('*', { count: 'exact' });
        }
        
        const { data, error, count } = await query.range(from, to);
            
        if (error) {
            rankingContainer.innerHTML = `<tr><td colspan="8" class="error-text">Error al cargar el ranking.</td></tr>`;
            return;
        }

        renderRanking(data || [], page, pageSize);
        renderPagination(count || 0, page, pageSize);
    }

    function renderRanking(servers, page, pageSize) {
        if (servers.length === 0) {
            rankingContainer.innerHTML = '<tr><td colspan="8" class="loading-text">No hay servidores en este ranking.</td></tr>';
            return;
        }

        rankingContainer.innerHTML = servers.map((server, index) => {
            const position = (page - 1) * pageSize + index + 1;
            const expRate = server.exp_rate ? `${server.exp_rate}x` : 'N/A';
            const dropRate = server.drop_rate ? `${server.drop_rate}%` : 'N/A';
            const votes = currentRankingType === 'general' ? server.votes_count : server.monthly_votes_count;

            // ¡OPTIMIZACIÓN!
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
                    <td>${expRate}</td>
                    <td>${dropRate}</td>
                    <td class="votes-count">${votes || 0}</td>
                    <td><a href="servidor.html?id=${server.id}" class="btn btn-primary btn-sm">Ver</a></td>
                </tr>
            `;
        }).join('');
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
            btn.addEventListener('click', () => {
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
        let starsHtml = '';
        for(let i = 0; i < fullStars; i++) starsHtml += '<i class="fa-solid fa-star"></i>';
        if(halfStar) starsHtml += '<i class="fa-solid fa-star-half-alt"></i>';
        for(let i = 0; i < emptyStars; i++) starsHtml += '<i class="fa-regular fa-star"></i>';
        return starsHtml;
    }
    
    fetchRanking(currentPage);
}