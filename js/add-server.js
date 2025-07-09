// js/add-server.js (v15 - CORRECCIÓN FINAL Y DEFINITIVA)
// Este código es el correcto y soluciona el problema de la subida de archivos.

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
        return;
    }
    
    authRequiredMessage.classList.add('hidden');
    form.classList.remove('hidden');
    
    // Se añade el listener al evento 'submit' del formulario
    form.addEventListener('submit', handleFormSubmit);
}

// Esta es la función que se ejecuta al enviar el formulario
async function handleFormSubmit(e) {
    e.preventDefault(); // Evita que la página se recargue
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const feedbackEl = form.querySelector('#form-feedback');
    
    // Deshabilitar botón y limpiar feedback anterior
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
        
        // 2. Recoger los archivos seleccionados usando su ID (la forma más segura)
        const logoFile = document.getElementById('logo-file').files[0];
        const bannerFile = document.getElementById('banner-file').files[0];
        const galleryFiles = document.getElementById('gallery-files').files;
        
        // 3. Subir los archivos a Supabase Storage (si existen) y añadir sus rutas a serverData
        if (logoFile) {
            feedbackEl.textContent = 'Subiendo logo...';
            feedbackEl.className = 'feedback-message info active';
            const logoPath = await api.uploadFile(logoFile, 'server-images');
            if (logoPath) serverData.image_url = logoPath;
        }
        
        if (bannerFile) {
            feedbackEl.textContent = 'Subiendo banner...';
            feedbackEl.className = 'feedback-message info active';
            const bannerPath = await api.uploadFile(bannerFile, 'server-banners');
            if (bannerPath) serverData.banner_url = bannerPath;
        }
        
        if (galleryFiles.length > 0) {
            if (galleryFiles.length > 6) throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");
            
            feedbackEl.textContent = `Subiendo ${galleryFiles.length} imágenes a la galería...`;
            feedbackEl.className = 'feedback-message info active';

            const uploadPromises = Array.from(galleryFiles).map(file => api.uploadFile(file, 'server-gallery'));
            const galleryPaths = await Promise.all(uploadPromises);
            if (galleryPaths.every(path => path !== null)) {
                serverData.gallery_urls = galleryPaths;
            }
        }
        
        // 4. Guardar toda la información del servidor en la base de datos
        feedbackEl.textContent = 'Guardando datos del servidor...';
        await api.addServer(serverData);
        
        // 5. Mostrar mensaje de éxito y redirigir
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
