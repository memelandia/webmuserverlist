// js/editar-servidor.js (v13 - Controlador)

import * as api from './modules/api.js';

let serverDataCache = null;

export async function initEditServerPage() {
    console.log("🚀 Inicializando Página de Editar Servidor (editar-servidor.js)...");
    
    const formContainer = document.getElementById('edit-server-container');
    const loadingMessage = document.getElementById('loading-message');
    const form = document.getElementById('edit-server-form');
    const urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get('id');

    if (!serverId) {
        loadingMessage.textContent = 'Error: No se especificó un ID de servidor.';
        return;
    }

    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            loadingMessage.innerHTML = 'Debes <a href="#" id="login-redirect-btn">iniciar sesión</a> para editar.';
            return;
        }

        serverDataCache = await api.getServerForEdit(serverId, session.user.id);
        
        populateForm(form, serverDataCache);
        
        loadingMessage.classList.add('hidden');
        form.classList.remove('hidden');

        form.addEventListener('submit', (e) => handleFormSubmit(e, serverId));

    } catch (error) {
        console.error(error);
        loadingMessage.textContent = `Error: ${error.message}`;
    }
}

function populateForm(form, server) {
    form.name.value = server.name || '';
    form.description.value = server.description || '';
    form.version.value = server.version || '';
    form.type.value = server.type || '';
    form.configuration.value = server.configuration || '';
    form.exp_rate.value = server.exp_rate || '';
    form.drop_rate.value = server.drop_rate || '';
    form.reset_info.value = server.reset_info || '';
    form.antihack_info.value = server.antihack_info || '';
    form.website_url.value = server.website_url || '';
    form.discord_url.value = server.discord_url || '';

    if (server.opening_date) {
        const date = new Date(server.opening_date);
        form.opening_date.value = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString().slice(0, 16);
    }

    form.querySelectorAll('input[name="events"]').forEach(cb => {
        cb.checked = server.events?.includes(cb.value);
    });
}


async function handleFormSubmit(e, serverId) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const feedbackEl = form.querySelector('#form-feedback');
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback-message';

    try {
        const formData = new FormData(form);
        let updatedData = {};

        // Recopilar solo los campos que no son archivos
        for (const [key, value] of formData.entries()) {
            if (!key.includes('-input')) {
                updatedData[key] = value;
            }
        }
        
        // Procesar datos específicos
        updatedData.exp_rate = parseInt(updatedData.exp_rate) || null;
        updatedData.drop_rate = parseInt(updatedData.drop_rate) || null;
        updatedData.opening_date = updatedData.opening_date || null;
        updatedData.events = formData.getAll('events');
        
        const logoFile = document.getElementById('logo-file').files[0];
        const bannerFile = document.getElementById('banner-file').files[0];
        const galleryFiles = document.getElementById('gallery-files').files;
        
        if (logoFile) {
            feedbackEl.textContent = 'Subiendo logo...';
            updatedData.image_url = await api.uploadFile(logoFile, 'server-images');
        }
        if (bannerFile) {
            feedbackEl.textContent = 'Subiendo banner...';
            updatedData.banner_url = await api.uploadFile(bannerFile, 'server-banners');
        }
        if (galleryFiles.length > 0) {
            feedbackEl.textContent = `Subiendo ${galleryFiles.length} imágenes...`;
            const uploadPromises = Array.from(galleryFiles).map(file => api.uploadFile(file, 'server-gallery'));
            updatedData.gallery_urls = await Promise.all(uploadPromises);
        }
        
        await api.updateServer(serverId, updatedData);

        feedbackEl.textContent = '¡Servidor actualizado! Redirigiendo...';
        feedbackEl.className = 'feedback-message success active';
        setTimeout(() => { window.location.href = `servidor.html?id=${serverId}`; }, 2000);

    } catch (error) {
        console.error('Error al actualizar:', error);
        feedbackEl.textContent = `Error: ${error.message}`;
        feedbackEl.className = 'feedback-message error active';
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Cambios';
    }
}