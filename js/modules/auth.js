// js/modules/auth.js

// Función que carga el HTML del modal desde un archivo externo.
async function loadAuthModal() {
    const placeholder = document.getElementById('auth-modal-placeholder');
    if (!placeholder) return;

    try {
        const response = await fetch('_modal-auth.html');
        if (!response.ok) throw new Error(`No se pudo cargar _modal-auth.html. Estado: ${response.status}`);
        placeholder.innerHTML = await response.text();
    } catch (error) {
        console.error("Error crítico al cargar el modal de autenticación:", error);
        placeholder.innerHTML = `<p style="text-align:center; color:red;">Error al cargar el componente de autenticación.</p>`;
    }
}

export async function initAuth() {
    console.log("🚀 Inicializando Módulo de Autenticación...");

    await loadAuthModal();
    initAuthModalListeners();
    initAuthUI();

    window.supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        console.log('Cambio de estado de autenticación:', _event);
        await updateAuthUI(session);
    });
}

function initAuthUI() {
    window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
        updateAuthUI(session);
    }).catch(error => {
        console.error("Error al obtener sesión inicial:", error);
        updateAuthUI(null);
    });
}

function initAuthModalListeners() {
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    if (!authModalOverlay) return;

    const modalContainer = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('close-auth-modal');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const openModal = () => {
        authModalOverlay.classList.add('active');
        modalContainer?.classList.add('active');
        document.body.style.overflow = 'hidden';
    };
    const closeModal = () => {
        authModalOverlay.classList.remove('active');
        modalContainer?.classList.remove('active');
        setTimeout(() => { document.body.style.overflow = ''; }, 300);
        clearFeedback(loginForm);
        clearFeedback(registerForm);
    };

    document.addEventListener('click', (e) => {
        if (e.target.closest('#login-button-main, #login-link, #login-redirect-btn')) {
            e.preventDefault();
            switchAuthView('login');
            openModal();
        }
    });
    
    // Evento personalizado para abrir el modal desde otros módulos
    document.addEventListener('show-auth-modal', (e) => {
        switchAuthView(e.detail.mode || 'login');
        openModal();
    });

    closeBtn?.addEventListener('click', closeModal);
    authModalOverlay.addEventListener('click', (e) => {
        if (e.target === authModalOverlay) closeModal();
    });

    document.getElementById('show-register')?.addEventListener('click', (e) => { e.preventDefault(); switchAuthView('register'); });
    document.getElementById('show-login')?.addEventListener('click', (e) => { e.preventDefault(); switchAuthView('login'); });

    loginForm?.addEventListener('submit', handleLogin);
    registerForm?.addEventListener('submit', handleRegister);
}

function switchAuthView(view) {
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const loginTitle = document.getElementById('login-title');
    const registerTitle = document.getElementById('register-title');
    
    if (view === 'register') {
        loginContainer?.classList.add('hidden');
        loginTitle?.classList.add('hidden');
        registerContainer?.classList.remove('hidden');
        registerTitle?.classList.remove('hidden');
    } else {
        registerContainer?.classList.add('hidden');
        registerTitle?.classList.add('hidden');
        loginContainer?.classList.remove('hidden');
        loginTitle?.classList.remove('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true, 'Iniciando...');
    const identifier = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    setFeedback(form, 'Iniciando sesión...', 'info');

    try {
        let email = identifier;
        if (!identifier.includes('@')) {
            const { data, error: rpcError } = await window.supabaseClient.rpc('get_email_from_username', { p_username: identifier });
            if (rpcError || !data) throw new Error('Usuario o contraseña incorrectos.');
            email = data;
        }

        const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        setFeedback(form, '¡Inicio de sesión exitoso!', 'success');
        setTimeout(() => { document.getElementById('close-auth-modal')?.click(); }, 1500);

    } catch (error) {
        console.error('Error de login:', error);
        setFeedback(form, getAuthErrorMessage(error), 'error');
    } finally {
        setButtonLoading(submitButton, false, 'Iniciar Sesión');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    setButtonLoading(submitButton, true, 'Registrando...');
    const username = document.getElementById('register-username').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    const role = form.querySelector('input[name="role"]:checked').value;
    
    if (password !== confirmPassword) {
        setFeedback(form, 'Las contraseñas no coinciden.', 'error');
        setButtonLoading(submitButton, false, 'Registrarme');
        return;
    }

    setFeedback(form, 'Creando tu cuenta...', 'info');
    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email, password, options: { data: { username, role } }
        });
        if (error) throw error;
        
        setFeedback(form, '¡Cuenta creada! Revisa tu correo para confirmar la cuenta.', 'success');
        form.reset();
        setTimeout(() => switchAuthView('login'), 3000);
        
    } catch (error) {
        console.error('Error de registro:', error);
        setFeedback(form, getAuthErrorMessage(error), 'error');
    } finally {
        setButtonLoading(submitButton, false, 'Registrarme');
    }
}

async function updateAuthUI(session) {
    const authSections = document.querySelectorAll('#auth-section');
    if (authSections.length === 0) return;

    let htmlContent;
    if (session?.user) {
        const { data: profile } = await window.supabaseClient.from('profiles').select('role, username, avatar_url').eq('id', session.user.id).single();
        const username = profile?.username || session.user.email.split('@')[0];
        const avatarUrl = profile?.avatar_url 
            ? window.supabaseClient.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
            : 'img/avatar_default.png';
        
        htmlContent = `
            <div class="user-menu-container">
                <button id="user-menu-button" class="btn btn-secondary" aria-haspopup="true" aria-expanded="false">
                    <img src="${avatarUrl}" alt="Avatar de ${username}" class="nav-avatar">
                    <span>Hola, ${username}</span>
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
                <div id="user-dropdown-menu" class="dropdown-menu" role="menu">
                    <a href="profile.html" class="dropdown-item" role="menuitem"><i class="fa-solid fa-user-circle"></i> Mi Perfil</a>
                    <a href="agregar.html" class="dropdown-item" role="menuitem"><i class="fa-solid fa-plus-circle"></i> Publicar Servidor</a>
                    ${profile?.role === 'admin' ? `<a href="admin.html" class="dropdown-item" role="menuitem"><i class="fa-solid fa-user-shield"></i> Panel Admin</a>` : ''}
                    <div class="dropdown-divider"></div>
                    <button id="logout-button-main" class="dropdown-item logout-btn" role="menuitem">
                        <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                    </button>
                </div>
            </div>`;
    } else {
        htmlContent = `<button id="login-button-main" class="btn btn-primary">Iniciar Sesión</button>`;
    }

    authSections.forEach(section => {
        section.innerHTML = htmlContent;
        if (session?.user) {
            initUserMenu(section);
        }
    });
}

function initUserMenu(container) {
    const menuButton = container.querySelector('#user-menu-button');
    const dropdownMenu = container.querySelector('#user-dropdown-menu');
    const chevron = menuButton?.querySelector('.fa-chevron-down');
    if (!menuButton || !dropdownMenu) return;

    menuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = dropdownMenu.classList.toggle('active');
        menuButton.setAttribute('aria-expanded', isActive);
        if (chevron) chevron.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
    });

    container.querySelector('#logout-button-main')?.addEventListener('click', async () => {
        await window.supabaseClient.auth.signOut();
        const protectedPages = ['profile.html', 'admin.html', 'agregar.html', 'editar-servidor.html'];
        if (protectedPages.some(page => window.location.pathname.endsWith(page))) {
            window.location.href = 'index.html';
        }
    });

    document.addEventListener('click', (e) => {
        if (dropdownMenu.classList.contains('active') && !menuButton.contains(e.target)) {
            dropdownMenu.classList.remove('active');
            menuButton.setAttribute('aria-expanded', 'false');
            if(chevron) chevron.style.transform = 'rotate(0deg)';
        }
    });
}

// --- FUNCIONES DE AYUDA DEL FORMULARIO ---
function setFeedback(form, message, type) { 
    const el = form?.querySelector('.feedback-message'); 
    if (el) { el.textContent = message; el.className = `feedback-message ${type} active`; } 
}
function clearFeedback(form) { 
    const el = form?.querySelector('.feedback-message'); 
    if (el) { el.textContent = ''; el.className = 'feedback-message'; } 
}
function setButtonLoading(button, isLoading, text) {
    if (button) {
        if (isLoading) { 
            button.dataset.originalText = button.innerHTML; 
            button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${text || ''}`; 
            button.disabled = true; 
        } else { 
            button.innerHTML = button.dataset.originalText || text; 
            button.disabled = false; 
        }
    }
}
function getAuthErrorMessage(error) {
    const messages = { 
        'Invalid login credentials': 'Email, usuario o contraseña incorrectos.',
        'Email not confirmed': 'Debes confirmar tu email antes de iniciar sesión.',
        'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
        'User already registered': 'Ya existe una cuenta con este correo.',
        'Unable to validate email address: invalid format': 'El formato del email no es válido.'
    };
    return messages[error.message] || `Error: ${error.message || 'inesperado.'}`;
}