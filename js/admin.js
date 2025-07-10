// js/admin.js (v14 - COMPLETO con corrección de bugs)

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

let currentTab = 'pending-servers';
let abortController = new AbortController(); // Para cancelar peticiones en curso

// La función principal que se llamará desde main-app.js
export async function initAdminPage() {
    console.log("🚀 Inicializando Panel de Administración (admin.js)...");
    
    const adminPanel = document.getElementById('admin-panel');
    const authRequired = document.getElementById('admin-auth-required');
    const contentContainer = document.getElementById('admin-content');
    const tabsContainer = document.querySelector('.admin-tabs');

    if (!adminPanel || !authRequired || !contentContainer || !tabsContainer) {
        console.error("No se encontraron elementos esenciales del panel de admin.");
        return;
    }
    
    // 1. Verificación de permisos
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) throw new Error("Acceso restringido. Debes iniciar sesión.");

        const profile = await api.getUserProfile(session.user.id);
        if (profile.role !== 'admin') throw new Error("Debes ser administrador para ver esta página.");

        adminPanel.style.display = 'block';
        authRequired.style.display = 'none';

    } catch (error) {
        adminPanel.style.display = 'none';
        authRequired.style.display = 'block';
        const p = authRequired.querySelector('p');
        if (p) p.textContent = error.message;
        return; // Detenemos la ejecución si no hay permisos
    }

    // 2. Lógica de Pestañas (Tabs) usando delegación de eventos
    tabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.admin-tab');
        if (!tab || tab.classList.contains('active')) return;

        // Abortar la petición de la pestaña anterior si estaba en curso
        abortController.abort();
        abortController = new AbortController(); // Crear un nuevo controller para la nueva petición

        tabsContainer.querySelector('.active')?.classList.remove('active');
        tab.classList.add('active');
        currentTab = tab.dataset.tab;
        renderAdminContent(contentContainer, currentTab);
    });

    // 3. Manejadores de eventos centralizados en el contenedor de contenido
    contentContainer.addEventListener('click', (e) => handleContentClick(e, contentContainer));
    contentContainer.addEventListener('change', (e) => handleContentChange(e, contentContainer));
    contentContainer.addEventListener('submit', (e) => handleContentSubmit(e, contentContainer));
    
    // Carga inicial
    renderAdminContent(contentContainer, currentTab);
}

// --- Manejadores de Eventos Delegados ---

async function handleContentClick(e, container) {
    const target = e.target;
    const approveBtn = target.closest('.approve-btn');
    const denyBtn = target.closest('.deny-btn');

    if (approveBtn) {
        approveBtn.disabled = true;
        approveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        await api.updateServer(approveBtn.dataset.id, { status: 'aprobado' });
        renderAdminContent(container, currentTab); 
    }

    if (denyBtn) {
        if (confirm('¿Seguro que quieres eliminar/rechazar este servidor? Esta acción no se puede deshacer.')) {
            denyBtn.disabled = true;
            denyBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            await api.deleteServer(denyBtn.dataset.id);
            renderAdminContent(container, currentTab); 
        }
    }
}

async function handleContentChange(e, container) {
    const target = e.target;

    if (target.matches('.featured-toggle')) {
        await api.updateServer(target.dataset.id, { is_featured: target.checked });
        // No es necesario recargar, el toggle es feedback suficiente
    }

    if (target.matches('.user-role-select')) {
         const newRole = target.value;
         const userId = target.dataset.id;
         const username = target.closest('.detail-card').querySelector('h4').textContent.trim();
         
         if (confirm(`¿Seguro que quieres cambiar el rol de "${username}" a "${newRole}"?`)) {
             try {
                await api.updateUserProfile(userId, { role: newRole });
                alert(`Rol de usuario actualizado a ${newRole}.`);
                renderAdminContent(container, currentTab);
             } catch(error) {
                console.error("Error al actualizar rol:", error);
                alert("Hubo un error al actualizar el rol.");
                target.value = target.dataset.initialRole; // Revertir visualmente
             }
         } else {
            target.value = target.dataset.initialRole; // Revertir si se cancela
         }
    }
}

async function handleContentSubmit(e, container) {
    if (e.target.id !== 'som-selection-form') return;
    e.preventDefault();
    
    const form = e.target;
    const selectedServerId = form.querySelector('#som-select').value;
    const feedbackEl = form.querySelector('#som-feedback');
    const button = form.querySelector('button[type="submit"]');

    if (!selectedServerId) {
        ui.setFormFeedback(feedbackEl, 'Por favor, selecciona un servidor.', 'error');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';

    try {
        await api.setServerOfTheMonth(selectedServerId);
        ui.setFormFeedback(feedbackEl, '¡Servidor del Mes actualizado con éxito!', 'success');
        
        setTimeout(() => renderAdminContent(container, currentTab), 2000);

    } catch (error) {
        ui.setFormFeedback(feedbackEl, `Error: ${error.message}`, 'error');
        button.disabled = false;
        button.innerHTML = 'Establecer como Ganador';
    }
}

// --- Función Principal de Renderizado de Contenido ---
async function renderAdminContent(container, tabName) {
    ui.renderLoading(container, `Cargando ${tabName.replace(/-/g, ' ')}...`);

    try {
        let content;
        switch (tabName) {
            case 'pending-servers':
                const pendingServers = await api.getServersByStatus('pendiente');
                content = ui.renderAdminPendingServers(pendingServers);
                break;
            case 'all-servers':
                const allOtherServers = await api.getAllServersForAdmin();
                content = ui.renderAdminAllServers(allOtherServers);
                break;
            case 'users':
                const allUsers = await api.getAllUsersForAdmin();
                content = ui.renderAdminUsers(allUsers);
                break;
            case 'server-of-the-month':
                const { currentWinner, allServers } = await api.getDataForSomAdmin();
                content = ui.renderAdminSoM({ currentWinner, allServers });
                break;
            default:
                content = `<p class="error-text">Pestaña no encontrada: ${tabName}</p>`;
        }
        if (container.isConnected) { // Comprobar si el contenedor sigue en el DOM
            container.innerHTML = content;
        }
    } catch(error) {
        if (error.name !== 'AbortError') { // Ignorar errores de aborto
            console.error("Error al renderizar contenido de admin:", error);
            if(container.isConnected) ui.renderError(container, `Error al cargar: ${error.message}`);
        }
    }
}