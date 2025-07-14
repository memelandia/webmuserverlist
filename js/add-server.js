// js/add-server.js

// TEMPORAL: Usar API simple para evitar problemas de sintaxis
import * as api from './modules/api-simple.js';

export async function initAddServerPage() {
    console.log("🚀 Inicializando Página de Agregar Servidor (add-server.js)...");

    const authRequiredMessage = document.getElementById('auth-required-message');
    const form = document.getElementById('add-server-form');
    const loginLink = document.getElementById('login-link');

    if (!form || !authRequiredMessage) {
        console.error("❌ Elementos críticos no encontrados en el DOM de agregar.html");
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        authRequiredMessage.classList.remove('hidden');
        form.classList.add('hidden');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.dispatchEvent(new CustomEvent('show-auth-modal', { detail: { mode: 'login' } }));
            });
        }
        return;
    }

    authRequiredMessage.classList.add('hidden');
    form.classList.remove('hidden');
    form.addEventListener('submit', handleFormSubmit);
    console.log("✅ Página de agregar servidor inicializada completamente.");
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const feedbackEl = form.querySelector('#form-feedback');

    const setFeedback = (message, type) => {
        feedbackEl.textContent = message;
        feedbackEl.className = `feedback-message ${type} active`;
    };
    
    const setButtonState = (text, disabled) => {
        submitButton.innerHTML = text;
        submitButton.disabled = disabled;
    };

    setButtonState('<i class="fa-solid fa-spinner fa-spin"></i> Procesando...', true);
    setFeedback('', '');

    console.log('=== INICIANDO PROCESO DE ADD-SERVER ===');

    try {
        const serverData = {
            name: form.elements.name.value.trim(),
            description: form.elements.description.value.trim() || null,
            version: form.elements.version.value,
            type: form.elements.type.value,
            configuration: form.elements.configuration.value,
            exp_rate: parseInt(form.elements.exp_rate.value) || null,
            drop_rate: parseInt(form.elements.drop_rate.value) || null,
            reset_info: form.elements.reset_info.value.trim() || null,
            website_url: form.elements.website_url.value.trim(),
            discord_url: form.elements.discord_url.value.trim() || null,
            opening_date: form.elements.opening_date.value || null,
            events: Array.from(form.querySelectorAll('input[name="events"]:checked')).map(cb => cb.value)
        };
        console.log("Datos del formulario preparados:", serverData);

        const logoFile = document.getElementById('logo-file').files[0];
        const bannerFile = document.getElementById('banner-file').files[0];
        const galleryFiles = document.getElementById('gallery-files').files;
        
        if (logoFile) {
            setFeedback('Subiendo logo... (usando método robusto para producción)', 'info');
            try {
                serverData.image_url = await api.uploadFileRobust(logoFile, 'server-images');
            } catch (error) {
                console.warn('Upload robusto falló, intentando método tradicional:', error);
                serverData.image_url = await api.uploadFile(logoFile, 'server-images');
            }
        }

        if (bannerFile) {
            setFeedback('Subiendo banner...', 'info');
            try {
                serverData.banner_url = await api.uploadFileRobust(bannerFile, 'server-banners');
            } catch (error) {
                console.warn('Upload robusto falló, intentando método tradicional:', error);
                serverData.banner_url = await api.uploadFile(bannerFile, 'server-banners');
            }
        }

        if (galleryFiles.length > 0) {
            if (galleryFiles.length > 6) throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");

            setFeedback(`Subiendo galería (${galleryFiles.length} imágenes)...`, 'info');

            // Subir imágenes de galería una por una para mejor control de errores
            const galleryPaths = [];
            for (let i = 0; i < galleryFiles.length; i++) {
                const file = galleryFiles[i];
                setFeedback(`Subiendo imagen ${i + 1}/${galleryFiles.length}...`, 'info');

                try {
                    const path = await api.uploadFileRobust(file, 'server-gallery');
                    if (path) galleryPaths.push(path);
                } catch (error) {
                    console.warn(`Upload robusto falló para imagen ${i + 1}, intentando método tradicional:`, error);
                    try {
                        const path = await api.uploadFile(file, 'server-gallery');
                        if (path) galleryPaths.push(path);
                    } catch (fallbackError) {
                        console.error(`Falló completamente la subida de imagen ${i + 1}:`, fallbackError);
                        // Continuar con las demás imágenes
                    }
                }
            }

            serverData.gallery_urls = galleryPaths;
        }

        setFeedback('Guardando datos del servidor...', 'info');
        await api.addServer(serverData);
        
        setFeedback('¡Éxito! Tu servidor ha sido enviado para revisión. Redirigiendo...', 'success');
        form.reset();
        
        setTimeout(() => { window.location.href = 'profile.html'; }, 2500);

    } catch (error) {
        console.error('ERROR FINAL en handleFormSubmit:', error);
        setFeedback(`Error: ${error.message}`, 'error');
        setButtonState('<i class="fa-solid fa-paper-plane"></i> Enviar Servidor', false);
    }
}