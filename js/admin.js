// js/admin.js (v13 - Controlador del Panel de Admin)

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

// La función principal que se llamará desde main-app.js
export async function initAdminPage() {
    console.log("🚀 Inicializando Panel de Administración (admin.js)...");
    
    const adminPanel = document.getElementById('admin-panel');
    const authRequired = document.getElementById('admin-auth-required');
    const contentContainer = document.getElementById('admin-content');
    const tabs = document.querySelectorAll('.admin-tab');

    // 1. Verificación de permisos
    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) throw new Error("Acceso restringido. Debes iniciar sesión.");

        const profile = await api.getUserProfile(session.user.id);
        if (profile.role !== 'admin') throw new Error("Debes ser administrador para ver esta página.");

        // Si todo está bien, mostramos el panel
        adminPanel.style.display = 'block';
        authRequired.style.display = 'none';

    } catch (error) {
        adminPanel.style.display = 'none';
        authRequired.style.display = 'block';
        const p = authRequired.querySelector('p');
        if (p) p.textContent = error.message;
        return; // Detenemos la ejecución si no hay permisos
    }

    // 2. Lógica de Pestañas (Tabs)
    let currentTab = 'pending-servers';

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentTab = tab.dataset.tab;
            renderAdminContent(contentContainer, currentTab);
        });
    });

    // 3. Renderizado de Contenido y asignación de eventos
    // Se usa delegación de eventos en el contenedor para manejar clics y cambios
    contentContainer.addEventListener('click', async (e) => {
        const target = e.target;
        
        // Botones de acción de servidores
        const approveBtn = target.closest('.approve-btn');
        const denyBtn = target.closest('.deny-btn');

        if (approveBtn) {
            await api.updateServer(approveBtn.dataset.id, { status: 'aprobado' });
            renderAdminContent(contentContainer, currentTab); 
        }

        if (denyBtn) {
            if (confirm('¿Seguro que quieres eliminar/rechazar este servidor? Esta acción no se puede deshacer.')) {
                await api.deleteServer(denyBtn.dataset.id);
                renderAdminContent(contentContainer, currentTab); 
            }
        }
    });
    
    contentContainer.addEventListener('change', async (e) => {
        const target = e.target;

        // Toggle de servidor destacado
        if (target.matches('.featured-toggle')) {
            await api.updateServer(target.dataset.id, { is_featured: target.checked });
        }

        // Cambio de rol de usuario
        if (target.matches('.user-role-select')) {
             await api.updateUserProfile(target.dataset.id, { role: target.value });
             alert(`Rol de usuario actualizado a ${target.value}.`);
             renderAdminContent(contentContainer, currentTab);
        }
    });

    // Carga inicial
    renderAdminContent(contentContainer, currentTab);
}

// Función que decide qué contenido mostrar según la pestaña activa
async function renderAdminContent(container, tabName) {
    ui.renderLoading(container, "Cargando contenido del panel...");

    try {
        switch (tabName) {
            case 'pending-servers':
                const pendingServers = await api.getServersByStatus('pendiente');
                ui.renderAdminPendingServers(container, pendingServers);
                break;
            case 'all-servers':
                const allOtherServers = await api.getAllServersForAdmin();
                ui.renderAdminAllServers(container, allOtherServers);
                break;
            case 'users':
                const allUsers = await api.getAllUsersForAdmin();
                ui.renderAdminUsers(container, allUsers);
                break;
            case 'server-of-the-month':
                const { currentWinner, allServers } = await api.getDataForSomAdmin();
                ui.renderAdminSoM(container, { currentWinner, allServers });

                // Añadimos el listener específico para el form de SoM después de renderizarlo
                const somForm = document.getElementById('som-selection-form');
                if(somForm) somForm.addEventListener('submit', handleSoMSubmit);
                break;
        }
    } catch(error) {
        console.error("Error en panel de admin:", error);
        ui.renderError(container, error.message);
    }
}

async function handleSoMSubmit(e) {
    e.preventDefault();
    const selectedServerId = document.getElementById('som-select').value;
    const feedbackEl = document.getElementById('som-feedback');
    const button = e.target.querySelector('button');

    if (!selectedServerId) {
        ui.setFormFeedback(feedbackEl, 'Por favor, selecciona un servidor.', 'error');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';

    try {
        await api.setServerOfTheMonth(selectedServerId);
        ui.setFormFeedback(feedbackEl, '¡Servidor del Mes actualizado con éxito!', 'success');
        
        // Recargar la pestaña actual después de 2 segundos
        setTimeout(() => {
            const container = document.getElementById('admin-content');
            renderAdminContent(container, 'server-of-the-month');
        }, 2000);

    } catch (error) {
        ui.setFormFeedback(feedbackEl, `Error: ${error.message}`, 'error');
        button.disabled = false;
        button.innerHTML = 'Establecer como Ganador';
    }
}