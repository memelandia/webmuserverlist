// js/add-server.js

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';

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
    const feedbackEl = document.getElementById('form-feedback');
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    ui.setFormFeedback(feedbackEl, '', '');

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
        
        const logoFile = document.getElementById('logo-file').files[0];
        const bannerFile = document.getElementById('banner-file').files[0];
        const galleryFiles = document.getElementById('gallery-files').files;
        
        if (logoFile) {
            ui.setFormFeedback(feedbackEl, 'Subiendo logo...', 'info');
            serverData.image_url = await api.uploadFile(logoFile, 'server-images');
        }

        if (bannerFile) {
            ui.setFormFeedback(feedbackEl, 'Subiendo banner...', 'info');
            serverData.banner_url = await api.uploadFile(bannerFile, 'server-banners');
        }

        if (galleryFiles.length > 0) {
            if (galleryFiles.length > 6) throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");
            
            ui.setFormFeedback(feedbackEl, `Subiendo galería (0/${galleryFiles.length})...`, 'info');
            
            const uploadPromises = Array.from(galleryFiles).map((file, index) => {
                return api.uploadFile(file, 'server-gallery').then(path => {
                    ui.setFormFeedback(feedbackEl, `Subiendo galería (${index + 1}/${galleryFiles.length})...`, 'info');
                    return path;
                });
            });

            serverData.gallery_urls = await Promise.all(uploadPromises);
        }

        ui.setFormFeedback(feedbackEl, 'Guardando datos del servidor...', 'info');
        await api.addServer(serverData);
        
        ui.setFormFeedback(feedbackEl, '¡Éxito! Tu servidor ha sido enviado para revisión. Redirigiendo...', 'success');
        form.reset();
        
        setTimeout(() => { window.location.href = 'profile.html'; }, 2500);

    } catch (error) {
        console.error('Error al agregar servidor:', error);
        ui.setFormFeedback(feedbackEl, `Error: ${error.message}`, 'error');
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Servidor';
    }
}