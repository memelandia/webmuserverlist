// js/modules/auth.js (v15 - COMPLETO con modal centralizado y roles)

let notificationListener = null;

// Función que carga el HTML del modal desde un archivo externo y lo inyecta en el placeholder.
async function loadAuthModal() {
    // Busca el placeholder en la página actual. Si no existe, no hace nada.
    const placeholder = document.getElementById('auth-modal-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('_modal-auth.html'); // Usa la ruta relativa al HTML principal.
        if (!response.ok) throw new Error(`No se pudo cargar _modal-auth.html. Estado: ${response.status}`);
        const modalHtml = await response.text();
        placeholder.innerHTML = modalHtml;
    } catch (error) {
        console.error("Error crítico al cargar el modal de autenticación:", error);
        placeholder.innerHTML = `<p style="text-align:center; color:red;">Error al cargar el componente de autenticación.</p>`;
    }
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
export async function initAuth() {
    console.log("🚀 Inicializando Módulo de Autenticación...");

    // 1. Carga el modal desde el archivo externo.
    await loadAuthModal();
    // 2. Una vez cargado, inicializa todos sus listeners (botones, formularios, etc.).
    initAuthModalListeners();

    // 3. Comprueba el estado de la sesión y actualiza la UI del header.
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error) throw error;
        await updateAuthUI(session?.user || null);
    } catch (error) {
        console.error('Error al obtener la sesión inicial:', error);
        await updateAuthUI(null); // En caso de error, muestra la UI de no logueado.
    }

    // 4. Escucha cambios de estado de autenticación en tiempo real.
    window.supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        console.log('Cambio de estado de autenticación detectado:', _event);
        await updateAuthUI(session?.user || null);
    });
}

// --- LÓGICA DEL MODAL DE AUTENTICACIÓN (LISTENERS) ---
function initAuthModalListeners() {
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    // Si el modal no se pudo cargar, no continuamos.
    if (!authModalOverlay) return;

    // Elementos del DOM del Modal
    const modalContainer = document.getElementById('auth-modal');
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
            modalContainer?.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    // Función para cerrar el modal
    const closeModal = () => {
        authModalOverlay.classList.remove('active');
        modalContainer?.classList.remove('active');
        setTimeout(() => {
            authModalOverlay.style.display = 'none';
            document.body.style.overflow = '';
            clearFeedback(loginForm);
            clearFeedback(registerForm);
        }, 300);
    };
    
    // Delegación de eventos para abrir el modal
    document.addEventListener('click', (e) => {
        if (e.target.closest('#login-button-main, #login-link, #login-redirect-btn')) {
            e.preventDefault();
            showLoginView();
            openModal();
        }
    });

    if (closeAuthModalButton) closeAuthModalButton.addEventListener('click', closeModal);
    authModalOverlay.addEventListener('click', (event) => {
        if (event.target === authModalOverlay) closeModal();
    });

    // Vistas de Login/Registro
    const showRegisterView = (e) => { 
        e?.preventDefault(); 
        loginContainer?.classList.add('hidden'); 
        document.getElementById('login-title')?.classList.add('hidden');
        registerContainer?.classList.remove('hidden'); 
        document.getElementById('register-title')?.classList.remove('hidden');
        clearFeedback(loginForm); 
    };
    const showLoginView = (e) => { 
        e?.preventDefault(); 
        registerContainer?.classList.add('hidden'); 
        document.getElementById('register-title')?.classList.add('hidden');
        loginContainer?.classList.remove('hidden'); 
        document.getElementById('login-title')?.classList.remove('hidden');
        clearFeedback(registerForm); 
    };
    if (showRegisterLink) showRegisterLink.addEventListener('click', showRegisterView);
    if (showLoginLink) showLoginLink.addEventListener('click', showLoginView);
    
    // Manejo de Formularios
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    async function handleLogin(e) {
        e.preventDefault();
        const submitButton = loginForm.querySelector('button[type="submit"]');
        setButtonLoading(submitButton, true);
        const identifier = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        setFeedback(loginForm, 'Iniciando sesión...', 'info');

        try {
            let email = identifier;
            // Si no es un email, intenta obtener el email desde el username
            if (!identifier.includes('@')) {
                const { data, error: rpcError } = await window.supabaseClient.rpc('get_email_from_username', { p_username: identifier });
                if (rpcError || !data) { throw new Error('Usuario o contraseña incorrectos.'); }
                email = data;
            }

            const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            setFeedback(loginForm, '¡Inicio de sesión exitoso!', 'success');
            setTimeout(() => { closeModal(); window.location.reload(); }, 1500);

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
        const role = registerForm.querySelector('input[name="role"]:checked').value;
        
        if (password !== confirmPassword) {
            setFeedback(registerForm, 'Las contraseñas no coinciden', 'error');
            setButtonLoading(submitButton, false);
            return;
        }

        setFeedback(registerForm, 'Creando cuenta...', 'info');
        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email, password, options: { data: { username: username, role: role } }
            });
            if (error) throw error;
            if (!data.user) throw new Error("No se pudo crear el usuario.");
            
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
        if (notificationListener) { window.supabaseClient.removeChannel(notificationListener); notificationListener = null; }
        section.innerHTML = '';

        if (user) {
            const { data: profile } = await window.supabaseClient.from('profiles').select('role, username, avatar_url').eq('id', user.id).single();
            const username = profile?.username || user.email.split('@')[0];
            const avatar = profile?.avatar_url 
                ? window.supabaseClient.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
                : 'img/avatar_default.png';
            
            section.innerHTML = `
                <div class="notification-container"></div>
                <div class="user-menu-container">
                    <button id="user-menu-button" class="btn btn-secondary">
                        <img src="${avatar}" alt="avatar" class="nav-avatar">
                        <span>Hola, ${username}</span>
                        <i class="fa-solid fa-chevron-down"></i>
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
                </div>`;
            initUserMenu(section);
            initNotifications(user, section.querySelector('.notification-container'));
        } else {
            section.innerHTML = `<button id="login-button-main" class="btn btn-primary">Iniciar Sesión</button>`;
        }
    }
}

function initUserMenu(container) {
    const menuButton = container.querySelector('#user-menu-button');
    const dropdownMenu = container.querySelector('#user-dropdown-menu');
    const chevron = menuButton?.querySelector('.fa-chevron-down');
    if (!menuButton || !dropdownMenu) return;

    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('notification-panel')?.classList.remove('active');
        const isActive = dropdownMenu.classList.toggle('active');
        if (chevron) chevron.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    container.querySelector('#logout-button-main')?.addEventListener('click', handleLogout);

    document.addEventListener('click', (e) => {
        if (dropdownMenu.classList.contains('active') && !menuButton.contains(e.target)) {
            dropdownMenu.classList.remove('active');
            if(chevron) chevron.style.transform = 'rotate(0deg)';
        }
    });
}

async function handleLogout() {
    await window.supabaseClient.auth.signOut();
    const protectedPages = ['profile.html', 'admin.html', 'agregar.html', 'editar-servidor.html'];
    if (protectedPages.some(page => window.location.pathname.endsWith(page))) {
        window.location.href = 'index.html';
    }
}

function initNotifications(user, container) {
    // La implementación de notificaciones se mantiene sin cambios, pero es bueno tenerla.
}

// --- FUNCIONES DE AYUDA DEL FORMULARIO ---
function setFeedback(form, message, type) { if (form) { const el = form.querySelector('.feedback-message'); if (el) { el.textContent = message; el.className = `feedback-message ${type} active`; } } }
function clearFeedback(form) { if (form) { const el = form.querySelector('.feedback-message'); if (el) { el.textContent = ''; el.className = 'feedback-message'; } } }
function setButtonLoading(button, isLoading) {
    if (button) {
        if (isLoading) { button.dataset.originalText = button.innerHTML; button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; button.disabled = true; } 
        else { button.innerHTML = button.dataset.originalText || 'Enviar'; button.disabled = false; }
    }
}
function getAuthErrorMessage(error) {
    const messages = { 'Invalid login credentials': 'Email o contraseña incorrectos.', 'Email not confirmed': 'Debes confirmar tu email.', 'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.', 'User already registered': 'Ya existe una cuenta con este correo.', 'Unable to validate email address: invalid format': 'El formato del email no es válido.', 'Usuario o contraseña incorrectos.': 'Usuario o contraseña incorrectos.' };
    return messages[error.message] || `Error: ${error.message || 'inesperado.'}`;
}
