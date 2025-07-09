// /js/modules/auth.js

// Este módulo maneja todo lo relacionado con la autenticación:
// 1. Mostrar/ocultar el modal de login/registro.
// 2. Gestionar los formularios de login y registro.
// 3. Actualizar la UI del header (botones, menú de usuario, notificaciones).
// 4. Gestionar el logout.

let notificationListener = null;

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
// Esta es la única función que se exporta y se llama desde main-app.js
export async function initAuth() {
    console.log("🚀 Inicializando Módulo de Autenticación...");

    // 1. Inicializa los listeners del modal (abrir/cerrar, cambiar entre login/registro)
    initAuthModal();

    // 2. Comprueba el estado de la sesión actual y actualiza la UI del header
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error) throw error;
        await updateAuthUI(session?.user || null);
    } catch (error) {
        console.error('Error al obtener la sesión inicial:', error);
        await updateAuthUI(null); // En caso de error, muestra la UI de no logueado
    }

    // 3. Escucha cambios en el estado de autenticación (login, logout)
    window.supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        console.log('Cambio de estado de autenticación detectado:', _event);
        await updateAuthUI(session?.user || null);
    });
}


// --- LÓGICA DEL MODAL DE AUTENTICACIÓN ---

function initAuthModal() {
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    if (!authModalOverlay) return;

    // Elementos del DOM del Modal
    const closeAuthModalButton = document.getElementById('close-auth-modal');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // Función para abrir el modal
    const openModal = () => {
        authModalOverlay.style.display = 'flex';
        setTimeout(() => {
            authModalOverlay.classList.add('active');
            authModalOverlay.querySelector('.modal-container')?.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    // Función para cerrar el modal
    const closeModal = () => {
        authModalOverlay.classList.remove('active');
        authModalOverlay.querySelector('.modal-container')?.classList.remove('active');
        setTimeout(() => {
            authModalOverlay.style.display = 'none';
            document.body.style.overflow = '';
            clearFeedback(loginForm);
            clearFeedback(registerForm);
        }, 300);
    };
    
    // Abrir modal al hacer clic en cualquier botón de login/registro
    document.addEventListener('click', (e) => {
        if (e.target.closest('#login-button-main, #login-link, #login-redirect-btn')) {
            e.preventDefault();
            showLoginView();
            openModal();
        }
    });

    // Cerrar modal
    if (closeAuthModalButton) closeAuthModalButton.addEventListener('click', closeModal);
    authModalOverlay.addEventListener('click', (event) => {
        if (event.target === authModalOverlay) closeModal();
    });

    // Cambiar entre vistas de login y registro
    const showRegisterView = (e) => {
        if (e) e.preventDefault();
        loginContainer?.classList.add('hidden');
        registerContainer?.classList.remove('hidden');
        clearFeedback(loginForm);
    };

    const showLoginView = (e) => {
        if (e) e.preventDefault();
        registerContainer?.classList.add('hidden');
        loginContainer?.classList.remove('hidden');
        clearFeedback(registerForm);
    };

    if (showRegisterLink) showRegisterLink.addEventListener('click', showRegisterView);
    if (showLoginLink) showLoginLink.addEventListener('click', showLoginView);
    
    // Manejar el envío de los formularios
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    // -- Manejadores de Formularios --
    async function handleLogin(e) {
        e.preventDefault();
        const submitButton = loginForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true);
        
        const identifier = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        setFeedback(loginForm, 'Iniciando sesión...', 'info');

        try {
            let email = identifier;
            if (!identifier.includes('@')) {
                setFeedback(loginForm, 'Verificando nombre de usuario...', 'info');
                const { data, error } = await window.supabaseClient.functions.invoke('get-email-from-username', {
                    body: { username: identifier }
                });
                if (error || !data.email) throw new Error('Nombre de usuario no encontrado.');
                email = data.email;
            }

            const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            setFeedback(loginForm, '¡Inicio de sesión exitoso! Redirigiendo...', 'success');
            setTimeout(closeModal, 1500);
            
            // Recargamos la página después de cerrar el modal para asegurar consistencia
            setTimeout(() => window.location.reload(), 1800);


        } catch (error) {
            console.error('Error de login:', error);
            setFeedback(loginForm, getAuthErrorMessage(error), 'error');
        } finally {
            setButtonLoading(submitButton, false);
        }
    }

    async function handleRegister(e) {
        e.preventDefault();
        const submitButton = registerForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true);
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        if (password !== confirmPassword) {
            setFeedback(registerForm, 'Las contraseñas no coinciden', 'error');
            setButtonLoading(submitButton, false);
            return;
        }

        setFeedback(registerForm, 'Creando cuenta...', 'info');

        try {
            const { error } = await window.supabaseClient.auth.signUp({
                email, password, options: { data: { username } }
            });
            if (error) throw error;
            
            setFeedback(registerForm, '¡Cuenta creada! Revisa tu correo para confirmar la cuenta.', 'success');
            registerForm.reset();
            setTimeout(showLoginView, 3000);
            
        } catch (error) {
            console.error('Error de registro:', error);
            setFeedback(registerForm, getAuthErrorMessage(error), 'error');
        } finally {
            setButtonLoading(submitButton, false);
        }
    }
}


// --- LÓGICA DE ACTUALIZACIÓN DE LA UI DEL HEADER ---

async function updateAuthUI(user) {
    const authSections = document.querySelectorAll('#auth-section');
    if (authSections.length === 0) return;

    for (const section of authSections) {
        // Detener escuchas de notificaciones si existen
        if (notificationListener) {
            window.supabaseClient.removeChannel(notificationListener);
            notificationListener = null;
        }
        section.innerHTML = ''; // Limpiar siempre antes de renderizar

        if (user) {
            // Usuario autenticado
            const { data: profile } = await window.supabaseClient
                .from('profiles').select('role, username').eq('id', user.id).single();
            const username = profile?.username || user.email.split('@')[0];
            
            section.innerHTML = `
                <div class="notification-container"></div>
                <div class="user-menu-container">
                    <button id="user-menu-button" class="btn btn-secondary">
                        Hola, ${username} <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div id="user-dropdown-menu" class="dropdown-menu">
                        <a href="profile.html" class="dropdown-item"><i class="fa-solid fa-user-circle"></i> Mi Perfil</a>
                        <a href="agregar.html" class="dropdown-item"><i class="fa-solid fa-plus-circle"></i> Publicar Servidor</a>
                        ${profile?.role === 'admin' ? `<a href="admin.html" class="dropdown-item"><i class="fa-solid fa-user-shield"></i> Panel Admin</a>` : ''}
                        <div class="dropdown-divider"></div>
                        <button id="logout-button-main" class="dropdown-item logout-btn">
                            <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                        </button>
                    </div>
                </div>
            `;

            initUserMenu(section);
            initNotifications(user, section.querySelector('.notification-container'));
        } else {
            // Usuario no autenticado
            section.innerHTML = `<button id="login-button-main" class="btn btn-primary">Iniciar Sesión</button>`;
        }
    }
}

function initUserMenu(container) {
    const menuButton = container.querySelector('#user-menu-button');
    const dropdownMenu = container.querySelector('#user-dropdown-menu');
    const chevron = menuButton?.querySelector('.fa-chevron-down');

    menuButton?.addEventListener('click', (e) => {
        e.stopPropagation();
        // Cierra el panel de notificaciones si está abierto
        document.getElementById('notification-panel')?.classList.remove('active');
        
        const isActive = dropdownMenu.classList.toggle('active');
        if (chevron) {
           chevron.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    });

    container.querySelector('#logout-button-main')?.addEventListener('click', handleLogout);

    // Cerrar el menú si se hace clic fuera
    document.addEventListener('click', (e) => {
         if (dropdownMenu?.classList.contains('active') && !menuButton.contains(e.target)) {
            dropdownMenu.classList.remove('active');
            if(chevron) chevron.style.transform = 'rotate(0deg)';
        }
    });
}

async function handleLogout() {
    await window.supabaseClient.auth.signOut();
    const protectedPages = ['profile.html', 'admin.html', 'agregar.html', 'editar-servidor.html'];
    if (protectedPages.some(page => window.location.pathname.includes(page))) {
        window.location.href = 'index.html';
    } else {
        // Para otras páginas, la recarga la gestionará onAuthStateChange
    }
}


// --- LÓGICA DE NOTIFICACIONES ---

function initNotifications(user, container) {
    if (!container) return;

    container.innerHTML = `
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
    `;
    
    const bell = document.getElementById('notification-bell');
    const badge = document.getElementById('notification-badge');
    const panel = document.getElementById('notification-panel');
    const list = document.getElementById('notification-list');
    const markReadBtn = document.getElementById('mark-all-read-btn');

    async function fetchNotifications() {
        const { data, error } = await window.supabaseClient
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
        
        if (unreadCount > 0) {
            badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        if (data.length === 0) {
            list.innerHTML = `<li class="no-notifications">No tienes notificaciones.</li>`;
        } else {
            list.innerHTML = data.map(n => `
                <li>
                    <a href="${n.link || '#'}" class="notification-item ${n.is_read ? '' : 'unread'}">
                        <p>${n.message}</p>
                        <span class="notification-time">${new Date(n.created_at).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })}</span>
                    </a>
                </li>
            `).join('');
        }
    }
    
    async function markAsRead() {
        const { data: unread } = await window.supabaseClient
            .from('notifications')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (!unread || unread.length === 0) return;

        const idsToUpdate = unread.map(n => n.id);
        await window.supabaseClient.from('notifications').update({ is_read: true }).in('id', idsToUpdate);
    }
    
    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        // Cierra el menú de usuario si está abierto
        document.getElementById('user-dropdown-menu')?.classList.remove('active');
        document.querySelector('#user-menu-button .fa-chevron-down')?.style.removeProperty('transform');
        
        panel.classList.toggle('active');
        if (panel.classList.contains('active') && !badge.classList.contains('hidden')) {
            setTimeout(markAsRead, 2000);
        }
    });

    document.addEventListener('click', (e) => {
        if (panel.classList.contains('active') && !bell.contains(e.target) && !panel.contains(e.target)) {
            panel.classList.remove('active');
        }
    });

    if (markReadBtn) markReadBtn.addEventListener('click', markAsRead);
    
    if (notificationListener) window.supabaseClient.removeChannel(notificationListener);
    
    notificationListener = window.supabaseClient.channel(`notifications_user_${user.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications', 
            filter: `user_id=eq.${user.id}` 
        }, 
        () => {
            console.log('Nueva notificación recibida por Realtime!');
            fetchNotifications();
        })
        .subscribe();
    
    fetchNotifications(); // Carga inicial
}

// --- FUNCIONES DE AYUDA DEL FORMULARIO ---
function setFeedback(form, message, type) {
    const feedbackEl = form.querySelector('.feedback-message');
    if (!feedbackEl) return;
    feedbackEl.textContent = message;
    feedbackEl.className = `feedback-message ${type} active`;
}

function clearFeedback(form) {
    const feedbackEl = form.querySelector('.feedback-message');
    if (feedbackEl) {
        feedbackEl.textContent = '';
        feedbackEl.className = 'feedback-message';
    }
}

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.dataset.originalText = button.innerHTML;
        button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || 'Enviar';
        button.disabled = false;
    }
}

function getAuthErrorMessage(error) {
    const messages = {
        'Invalid login credentials': 'Email o contraseña incorrectos.',
        'Email not confirmed': 'Debes confirmar tu email antes de iniciar sesión.',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
        'User already registered': 'Ya existe una cuenta con este correo electrónico.',
        'Unable to validate email address: invalid format': 'El formato del email no es válido.',
        'Nombre de usuario no encontrado.': 'Nombre de usuario no encontrado.'
    };
    return messages[error.message] || `Error: ${error.message || 'Ha ocurrido un error inesperado.'}`;
}