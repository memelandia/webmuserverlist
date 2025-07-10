// js/add-server.js (v16 - SOLUCIÓN DEFINITIVA)

import * as api from './modules/api.js';

export async function initAddServerPage() {
    console.log("🚀 Inicializando Página de Agregar Servidor (add-server.js)...");
    const authRequiredMessage = document.getElementById('auth-required-message');
    const form = document.getElementById('add-server-form');

    if (!form || !authRequiredMessage) return;

    // Se comprueba si hay sesión para mostrar o no el formulario
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        authRequiredMessage.classList.remove('hidden');
        form.classList.add('hidden');
        
        // Añadir listener al enlace de login
        const loginLink = document.getElementById('login-link');
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
    
    // Se añade el listener al evento 'submit' del formulario
    form.addEventListener('submit', handleFormSubmit);
}

// Esta es la función que se ejecuta al enviar el formulario
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const feedbackEl = form.querySelector('#form-feedback');
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback-message';

    try {
        // 1. Recoger todos los datos de texto y selects del formulario
        const serverData = {
            name: form.elements.name.value.trim(),
            description: form.elements.description.value.trim(),
            version: form.elements.version.value,
            type: form.elements.type.value,
            configuration: form.elements.configuration.value,
            exp_rate: parseInt(form.elements.exp_rate.value) || null,
            drop_rate: parseInt(form.elements.drop_rate.value) || null,
            reset_info: form.elements.reset_info.value.trim(),
            antihack_info: form.elements.antihack_info.value.trim(),
            website_url: form.elements.website_url.value.trim(),
            discord_url: form.elements.discord_url.value.trim(),
            opening_date: form.elements.opening_date.value || null,
            events: Array.from(form.querySelectorAll('input[name="events"]:checked')).map(cb => cb.value)
        };
        
        // 2. Recoger los archivos seleccionados
        const logoFileInput = document.getElementById('logo-file');
        const bannerFileInput = document.getElementById('banner-file');
        const galleryFilesInput = document.getElementById('gallery-files');
        
        if (!logoFileInput || !bannerFileInput || !galleryFilesInput) {
            throw new Error("No se pudieron encontrar los campos de archivo en el formulario");
        }
        
        // 3. Subir archivos uno por uno con manejo de errores mejorado
        try {
            // Logo
            if (logoFileInput.files && logoFileInput.files.length > 0) {
                feedbackEl.textContent = 'Subiendo logo...';
                feedbackEl.className = 'feedback-message info active';
                serverData.image_url = await api.uploadFile(logoFileInput.files[0], 'server-images');
            }
            
            // Banner
            if (bannerFileInput.files && bannerFileInput.files.length > 0) {
                feedbackEl.textContent = 'Subiendo banner...';
                feedbackEl.className = 'feedback-message info active';
                serverData.banner_url = await api.uploadFile(bannerFileInput.files[0], 'server-banners');
            }
            
            // Galería
            if (galleryFilesInput.files && galleryFilesInput.files.length > 0) {
                if (galleryFilesInput.files.length > 6) {
                    throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");
                }
                
                feedbackEl.textContent = `Subiendo ${galleryFilesInput.files.length} imágenes a la galería...`;
                feedbackEl.className = 'feedback-message info active';
                
                const galleryPaths = [];
                for (let i = 0; i < galleryFilesInput.files.length; i++) {
                    const path = await api.uploadFile(galleryFilesInput.files[i], 'server-gallery');
                    if (path) galleryPaths.push(path);
                }
                
                if (galleryPaths.length > 0) {
                    serverData.gallery_urls = galleryPaths;
                }
            }
            
            // 4. Guardar datos en la base de datos
            feedbackEl.textContent = 'Guardando datos del servidor...';
            await api.addServer(serverData);
            
            // 5. Mostrar éxito y redirigir
            feedbackEl.textContent = '¡Éxito! Tu servidor ha sido enviado para revisión. Redirigiendo...';
            feedbackEl.className = 'feedback-message success active';
            form.reset();
            
            setTimeout(() => { window.location.href = 'profile.html'; }, 2500);
            
        } catch (uploadError) {
            console.error("Error durante la subida de archivos:", uploadError);
            throw uploadError; // Re-lanzar para el manejo general
        }
        
    } catch (error) {
        console.error('Error al enviar el formulario:', error);
        feedbackEl.textContent = `Error: ${error.message}`;
        feedbackEl.className = 'feedback-message error active';
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Servidor';
    }
}
