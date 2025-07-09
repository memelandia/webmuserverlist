// js/explorar.js (v8 - con Slider de EXP por Tramos)

document.addEventListener('DOMContentLoaded', () => {
    initExplorar();
});

// Función para chequear el estado online (sin cambios)
async function checkServerStatus(serverId, url) {
    const statusBadge = document.getElementById(`status-${serverId}`);
    if (!statusBadge || !url) {
        if (statusBadge) statusBadge.style.display = 'none';
        return;
    }
    try {
        const { data, error } = await window.supabaseClient.functions.invoke('check-status', { body: JSON.stringify({ url }) });
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
    // Referencias a los elementos del DOM
    const serversGridContainer = document.getElementById('servers-grid-container');
    const filtersForm = document.getElementById('explore-filters-form');
    const resetBtn = document.getElementById('reset-filters-btn');
    const expSlider = document.getElementById('filter-exp-slider');
    const expValueSpan = document.getElementById('exp-value');

    if (!serversGridContainer || !filtersForm || !expSlider) return;

    // --- NUEVA LÓGICA PARA EL SLIDER DE EXPERIENCIA ---
    // Definimos nuestros tramos de EXP. El último es "infinito".
    const expSteps = [1, 5, 10, 20, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 2000, 5000, 9999, 100000];
    
    // Función para traducir el valor del slider (0-17) a un valor de EXP
    function getExpValueFromSlider(sliderValue) {
        const index = parseInt(sliderValue, 10);
        return expSteps[index];
    }

    // Función para actualizar el texto que ve el usuario
    function updateExpLabel(value) {
        if (value >= 99999) { // Nuestro valor "infinito"
            expValueSpan.textContent = 'Cualquiera';
        } else {
            expValueSpan.textContent = `≤ ${value}x`;
        }
    }
    
    // Event listener para el slider de EXP
    expSlider.addEventListener('input', () => {
        const currentExp = getExpValueFromSlider(expSlider.value);
        updateExpLabel(currentExp);
    });
    // --- FIN DE LA NUEVA LÓGICA ---

    // Event listener para el formulario de filtros
    filtersForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loadServers();
    });

    // Event listener para el botón de resetear filtros
    resetBtn.addEventListener('click', () => {
        document.getElementById('filter-name').value = '';
        document.getElementById('filter-version').value = '';
        document.getElementById('filter-type').value = '';
        document.getElementById('filter-configuration').value = '';
        document.getElementById('filter-exp-slider').value = 17;
        updateExpLabel(getExpValueFromSlider(17));
        loadServers();
    });

    // Carga inicial
    updateExpLabel(getExpValueFromSlider(expSlider.value)); // Establece la etiqueta inicial
    loadServers();

    async function loadServers() {
        serversGridContainer.innerHTML = `<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando servidores...</div>`;
        
        try {
            // Recoger todos los valores del formulario
            const expFilterValue = getExpValueFromSlider(document.getElementById('filter-exp-slider').value);

            const filters = {
                name: document.getElementById('filter-name').value.trim(),
                version: document.getElementById('filter-version').value,
                type: document.getElementById('filter-type').value,
                configuration: document.getElementById('filter-configuration').value,
                exp: expFilterValue,
                sort: document.getElementById('filter-sort').value
            };

            let query = window.supabaseClient
                .from('servers')
                .select('id, name, image_url, banner_url, version, type, configuration, exp_rate, drop_rate, description, website_url')
                .eq('status', 'aprobado');

            // Aplicar filtros
            if (filters.name) {
                query = query.ilike('name', `%${filters.name}%`);
            }
            
            if (filters.version) {
                query = query.eq('version', filters.version);
            }
            
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            
            if (filters.configuration) {
                query = query.eq('configuration', filters.configuration);
            }
            
            if (filters.exp < 99999) {
                query = query.lte('exp_rate', filters.exp);
            }
            
            // Aplicar opciones de ordenación
            switch (filters.sort) {
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'opening_soon':
                    query = query.not('opening_date', 'is', null)
                                 .gt('opening_date', new Date().toISOString())
                                 .order('opening_date', { ascending: true });
                    break;
                case 'votes_desc':
                default:
                    query = query.order('votes_count', { ascending: false, nullsFirst: false });
                    break;
            }
            
            query = query.order('is_featured', { ascending: false });

            const { data, error } = await query;
            if (error) throw error;
            renderServers(data);

        } catch (error) {
            console.error("Error cargando servidores:", error);
            serversGridContainer.innerHTML = `<div class="error-text">Error al cargar los servidores.</div>`;
        }
    }

    function renderServers(servers) {
        if (!servers || servers.length === 0) {
            serversGridContainer.innerHTML = `<p style="text-align: center; padding: 2rem;">No se encontraron servidores con los filtros aplicados.</p>`;
            return;
        }

        serversGridContainer.innerHTML = servers.map(server => {
            const shortDescription = server.description ? server.description.substring(0, 100) + '...' : 'Sin descripción.';
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
