// js/editar-servidor.js

import * as api from './modules/api.js';

export async function initEditServerPage() {
    console.log("🚀 Inicializando Página de Editar Servidor (editar-servidor.js)...");
    
    const loadingMessage = document.getElementById('loading-message');
    const form = document.getElementById('edit-server-form');
    const urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get('id');

    if (!serverId) {
        loadingMessage.innerHTML = '<h2>Error</h2><p>No se especificó un ID de servidor.</p>';
        return;
    }

    try {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (!session) {
            loadingMessage.innerHTML = '<h2>Acceso Restringido</h2><p>Debes <a href="#" id="login-redirect-btn">iniciar sesión</a> para editar un servidor.</p>';
            document.getElementById('login-redirect-btn')?.addEventListener('click', (e) => {
                e.preventDefault();
                document.dispatchEvent(new CustomEvent('show-auth-modal', { detail: { mode: 'login' } }));
            });
            return;
        }

        const serverData = await api.getServerForEdit(serverId, session.user.id);
        
        populateForm(form, serverData);
        
        loadingMessage.classList.add('hidden');
        form.classList.remove('hidden');

        form.addEventListener('submit', (e) => handleFormSubmit(e, serverId));

    } catch (error) {
        console.error("Error al cargar datos para editar:", error);
        loadingMessage.innerHTML = `<h2>Error al Cargar</h2><p>${error.message}</p>`;
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
    form.website_url.value = server.website_url || '';
    form.discord_url.value = server.discord_url || '';

    if (server.opening_date) {
        // Formatear la fecha para el input datetime-local
        try {
            const date = new Date(server.opening_date);
            // Ajustar a la zona horaria local para la visualización correcta en el input
            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
            form.opening_date.value = localDate.toISOString().slice(0, 16);
        } catch (e) {
            console.warn("No se pudo parsear la fecha de apertura: ", server.opening_date);
            form.opening_date.value = '';
        }
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
        const updatedData = {
            name: formData.get('name'),
            description: formData.get('description'),
            version: formData.get('version'),
            type: formData.get('type'),
            configuration: formData.get('configuration'),
            exp_rate: parseInt(formData.get('exp_rate')) || null,
            drop_rate: parseInt(formData.get('drop_rate')) || null,
            reset_info: formData.get('reset_info'),
            website_url: formData.get('website_url'),
            discord_url: formData.get('discord_url'),
            opening_date: formData.get('opening_date') || null,
            events: formData.getAll('events')
        };
        
        const logoFile = document.getElementById('logo-file').files[0];
        const bannerFile = document.getElementById('banner-file').files[0];
        const galleryFiles = document.getElementById('gallery-files').files;
        
        if (logoFile) {
            feedbackEl.textContent = 'Subiendo nuevo logo...';
            feedbackEl.className = 'feedback-message info active';
            updatedData.image_url = await api.uploadFile(logoFile, 'server-images');
        }
        if (bannerFile) {
            feedbackEl.textContent = 'Subiendo nuevo banner...';
            feedbackEl.className = 'feedback-message info active';
            updatedData.banner_url = await api.uploadFile(bannerFile, 'server-banners');
        }
        if (galleryFiles.length > 0) {
            feedbackEl.textContent = `Subiendo ${galleryFiles.length} nuevas imágenes...`;
            feedbackEl.className = 'feedback-message info active';
            const uploadPromises = Array.from(galleryFiles).map(file => api.uploadFile(file, 'server-gallery'));
            updatedData.gallery_urls = await Promise.all(uploadPromises);
        }
        
        await api.updateServer(serverId, updatedData);

        feedbackEl.textContent = '¡Servidor actualizado con éxito! Redirigiendo...';
        feedbackEl.className = 'feedback-message success active';
        setTimeout(() => { window.location.href = `servidor.html?id=${serverId}`; }, 2000);

    } catch (error) {
        console.error('Error al actualizar el servidor:', error);
        feedbackEl.textContent = `Error: ${error.message}`;
        feedbackEl.className = 'feedback-message error active';
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Cambios';
    }
}