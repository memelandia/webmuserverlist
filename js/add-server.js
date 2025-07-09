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
        
        // 2. Recoger los archivos seleccionados usando su ID
        const logoFileInput = document.getElementById('logo-file');
        const bannerFileInput = document.getElementById('banner-file');
        const galleryFilesInput = document.getElementById('gallery-files');
        
        // Verificar que los elementos existen antes de acceder a sus propiedades
        if (!logoFileInput || !bannerFileInput || !galleryFilesInput) {
            throw new Error("No se pudieron encontrar los campos de archivo en el formulario");
        }
        
        // 3. Subir los archivos a Supabase Storage (si existen) y añadir sus rutas a serverData
        // Subir logo si existe
        if (logoFileInput.files && logoFileInput.files.length > 0) {
            const logoFile = logoFileInput.files[0];
            feedbackEl.textContent = 'Subiendo logo...';
            feedbackEl.className = 'feedback-message info active';
            
            try {
                const logoPath = await api.uploadFile(logoFile, 'server-images');
                if (logoPath) {
                    serverData.image_url = logoPath;
                    console.log("Logo subido exitosamente:", logoPath);
                }
            } catch (uploadError) {
                console.error("Error al subir el logo:", uploadError);
                throw new Error(`Error al subir el logo: ${uploadError.message}`);
            }
        }
        
        // Subir banner si existe
        if (bannerFileInput.files && bannerFileInput.files.length > 0) {
            const bannerFile = bannerFileInput.files[0];
            feedbackEl.textContent = 'Subiendo banner...';
            feedbackEl.className = 'feedback-message info active';
            
            try {
                const bannerPath = await api.uploadFile(bannerFile, 'server-banners');
                if (bannerPath) {
                    serverData.banner_url = bannerPath;
                    console.log("Banner subido exitosamente:", bannerPath);
                }
            } catch (uploadError) {
                console.error("Error al subir el banner:", uploadError);
                throw new Error(`Error al subir el banner: ${uploadError.message}`);
            }
        }
        
        // Subir imágenes de galería si existen
        if (galleryFilesInput.files && galleryFilesInput.files.length > 0) {
            const galleryFiles = galleryFilesInput.files;
            
            if (galleryFiles.length > 6) {
                throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");
            }
            
            feedbackEl.textContent = `Subiendo ${galleryFiles.length} imágenes a la galería...`;
            feedbackEl.className = 'feedback-message info active';
            
            try {
                const galleryPaths = [];
                for (let i = 0; i < galleryFiles.length; i++) {
                    const file = galleryFiles[i];
                    const path = await api.uploadFile(file, 'server-gallery');
                    if (path) {
                        galleryPaths.push(path);
                        console.log(`Imagen ${i+1} subida exitosamente:`, path);
                    }
                }
                
                if (galleryPaths.length > 0) {
                    serverData.gallery_urls = galleryPaths;
                }
            } catch (uploadError) {
                console.error("Error al subir imágenes de galería:", uploadError);
                throw new Error(`Error al subir imágenes de galería: ${uploadError.message}`);
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
