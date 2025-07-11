// js/add-server.js

import * as api from './modules/api.js';

export async function initAddServerPage() {
    console.log("🚀 Inicializando Página de Agregar Servidor (add-server.js)...");
    const authRequiredMessage = document.getElementById('auth-required-message');
    const form = document.getElementById('add-server-form');
    const loginLink = document.getElementById('login-link');

    if (!form || !authRequiredMessage) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();

    if (!session) {
        authRequiredMessage.classList.remove('hidden');
        form.classList.add('hidden');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                // Usamos un evento personalizado para desacoplar el modal de esta página
                document.dispatchEvent(new CustomEvent('show-auth-modal', { detail: { mode: 'login' } }));
            });
        }
        return;
    }
    
    authRequiredMessage.classList.add('hidden');
    form.classList.remove('hidden');
    
    form.addEventListener('submit', handleFormSubmit);
}

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
        
        const logoFile = document.getElementById('logo-file').files[0];
        const bannerFile = document.getElementById('banner-file').files[0];
        const galleryFiles = document.getElementById('gallery-files').files;
        
        if (logoFile) {
            feedbackEl.textContent = 'Subiendo logo...';
            feedbackEl.className = 'feedback-message info active';
            serverData.image_url = await api.uploadFile(logoFile, 'server-images');
        }
        
        if (bannerFile) {
            feedbackEl.textContent = 'Subiendo banner...';
            feedbackEl.className = 'feedback-message info active';
            serverData.banner_url = await api.uploadFile(bannerFile, 'server-banners');
        }
        
        if (galleryFiles.length > 0) {
            if (galleryFiles.length > 6) {
                throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");
            }
            
            feedbackEl.textContent = `Subiendo ${galleryFiles.length} imágenes a la galería...`;
            feedbackEl.className = 'feedback-message info active';
            
            // Usamos Promise.all para subir la galería en paralelo, es más rápido
            const uploadPromises = Array.from(galleryFiles).map(file => api.uploadFile(file, 'server-gallery'));
            const galleryPaths = await Promise.all(uploadPromises);
            
            if (galleryPaths.length > 0) {
                serverData.gallery_urls = galleryPaths.filter(p => p !== null); // Filtramos por si alguna falló
            }
        }
        
        feedbackEl.textContent = 'Guardando datos del servidor...';
        await api.addServer(serverData);
        
        feedbackEl.textContent = '¡Éxito! Tu servidor ha sido enviado para revisión. Redirigiendo...';
        feedbackEl.className = 'feedback-message success active';
        form.reset();
        
        setTimeout(() => { window.location.href = 'profile.html'; }, 2500);
        
    } catch (error) {
        console.error('Error al enviar el formulario:', error);
        feedbackEl.textContent = `Error: ${error.message}`;
        feedbackEl.className = 'feedback-message error active';
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Servidor';
    }
}