// js/admin.js (v6 - Solución final para Servidor del Mes)

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        showAccessDenied();
        return;
    }

    const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
    
    if (!profile || profile.role !== 'admin') {
        showAccessDenied();
        return;
    }
    
    document.getElementById('admin-panel').style.display = 'block';
    document.getElementById('admin-auth-required').style.display = 'none';
    initAdminPanel();
});

function showAccessDenied() {
    document.getElementById('admin-panel').style.display = 'none';
    document.getElementById('admin-auth-required').style.display = 'block';
}

function initAdminPanel() {
    const tabs = document.querySelectorAll('.admin-tab');
    const contentContainer = document.getElementById('admin-content');
    let currentTab = 'pending-servers';

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderAdminContent();
        });
    });

    async function renderAdminContent() {
        contentContainer.innerHTML = `<div class="loading-text"><i class="fa-solid fa-spinner fa-spin"></i> Cargando contenido...</div>`;
        switch (currentTab) {
            case 'pending-servers':
                await loadPendingServers();
                break;
            case 'all-servers':
                await loadAllServers();
                break;
            case 'users':
                await loadUsers();
                break;
            case 'server-of-the-month':
                await loadServerOfTheMonthManager();
                break;
        }
    }

    // --- PESTAÑA 1: SERVIDORES PENDIENTES ---
    async function loadPendingServers() {
        const { data, error } = await window.supabaseClient.from('servers').select('*').eq('status', 'pendiente');
        if (error) {
            contentContainer.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
            return;
        }
        if (data.length === 0) {
            contentContainer.innerHTML = '<p>No hay servidores pendientes de aprobación.</p>';
            return;
        }
        contentContainer.innerHTML = data.map(s => `
            <div class="detail-card">
                <h4>${s.name} <small>(${s.version})</small></h4>
                <div class="actions">
                    <button data-id="${s.id}" class="btn btn-sm btn-primary approve-btn">Aprobar</button>
                    <a href="servidor.html?id=${s.id}" target="_blank" class="btn btn-sm btn-secondary">Ver</a>
                    <button data-id="${s.id}" class="btn btn-sm btn-danger deny-btn">Rechazar</button>
                </div>
            </div>`).join('');
        
        addServerActionListeners();
    }

    // --- PESTAÑA 2: GESTIONAR TODOS LOS SERVIDORES ---
    async function loadAllServers() {
        const { data, error } = await window.supabaseClient.from('servers').select('*').neq('status', 'pendiente').order('created_at', { ascending: false });
        if (error) {
            contentContainer.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
            return;
        }
        contentContainer.innerHTML = data.map(s => `
            <div class="detail-card">
                <h4>${s.name} <span class="status-tag status-${s.status}">${s.status}</span></h4>
                <div class="actions">
                    <span>Destacado:</span>
                    <label class="switch">
                        <input type="checkbox" class="featured-toggle" data-id="${s.id}" ${s.is_featured ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <a href="editar-servidor.html?id=${s.id}" class="btn btn-sm btn-secondary">Editar</a>
                    <button data-id="${s.id}" class="btn btn-sm btn-danger deny-btn">Eliminar</button>
                </div>
            </div>`).join('');
        
        addServerActionListeners();
    }
    
    // --- PESTAÑA 3: GESTIONAR USUARIOS ---
    async function loadUsers() {
        const { data, error } = await window.supabaseClient.from('profiles').select('*').order('role');
        if (error) {
            contentContainer.innerHTML = `<p class="error-text">Error: ${error.message}</p>`;
            return;
        }
        contentContainer.innerHTML = data.map(u => `
            <div class="detail-card">
                <h4>${u.username || u.email} <span class="status-tag status-${u.status === 'banned' ? 'rechazado' : 'aprobado'}">${u.status || 'active'}</span></h4>
                <div class="actions">
                    <span>Rol:</span>
                    <select class="user-role-select" data-id="${u.id}">
                        <option value="user" ${u.role === 'user' ? 'selected' : ''}>Usuario</option>
                        <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                    <button class="btn btn-sm btn-danger ban-toggle-btn" data-id="${u.id}" data-status="${u.status || 'active'}">
                        ${u.status === 'banned' ? 'Quitar Ban' : 'Banear'}
                    </button>
                </div>
            </div>`).join('');
        
        addUserActionListeners();
    }

    // --- PESTAÑA 4: GESTIONAR SERVIDOR DEL MES (LÓGICA FINAL Y CORRECTA) ---
    async function loadServerOfTheMonthManager() {
        try {
            // 1. Obtener el ganador actual de la tabla 'servers'
            const { data: currentWinner, error: winnerError } = await window.supabaseClient
                .from('servers')
                .select('id, name, image_url')
                .eq('is_server_of_the_month', true)
                .single();

            // 2. Obtener la lista de todos los servidores aprobados
            const { data: allServers, error: serversError } = await window.supabaseClient
                .from('servers')
                .select('id, name')
                .eq('status', 'aprobado')
                .order('name', { ascending: true });
            
            if (winnerError && winnerError.code !== 'PGRST116') throw winnerError;
            if (serversError) throw serversError;

            // 3. Renderizar el HTML
            let currentWinnerHtml = `
                <div id="som-current-winner">
                    <i class="fa-solid fa-trophy fa-3x" style="color: var(--text-secondary);"></i>
                    <div>
                        <h4>Aún no hay ganador</h4>
                        <p>Selecciona un servidor de la lista para establecerlo como ganador.</p>
                    </div>
                </div>`;
            
            if (currentWinner) {
                const logoUrl = getOptimizedImageUrl('server-images', currentWinner.image_url, { width: 160, height: 160 }, 'https://via.placeholder.com/80');
                currentWinnerHtml = `
                    <div id="som-current-winner">
                        <img src="${logoUrl}" alt="Logo de ${currentWinner.name}">
                        <div>
                             <h4>Ganador Actual: ${currentWinner.name}</h4>
                             <p>ID: ${currentWinner.id}</p>
                        </div>
                    </div>`;
            }

            const serverOptionsHtml = allServers.map(server => 
                `<option value="${server.id}" ${currentWinner && currentWinner.id == server.id ? 'selected' : ''}>
                    ${server.name} (ID: ${server.id})
                </option>`
            ).join('');

            contentContainer.innerHTML = `
                ${currentWinnerHtml}
                <form id="som-selection-form">
                    <div class="form-group">
                        <label for="som-select">Seleccionar Nuevo Servidor del Mes</label>
                        <select id="som-select" class="form-control" required>
                            <option value="">-- Elige un servidor --</option>
                            ${serverOptionsHtml}
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg">Establecer como Ganador</button>
                </form>
                <div id="som-feedback" class="feedback-message" style="margin-top: 1rem;"></div>
            `;

            // 4. Añadir el event listener al formulario
            document.getElementById('som-selection-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const selectedServerId = document.getElementById('som-select').value;
                const feedbackEl = document.getElementById('som-feedback');
                
                if (!selectedServerId) {
                    feedbackEl.textContent = 'Por favor, selecciona un servidor.';
                    feedbackEl.className = 'feedback-message error';
                    return;
                }

                const button = e.target.querySelector('button');
                button.disabled = true;
                button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';

                try {
                    // Paso A: Quitar la marca de ganador a CUALQUIER servidor que la tenga
                    const { error: resetError } = await window.supabaseClient
                        .from('servers')
                        .update({ is_server_of_the_month: false })
                        .eq('is_server_of_the_month', true);

                    if (resetError) throw resetError;

                    // Paso B: Poner la marca de ganador al servidor seleccionado
                    const { error: setError } = await window.supabaseClient
                        .from('servers')
                        .update({ is_server_of_the_month: true })
                        .eq('id', selectedServerId);
                    
                    if (setError) throw setError;
                    
                    feedbackEl.textContent = '¡Servidor del Mes actualizado con éxito!';
                    feedbackEl.className = 'feedback-message success';

                    setTimeout(renderAdminContent, 2000);

                } catch (error) {
                    feedbackEl.textContent = `Error: ${error.message}`;
                    feedbackEl.className = 'feedback-message error';
                    button.disabled = false;
                    button.innerHTML = 'Establecer como Ganador';
                }
            });

        } catch (error) {
            contentContainer.innerHTML = `<p class="error-text">Error cargando el gestor: ${error.message}</p>`;
        }
    }


    // --- LÓGICA DE EVENTOS (para no repetir código) ---
    function addServerActionListeners() {
        contentContainer.querySelectorAll('.approve-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            await window.supabaseClient.from('servers').update({ status: 'aprobado' }).eq('id', e.target.dataset.id);
            renderAdminContent(); 
        }));
        contentContainer.querySelectorAll('.deny-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            if (confirm('¿Seguro que quieres eliminar/rechazar este servidor? Esta acción no se puede deshacer.')) {
                await window.supabaseClient.from('servers').delete().eq('id', e.target.dataset.id);
                renderAdminContent(); 
            }
        }));
        contentContainer.querySelectorAll('.featured-toggle').forEach(toggle => toggle.addEventListener('change', async (e) => {
            await window.supabaseClient.from('servers').update({ is_featured: e.target.checked }).eq('id', e.target.dataset.id);
        }));
    }

    function addUserActionListeners() {
        contentContainer.querySelectorAll('.user-role-select').forEach(select => select.addEventListener('change', async (e) => {
            await window.supabaseClient.from('profiles').update({ role: e.target.value }).eq('id', e.target.dataset.id);
            alert(`Rol de usuario actualizado a ${e.target.value}.`);
            renderAdminContent();
        }));
        contentContainer.querySelectorAll('.ban-toggle-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            const currentStatus = e.target.dataset.status;
            const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
            const actionText = newStatus === 'banned' ? 'banear' : 'quitar el ban a';
            if (confirm(`¿Seguro que quieres ${actionText} este usuario?`)) {
                await window.supabaseClient.from('profiles').update({ status: newStatus }).eq('id', e.target.dataset.id);
                renderAdminContent();
            }
        }));
    }

    // Carga inicial
    renderAdminContent();
}