// js/auth-modal.js (v3 - Con recarga en login y correcciones)

document.addEventListener('DOMContentLoaded', () => {
    initAuthModal();
});

function initAuthModal() {
    const authModalOverlay = document.getElementById('auth-modal-overlay');
    if (!authModalOverlay) return;

    const closeAuthModalButton = document.getElementById('close-auth-modal');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const loginFeedback = document.getElementById('login-feedback');
    const registerFeedback = document.getElementById('register-feedback');

    const openModal = () => {
        authModalOverlay.style.display = 'flex';
        setTimeout(() => {
            authModalOverlay.classList.add('active');
            authModalOverlay.querySelector('.modal-container').classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        authModalOverlay.classList.remove('active');
        authModalOverlay.querySelector('.modal-container').classList.remove('active');
        setTimeout(() => {
            authModalOverlay.style.display = 'none';
            document.body.style.overflow = '';
            clearFeedback();
        }, 300);
    };
    
    document.addEventListener('click', (e) => {
        if (e.target && (e.target.id === 'login-button-main' || e.target.id === 'login-link' || e.target.id === 'login-redirect-btn')) {
            e.preventDefault();
            showLogin();
            openModal();
        }
    });

    if (closeAuthModalButton) closeAuthModalButton.addEventListener('click', closeModal);
    authModalOverlay.addEventListener('click', (event) => {
        if (event.target === authModalOverlay) closeModal();
    });

    const showRegister = (e) => {
        if (e) e.preventDefault();
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
        clearFeedback();
    };

    const showLogin = (e) => {
        if (e) e.preventDefault();
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        clearFeedback();
    };

    if (showRegisterLink) showRegisterLink.addEventListener('click', showRegister);
    if (showLoginLink) showLoginLink.addEventListener('click', showLogin);

    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        setFeedback(loginFeedback, 'Iniciando sesión...', 'info');

        const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            setFeedback(loginFeedback, getErrorMessage(error), 'error');
            return;
        }

        setFeedback(loginFeedback, '¡Inicio de sesión exitoso! Actualizando...', 'success');
        setTimeout(() => window.location.reload(), 1500);
    });

    if (registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            setFeedback(registerFeedback, 'Las contraseñas no coinciden', 'error');
            return;
        }

        setFeedback(registerFeedback, 'Creando cuenta...', 'info');

        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { username } } // Pasamos el username para que el trigger lo use
        });

        if (error) {
            setFeedback(registerFeedback, getErrorMessage(error), 'error');
            return;
        }

        setFeedback(registerFeedback, '¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.', 'success');
        registerForm.reset();
    });

    function setFeedback(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `feedback-message ${type}`;
    }

    function clearFeedback() {
        if (loginFeedback) {
            loginFeedback.textContent = '';
            loginFeedback.className = 'feedback-message';
        }
        if (registerFeedback) {
            registerFeedback.textContent = '';
            registerFeedback.className = 'feedback-message';
        }
    }

    function getErrorMessage(error) {
        const errorMap = {
            'Invalid login credentials': 'Email o contraseña incorrectos.',
            'Email not confirmed': 'Debes confirmar tu email antes de iniciar sesión.',
            'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
            'User already registered': 'Ya existe una cuenta con este correo electrónico.',
            'Unable to validate email address: invalid format': 'El formato del email no es válido.'
        };
        return errorMap[error.message] || 'Ha ocurrido un error inesperado.';
    }
}