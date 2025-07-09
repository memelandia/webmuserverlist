// js/admin.js (v4 - Corregido con refresco de UI automático)

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificar si el usuario es administrador
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
    
    // 2. Si es admin, mostrar el panel e inicializarlo
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

    // --- LÓGICA DE EVENTOS (para no repetir código) ---
    function addServerActionListeners() {
        contentContainer.querySelectorAll('.approve-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            await window.supabaseClient.from('servers').update({ status: 'aprobado' }).eq('id', e.target.dataset.id);
            renderAdminContent(); // <<< CORRECCIÓN: Refrescar la vista
        }));
        contentContainer.querySelectorAll('.deny-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            if (confirm('¿Seguro que quieres eliminar/rechazar este servidor? Esta acción no se puede deshacer.')) {
                await window.supabaseClient.from('servers').delete().eq('id', e.target.dataset.id);
                renderAdminContent(); // <<< CORRECCIÓN: Refrescar la vista
            }
        }));
        contentContainer.querySelectorAll('.featured-toggle').forEach(toggle => toggle.addEventListener('change', async (e) => {
            await window.supabaseClient.from('servers').update({ is_featured: e.target.checked }).eq('id', e.target.dataset.id);
            // Opcional: podrías mostrar un pequeño feedback "Guardado" en lugar de recargar todo
        }));
    }

    function addUserActionListeners() {
        contentContainer.querySelectorAll('.user-role-select').forEach(select => select.addEventListener('change', async (e) => {
            await window.supabaseClient.from('profiles').update({ role: e.target.value }).eq('id', e.target.dataset.id);
            alert(`Rol de usuario actualizado a ${e.target.value}.`);
            renderAdminContent(); // <<< CORRECCIÓN: Refrescar la vista para consistencia
        }));
        contentContainer.querySelectorAll('.ban-toggle-btn').forEach(btn => btn.addEventListener('click', async (e) => {
            const currentStatus = e.target.dataset.status;
            const newStatus = currentStatus === 'banned' ? 'active' : 'banned';
            const actionText = newStatus === 'banned' ? 'banear' : 'quitar el ban a';
            if (confirm(`¿Seguro que quieres ${actionText} este usuario?`)) {
                await window.supabaseClient.from('profiles').update({ status: newStatus }).eq('id', e.target.dataset.id);
                renderAdminContent(); // <<< CORRECCIÓN: Refrescar la vista
            }
        }));
    }

    // Carga inicial
    renderAdminContent();
}