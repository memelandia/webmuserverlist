// js/add-server.js (v10 - Corregido guardado de imágenes y galería)

document.addEventListener('DOMContentLoaded', () => {
    initAddServer();
});

// Función de subida de archivos modificada para devolver solo el PATH
async function uploadFile(file, bucket) {
    if (!file) return null;
    
    try {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        if (file.size > 50 * 1024 * 1024) {
            throw new Error(`El archivo ${file.name} excede el límite de 50MB.`);
        }
        
        const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (uploadError) {
            console.error('Error al subir archivo:', uploadError);
            throw new Error(`No se pudo subir ${file.name}: ${uploadError.message}`);
        }

        // Devolvemos solo el nombre del archivo (path).
        return fileName;
        
    } catch (error) {
        console.error(`Error en uploadFile para ${file.name}:`, error);
        throw error;
    }
}

async function initAddServer() {
    const authRequiredMessage = document.getElementById('auth-required-message');
    const form = document.getElementById('add-server-form');
    if (!authRequiredMessage || !form) return;

    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
        authRequiredMessage.classList.remove('hidden');
        form.classList.add('hidden');
        return;
    }
    authRequiredMessage.classList.add('hidden');
    form.classList.remove('hidden');

    const feedbackEl = document.getElementById('form-feedback');
    const submitButton = document.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
        feedbackEl.textContent = '';
        feedbackEl.className = 'feedback-message';

        try {
            const serverData = {
                name: form.name.value,
                description: form.description.value,
                version: form.version.value,
                type: form.type.value,
                configuration: form.configuration.value,
                exp_rate: parseInt(form.exp_rate.value) || null,
                drop_rate: parseInt(form.drop_rate.value) || null,
                reset_info: form.reset_info.value,
                antihack_info: form.antihack_info.value,
                website_url: form.website_url.value,
                discord_url: form.discord_url.value,
                opening_date: form.opening_date.value || null,
                events: Array.from(form.querySelectorAll('input[name="events"]:checked')).map(cb => cb.value),
                user_id: session.user.id,
                status: 'pendiente',
                created_at: new Date().toISOString()
            };

            feedbackEl.textContent = 'Subiendo imágenes...';
            const logoFile = document.getElementById('logo-file').files[0];
            const bannerFile = document.getElementById('banner-file').files[0];
            const galleryFiles = document.getElementById('gallery-files').files;

            // ¡CORRECCIÓN! Las claves deben coincidir con la BD: image_url, banner_url
            if (logoFile) {
                serverData.image_url = await uploadFile(logoFile, 'server-images');
            }
            if (bannerFile) {
                serverData.banner_url = await uploadFile(bannerFile, 'server-banners');
            }
            
            // ¡CORRECCIÓN! Añadir la subida y guardado de la galería
            if (galleryFiles.length > 0) {
                if (galleryFiles.length > 6) {
                    throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");
                }
                
                feedbackEl.textContent = `Subiendo ${galleryFiles.length} imágenes a la galería...`;
                
                const uploadPromises = Array.from(galleryFiles).map(file => uploadFile(file, 'server-gallery'));
                // ¡CORRECCIÓN! La clave debe ser gallery_urls
                serverData.gallery_urls = await Promise.all(uploadPromises);
            }
            
            feedbackEl.textContent = 'Guardando datos del servidor...';
            
            const { data: insertData, error: insertError } = await window.supabaseClient
                .from('servers')
                .insert([serverData])
                .select();

            if (insertError) {
                console.error("Error al insertar en Supabase:", insertError);
                throw new Error(`Error en la base de datos: ${insertError.message}`);
            }

            feedbackEl.textContent = '¡Éxito! Tu servidor ha sido enviado para revisión. Redirigiendo...';
            feedbackEl.className = 'feedback-message success';
            form.reset();

            setTimeout(() => { window.location.href = 'profile.html'; }, 2500);

        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            feedbackEl.textContent = `Error: ${error.message}`;
            feedbackEl.className = 'feedback-message error';
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Servidor';
        }
    });
}