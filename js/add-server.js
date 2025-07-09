// js/add-server.js (v11 - A prueba de fallos)

document.addEventListener('DOMContentLoaded', () => {
    initAddServer();
});

async function uploadFile(file, bucket) {
    if (!file) return null;
    
    try {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        if (file.size > 50 * 1024 * 1024) {
            throw new Error(`El archivo ${file.name} excede el límite de 50MB.`);
        }
        
        const { data, error } = await window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
            
        if (error) {
            throw new Error(`No se pudo subir ${file.name}: ${error.message}`);
        }
        return data.path;
        
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
            // 1. Recopilar datos del formulario
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
                status: 'pendiente'
            };

            // 2. Subir imágenes y obtener paths
            feedbackEl.textContent = 'Subiendo imágenes...';
            const logoFile = document.getElementById('logo-file').files[0];
            const bannerFile = document.getElementById('banner-file').files[0];
            const galleryFiles = document.getElementById('gallery-files').files;

            const logoPath = await uploadFile(logoFile, 'server-images');
            const bannerPath = await uploadFile(bannerFile, 'server-banners');
            
            let galleryPaths = [];
            if (galleryFiles.length > 0) {
                if (galleryFiles.length > 6) throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");
                feedbackEl.textContent = `Subiendo ${galleryFiles.length} imágenes a la galería...`;
                const uploadPromises = Array.from(galleryFiles).map(file => uploadFile(file, 'server-gallery'));
                galleryPaths = await Promise.all(uploadPromises);
            }

            // 3. Añadir paths al objeto de datos
            if (logoPath) serverData.image_url = logoPath;
            if (bannerPath) serverData.banner_url = bannerPath;
            if (galleryPaths.length > 0) serverData.gallery_urls = galleryPaths;
            
            // 4. Insertar en la base de datos
            feedbackEl.textContent = 'Guardando datos del servidor...';
            const { error: insertError } = await window.supabaseClient
                .from('servers')
                .insert([serverData]);

            if (insertError) {
                console.error("Error al insertar en Supabase:", insertError);
                throw new Error(`Error en la base de datos: ${insertError.message}. Revisa los permisos (RLS).`);
            }

            // 5. Éxito
            feedbackEl.textContent = '¡Éxito! Tu servidor ha sido enviado para revisión. Redirigiendo...';
            feedbackEl.className = 'feedback-message success';
            form.reset();
            setTimeout(() => { window.location.href = 'profile.html'; }, 2500);

        } catch (error) {
            console.error('Error al enviar el formulario:', error);
            feedbackEl.textContent = `Error: ${error.message}`;
            feedbackEl.className = 'feedback-message error';
        } finally {
            // Se ejecuta siempre, haya error o no.
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Servidor';
        }
    });
}