// js/supabase-init.js (v5 - Con sistema de notificaciones en tiempo real)

const SUPABASE_URL = 'https://bqipsuaxtkhcwtjawtpy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxaXBzdWF4dGtoY3d0amF3dHB5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNTcyNjIsImV4cCI6MjA2NjkzMzI2Mn0.XVbUzRExUXVGCu4WFS_qYSQrNFSXVKPCB2rqgvlNmeo';

try {
    window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Cliente Supabase inicializado GLOBALMENTE.');
} catch (error) {
    console.error('Error fatal inicializando Supabase:', error);
}

// --- LÓGICA DE NOTIFICACIONES ---
let notificationListener = null;

async function initNotifications(user) {
    const container = document.querySelector('.user-menu-container');
    if (!container) return;

    // 1. Inyectar el HTML de la campana y el panel
    const notificationHtml = `
        <div class="notification-container">
            <i class="fa-solid fa-bell notification-bell" id="notification-bell">
                <span class="notification-badge hidden" id="notification-badge">0</span>
            </i>
            <div id="notification-panel" class="dropdown-menu">
                <div class="notification-panel-header">
                    <h4>Notificaciones</h4>
                    <button id="mark-all-read-btn">Marcar todo como leído</button>
                </div>
                <ul class="notification-list" id="notification-list">
                    <li class="no-notifications">Cargando...</li>
                </ul>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforebegin', notificationHtml);
    
    // 2. Obtener elementos del DOM
    const bell = document.getElementById('notification-bell');
    const badge = document.getElementById('notification-badge');
    const panel = document.getElementById('notification-panel');
    const list = document.getElementById('notification-list');
    const markReadBtn = document.getElementById('mark-all-read-btn');

    // 3. Función para obtener y renderizar notificaciones
    async function fetchNotifications() {
        const { data, error, count } = await window.supabaseClient
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
            
        if (error) {
            console.error("Error fetching notifications:", error);
            list.innerHTML = `<li class="no-notifications">Error al cargar.</li>`;
            return;
        }

        const unreadCount = data.filter(n => !n.is_read).length;
        
        // Actualizar contador
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        // Renderizar lista
        if (data.length === 0) {
            list.innerHTML = `<li class="no-notifications">No tienes notificaciones.</li>`;
        } else {
            list.innerHTML = data.map(n => `
                <li>
                    <a href="${n.link || '#'}" class="notification-item ${n.is_read ? '' : 'unread'}">
                        <p>${n.message}</p>
                        <span class="notification-time">${new Date(n.created_at).toLocaleString('es-ES')}</span>
                    </a>
                </li>
            `).join('');
        }
    }
    
    // 4. Función para marcar notificaciones como leídas
    async function markAsRead() {
        // Obtenemos IDs de las notificaciones no leídas
        const { data: unreadNotifications } = await window.supabaseClient
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (unreadNotifications.length === 0) return;

        const idsToUpdate = unreadNotifications.map(n => n.id);

        await window.supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .in('id', idsToUpdate);

        // Actualizamos la UI inmediatamente sin esperar el realtime
        badge.classList.add('hidden');
        document.querySelectorAll('.notification-item.unread').forEach(item => item.classList.remove('unread'));
    }

    // 5. Event Listeners
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.classList.toggle('active');
        // Si abrimos el panel y hay notificaciones no leídas, las marcamos como leídas tras un breve instante
        if (panel.classList.contains('active') && !badge.classList.contains('hidden')) {
            setTimeout(markAsRead, 2000);
        }
    });

    markReadBtn.addEventListener('click', markAsRead);

    document.addEventListener('click', (e) => {
        if (!panel.contains(e.target) && !bell.contains(e.target)) {
            panel.classList.remove('active');
        }
    });

    // 6. Suscripción a Realtime para actualizaciones automáticas
    if (notificationListener) {
        window.supabaseClient.removeChannel(notificationListener);
    }
    notificationListener = window.supabaseClient.channel(`notifications:${user.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload) => {
            console.log('Nueva notificación recibida!', payload);
            fetchNotifications(); // Volver a cargar todo para reflejar el cambio
        })
        .subscribe();

    // Carga inicial
    fetchNotifications();
}

// --- LÓGICA DE AUTENTICACIÓN CENTRALIZADA (MODIFICADA) ---
async function updateAuthUI(user) {
    const authSections = document.querySelectorAll('#auth-section');

    for (const section of authSections) {
        if (!section) continue;
        section.innerHTML = ''; // Limpiar la sección

        if (user) {
            // Usuario autenticado -> Menú desplegable
            const { data: profile } = await window.supabaseClient
                .from('profiles')
                .select('role, username')
                .eq('id', user.id)
                .single();

            const username = profile?.username || user.email.split('@')[0];
            
            let adminLinkHtml = '';
            if (profile && profile.role === 'admin') {
                adminLinkHtml = `<a href="admin.html" class="dropdown-item"><i class="fa-solid fa-user-shield"></i> Panel Admin</a>`;
            }

            // AÑADIMOS EL CONTENEDOR PRINCIPAL
            section.innerHTML = `
                <div class="user-menu-container">
                    <button id="user-menu-button" class="btn btn-secondary">
                        Hola, ${username} <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div id="user-dropdown-menu" class="dropdown-menu">
                        <a href="profile.html" class="dropdown-item"><i class="fa-solid fa-user-circle"></i> Mi Perfil</a>
                        <a href="agregar.html" class="dropdown-item"><i class="fa-solid fa-plus-circle"></i> Publicar Servidor</a>
                        ${adminLinkHtml}
                        <div class="dropdown-divider"></div>
                        <button id="logout-button-main" class="dropdown-item logout-btn">
                            <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>
            `;
            
            // INICIALIZAMOS LAS NOTIFICACIONES AQUÍ
            await initNotifications(user);

            // Lógica para el menú desplegable (existente)
            const menuButton = section.querySelector('#user-menu-button');
            const dropdownMenu = section.querySelector('#user-dropdown-menu');
            const chevron = menuButton?.querySelector('.fa-chevron-down');

            menuButton?.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = dropdownMenu.classList.toggle('active');
                if (isActive) {
                    chevron.style.transform = 'rotate(180deg)';
                } else {
                    chevron.style.transform = 'rotate(0deg)';
                }
            });
            
            document.addEventListener('click', () => {
                if (dropdownMenu?.classList.contains('active')) {
                    dropdownMenu.classList.remove('active');
                    if(chevron) chevron.style.transform = 'rotate(0deg)';
                }
            });

            section.querySelector('#logout-button-main')?.addEventListener('click', async () => {
                if (notificationListener) {
                    window.supabaseClient.removeChannel(notificationListener);
                }
                await window.supabaseClient.auth.signOut();
                if (window.location.pathname.includes('profile.html') || window.location.pathname.includes('admin.html')) {
                    window.location.href = 'index.html';
                } else {
                    window.location.reload(); 
                }
            });

        } else {
            // Usuario no autenticado: Mostrar botón de Iniciar Sesión
            section.innerHTML = `<button id="login-button-main" class="btn btn-primary">Iniciar Sesión</button>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!window.supabaseClient) return;
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    await updateAuthUI(session?.user || null);
    window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        await updateAuthUI(session?.user || null);
    });
});

// js/supabase-init.js

// ... (todo tu código existente) ...

/**
 * Genera una URL pública de Supabase Storage con transformaciones de imagen.
 * @param {string} bucketName - El nombre del bucket (ej. 'server-images').
 * @param {string} imagePath - La ruta/nombre del archivo de imagen.
 * @param {object} options - Opciones de transformación (ej. { width: 100, height: 100 }).
 * @param {string} fallbackUrl - Una URL de respaldo si imagePath es nulo.
 * @returns {string} - La URL transformada o la de respaldo.
 */
function getOptimizedImageUrl(bucketName, imagePath, options, fallbackUrl) {
    if (!imagePath) {
        return fallbackUrl;
    }
    
    // Si la URL ya es una URL completa (por retrocompatibilidad o datos antiguos), la devolvemos.
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    const { data } = window.supabaseClient.storage
        .from(bucketName)
        .getPublicUrl(imagePath, {
            transform: {
                ...options,
                resize: options.resize || 'cover' // 'cover' es un buen default
            },
        });

    return data.publicUrl;
}