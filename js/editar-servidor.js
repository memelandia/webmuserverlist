// js/editar-servidor.js (v5 - Con subida de solo path y optimización)

// Función de subida de archivos modificada para devolver solo el PATH
async function uploadFile(file, bucket) {
    if (!file) return null;
    try {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        if (file.size > 50 * 1024 * 1024) {
            throw new Error(`El archivo ${file.name} excede el límite de 50MB.`);
        }
        const { error: uploadError } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        if (uploadError) {
            throw new Error(`No se pudo subir ${file.name}: ${uploadError.message}`);
        }
        return fileName; // Devolvemos el path
    } catch (error) {
        throw error;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('edit-server-form');
    const loadingMessage = document.getElementById('loading-message');
    const urlParams = new URLSearchParams(window.location.search);
    const serverId = urlParams.get('id');

    if (!serverId) {
        loadingMessage.textContent = 'Error: No se especificó un ID de servidor.';
        return;
    }

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        loadingMessage.innerHTML = 'Debes <a href="#" id="login-redirect-btn">iniciar sesión</a> para editar un servidor.';
        return;
    }
    
    //... (el resto de la lógica de permisos es la misma)

    const { data: profile } = await window.supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

    let serverQuery = window.supabaseClient.from('servers').select('*').eq('id', serverId);
    if (!profile || profile.role !== 'admin') {
        serverQuery = serverQuery.eq('user_id', session.user.id);
    }
    
    const { data: server, error } = await serverQuery.single();

    if (error || !server) {
        loadingMessage.textContent = 'Error: Servidor no encontrado o no tienes permiso para editarlo.';
        return;
    }
    
    // Poblar formulario (sin cambios)
    form.name.value = server.name || '';
    form.description.value = server.description || '';
    form.version.value = server.version || '';
    form.type.value = server.type || 'Medium';
    form.exp_rate.value = server.exp_rate || '';
    form.drop_rate.value = server.drop_rate || '';
    form.reset_info.value = server.reset_info || '';
    form.antihack_info.value = server.antihack_info || '';
    form.website_url.value = server.website_url || '';
    form.discord_url.value = server.discord_url || '';
    if (server.opening_date) {
        try {
            const date = new Date(server.opening_date);
            const timezoneOffset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - timezoneOffset);
            form.opening_date.value = localDate.toISOString().slice(0, 16);
        } catch (e) { console.error("Fecha de apertura inválida:", server.opening_date); }
    }
    if (server.events && server.events.length > 0) {
        server.events.forEach(eventValue => {
            const checkbox = document.querySelector(`input[name="events"][value="${eventValue}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

    loadingMessage.classList.add('hidden');
    form.classList.remove('hidden');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = document.getElementById('submit-edit-btn');
        const feedbackEl = document.getElementById('form-feedback');

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Actualizando...';
        feedbackEl.className = 'feedback-message';

        try {
            const updatedData = {
                name: form.name.value,
                description: form.description.value,
                version: form.version.value,
                type: form.type.value,
                reset_info: form.reset_info.value,
                antihack_info: form.antihack_info.value,
                website_url: form.website_url.value,
                discord_url: form.discord_url.value,
                exp_rate: parseInt(form.exp_rate.value) || null,
                drop_rate: parseInt(form.drop_rate.value) || null,
                opening_date: form.opening_date.value || null,
                events: Array.from(form.querySelectorAll('input[name="events"]:checked')).map(cb => cb.value),
            };

            const logoFile = document.getElementById('logo-file').files[0];
            if (logoFile) {
                updatedData.image_url = await uploadFile(logoFile, 'server-images');
            }

            const bannerFile = document.getElementById('banner-file').files[0];
            if (bannerFile) {
                updatedData.banner_url = await uploadFile(bannerFile, 'server-banners');
            }

            const galleryFiles = document.getElementById('gallery-files').files;
            if (galleryFiles.length > 0) {
                if (galleryFiles.length > 6) {
                    throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");
                }
                
                // Crear un array de promesas para subir todas las imágenes en paralelo
                const uploadPromises = Array.from(galleryFiles).map(file => uploadFile(file, 'server-gallery'));
                
                // Esperar a que todas las promesas se resuelvan
                updatedData.gallery_urls = await Promise.all(uploadPromises);
            }

            const { error: updateError } = await window.supabaseClient
                .from('servers')
                .update(updatedData)
                .eq('id', serverId);

            if (updateError) throw updateError;
            
            feedbackEl.textContent = '¡Servidor actualizado con éxito! Redirigiendo...';
            feedbackEl.className = 'feedback-message success';
            setTimeout(() => { window.location.href = `servidor.html?id=${serverId}`; }, 2000);

        } catch (error) {
            console.error('Error al actualizar el servidor:', error);
            feedbackEl.textContent = `Error al actualizar: ${error.message}`;
            feedbackEl.className = 'feedback-message error';
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fa-solid fa-save"></i> Guardar Cambios';
        }
    });
});
