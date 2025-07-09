// js/auth-modal.js (v4 - Corregido con manejo robusto de autenticación)

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
    
    // Mejorar la detección de botones de login
    document.addEventListener('click', (e) => {
        if (e.target && (
            e.target.id === 'login-button-main' || 
            e.target.id === 'login-link' || 
            e.target.id === 'login-redirect-btn' ||
            e.target.closest('#login-button-main') ||
            e.target.closest('#login-link') ||
            e.target.closest('#login-redirect-btn')
        )) {
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

    // Mejorar el flujo de inicio de sesión
    if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Deshabilitar el formulario durante el proceso
        const submitButton = loginForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Procesando...';
        
        const identifier = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        setFeedback(loginFeedback, 'Iniciando sesión...', 'info');

        try {
            let email = identifier;
            
            // Si el identificador no contiene "@", buscar el email asociado al username
            if (!identifier.includes('@')) {
                setFeedback(loginFeedback, 'Verificando nombre de usuario...', 'info');
                
                const { data, error } = await window.supabaseClient.functions.invoke('get-email-from-username', {
                    body: { username: identifier }
                });
                
                if (error || !data.email) {
                    const errorMsg = error?.message || 'Nombre de usuario no encontrado';
                    setFeedback(loginFeedback, errorMsg, 'error');
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                    return;
                }
                
                email = data.email;
            }

            // Iniciar sesión con el email (original o encontrado)
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ 
                email, 
                password 
            });

            if (error) {
                setFeedback(loginFeedback, getErrorMessage(error), 'error');
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                return;
            }

            setFeedback(loginFeedback, '¡Inicio de sesión exitoso! Actualizando...', 'success');
            
            // Cerrar el modal después de un breve retraso
            setTimeout(() => {
                closeModal();
                // Recargar la página para asegurar que todo el estado se actualice
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Error durante el inicio de sesión:', error);
            setFeedback(loginFeedback, 'Error inesperado. Por favor, inténtalo de nuevo.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Mejorar el flujo de registro
    if (registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Deshabilitar el formulario durante el proceso
        const submitButton = registerForm.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Procesando...';
        
        const username = document.getElementById('register-username').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (password !== confirmPassword) {
            setFeedback(registerFeedback, 'Las contraseñas no coinciden', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            return;
        }

        setFeedback(registerFeedback, 'Creando cuenta...', 'info');

        try {
            const { data, error } = await window.supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { username } } // Pasamos el username para que el trigger lo use
            });

            if (error) {
                setFeedback(registerFeedback, getErrorMessage(error), 'error');
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
                return;
            }

            // Registro exitoso
            setFeedback(registerFeedback, '¡Cuenta creada! Revisa tu correo para confirmar tu cuenta.', 'success');
            registerForm.reset();
            
            // Mantener el botón deshabilitado después del registro exitoso
            // y después de un breve retraso, mostrar la vista de login
            setTimeout(() => {
                showLogin();
                // Restaurar el botón solo después de cambiar a la vista de login
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }, 3000);
            
        } catch (error) {
            console.error('Error durante el registro:', error);
            setFeedback(registerFeedback, 'Error inesperado. Por favor, inténtalo de nuevo.', 'error');
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    function setFeedback(element, message, type) {
        if (!element) return;
        element.textContent = message;
        element.className = `feedback-message ${type} active`;
        element.style.display = 'block'; // Asegurar que sea visible
    }

    function clearFeedback() {
        if (loginFeedback) {
            loginFeedback.textContent = '';
            loginFeedback.className = 'feedback-message';
            loginFeedback.style.display = 'none';
        }
        if (registerFeedback) {
            registerFeedback.textContent = '';
            registerFeedback.className = 'feedback-message';
            registerFeedback.style.display = 'none';
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
        return errorMap[error.message] || `Error: ${error.message || 'Ha ocurrido un error inesperado.'}`;
    }
}
