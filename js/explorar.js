// js/explorar.js (v6 - con optimización de imágenes)

document.addEventListener('DOMContentLoaded', () => {
    initExplorar();
});

// La función checkServerStatus no necesita cambios
async function checkServerStatus(serverId, url) {
    const statusBadge = document.getElementById(`status-${serverId}`);
    if (!statusBadge || !url) {
        if (statusBadge) statusBadge.style.display = 'none';
        return;
    }
    try {
        const { data, error } = await window.supabaseClient.functions.invoke('check-status', { body: JSON.stringify({ url: url }) });
        if (error) throw error;
        statusBadge.classList.remove('loading');
        if (data.status === 'online') {
            statusBadge.classList.add('online');
            statusBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Online`;
        } else {
            statusBadge.classList.add('offline');
            statusBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Offline`;
        }
    } catch (e) {
        statusBadge.classList.remove('loading');
        statusBadge.classList.add('offline');
        statusBadge.innerHTML = `<i class="fa-solid fa-circle"></i> Error`;
    }
}

function initExplorar() {
    const serversGridContainer = document.getElementById('servers-grid-container');
    const filtersForm = document.getElementById('explore-filters-form');
    const resetBtn = document.getElementById('reset-filters-btn');

    if (!serversGridContainer || !filtersForm) return;

    let currentFilters = { name: '', version: '', type: '' };
    loadServers();

    filtersForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentFilters.name = document.getElementById('filter-name').value.trim();
        currentFilters.version = document.getElementById('filter-version').value.trim();
        currentFilters.type = document.getElementById('filter-type').value;
        loadServers();
    });

    resetBtn.addEventListener('click', () => {
        filtersForm.reset();
        currentFilters = { name: '', version: '', type: '' };
        loadServers();
    });

    async function loadServers() {
        serversGridContainer.innerHTML = `<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando servidores...</div>`;
        try {
            let query = window.supabaseClient
                .from('servers')
                .select('id, name, image_url, banner_url, version, type, exp_rate, drop_rate, description, website_url')
                .eq('status', 'aprobado');

            if (currentFilters.name) query = query.ilike('name', `%${currentFilters.name}%`);
            if (currentFilters.version) query = query.ilike('version', `%${currentFilters.version}%`);
            if (currentFilters.type) query = query.eq('type', currentFilters.type);
            
            query = query.order('is_featured', { ascending: false }).order('votes_count', { ascending: false, nullsFirst: false });
            
            const { data, error } = await query;
            if (error) throw error;
            renderServers(data);

        } catch (error) {
            serversGridContainer.innerHTML = `<div class="error-text">Error al cargar los servidores.</div>`;
        }
    }

    function renderServers(servers) {
        if (!servers || servers.length === 0) {
            serversGridContainer.innerHTML = `<p style="text-align: center; padding: 2rem;">No se encontraron servidores.</p>`;
            return;
        }

        serversGridContainer.innerHTML = servers.map(server => {
            const shortDescription = server.description ? server.description.substring(0, 100) + '...' : 'Sin descripción.';
            
            // Usando la nueva función de optimización
            const optimizedLogoUrl = getOptimizedImageUrl('server-images', server.image_url, { width: 160, height: 160 }, 'https://via.placeholder.com/80');
            const optimizedBannerUrl = getOptimizedImageUrl('server-banners', server.banner_url, { width: 400, height: 120 }, 'https://via.placeholder.com/400x120.png?text=Banner');
            
            return `
            <div class="server-card-new">
                <div class="card-banner" style="background-image: url('${optimizedBannerUrl}')"></div>
                <div class="card-header">
                    <img src="${optimizedLogoUrl}" alt="Logo de ${server.name}" class="card-logo" width="80" height="80">
                    <div class="card-status">
                        <div class="status-badge loading" id="status-${server.id}"><i class="fa-solid fa-spinner fa-spin"></i></div>
                    </div>
                </div>
                <div class="card-content">
                    <h3>${server.name}</h3>
                    <div class="card-tags-icons">
                        <span class="card-tag-icon" title="Versión"><i class="fa-solid fa-gamepad"></i> ${server.version || 'N/A'}</span>
                        <span class="card-tag-icon" title="Tipo"><i class="fa-solid fa-shield-halved"></i> ${server.type || 'N/A'}</span>
                        <span class="card-tag-icon" title="Experiencia"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path></svg> ${server.exp_rate || '?'}x</span>
                        <span class="card-tag-icon" title="Drop"><i class="fa-solid fa-gem"></i> ${server.drop_rate || '?'}%</span>
                    </div>
                    <p class="card-description">${shortDescription}</p>
                </div>
                <div class="card-actions">
                     <a href="${server.website_url || '#'}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary"><i class="fa-solid fa-globe"></i> Sitio Web</a>
                     <a href="servidor.html?id=${server.id}" class="btn btn-primary"><i class="fa-solid fa-eye"></i> Ver Detalles</a>
                </div>
            </div>`;
        }).join('');

        servers.forEach(server => checkServerStatus(server.id, server.website_url));
    }
}