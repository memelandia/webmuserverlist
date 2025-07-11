// js/add-server.js

import * as api from './modules/api.js';

// Función de upload simplificada que no verifica sesión
async function uploadFileDirectly(file, bucket) {
    if (!file) return null;

    console.log(`🔄 INICIO uploadFileDirectly: ${file.name} (${file.size} bytes) → ${bucket}`);
    console.log(`🌐 URL actual: ${window.location.href}`);
    console.log(`🔑 Supabase client disponible: ${!!window.supabaseClient}`);

    // Validaciones básicas
    if (file.size > 2 * 1024 * 1024) {
        throw new Error(`El archivo ${file.name} excede el límite de 2MB.`);
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Tipo de archivo no permitido: ${file.type}. Solo se permiten imágenes.`);
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${timestamp}-${randomSuffix}.${fileExtension}`;

    console.log(`📝 Nombre generado: ${fileName}`);

    try {
        console.log(`⬆️ Iniciando subida a Supabase Storage...`);

        // Crear timeout para detectar cuelgues
        const uploadPromise = window.supabaseClient.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => {
                console.error(`⏰ TIMEOUT: Subida de ${file.name} tardó más de 15 segundos`);
                reject(new Error(`Timeout: La subida de ${file.name} tardó más de 15 segundos`));
            }, 15000);
        });

        console.log(`⏳ Esperando resultado de subida...`);
        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);

        console.log(`📊 Resultado de subida:`, { data, error });

        if (error) {
            console.error(`❌ Error de Supabase:`, error);

            // Detectar errores específicos
            if (error.message?.includes('CORS')) {
                throw new Error(`Error CORS: Tu dominio web no está configurado en Supabase. Contacta al administrador.`);
            } else if (error.message?.includes('policy') || error.message?.includes('RLS')) {
                throw new Error(`Error de permisos: ${error.message}`);
            } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                throw new Error(`Error de red: Verifica tu conexión a internet.`);
            } else {
                throw new Error(`Error al subir ${file.name}: ${error.message}`);
            }
        }

        if (!data?.path) {
            console.error(`❌ No se obtuvo path en la respuesta:`, data);
            throw new Error(`No se obtuvo path para ${file.name}`);
        }

        console.log(`✅ ${file.name} subido exitosamente: ${data.path}`);
        return data.path;

    } catch (error) {
        console.error(`💥 Error en uploadFileDirectly:`, error);
        throw error;
    }
}

export async function initAddServerPage() {
    console.log("🚀 Inicializando Página de Agregar Servidor (add-server.js)...");

    const authRequiredMessage = document.getElementById('auth-required-message');
    const form = document.getElementById('add-server-form');
    const loginLink = document.getElementById('login-link');

    console.log("Elementos encontrados:", {
        authRequiredMessage: !!authRequiredMessage,
        form: !!form,
        loginLink: !!loginLink
    });

    if (!form || !authRequiredMessage) {
        console.error("❌ Elementos críticos no encontrados en el DOM");
        return;
    }

    console.log("Verificando sesión de usuario...");
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    console.log("Sesión obtenida:", session ? `Usuario: ${session.user.email}` : "No hay sesión");

    if (!session) {
        console.log("❌ Usuario no autenticado, mostrando mensaje de login");
        authRequiredMessage.classList.remove('hidden');
        form.classList.add('hidden');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                console.log("Click en login link");
                // Usamos un evento personalizado para desacoplar el modal de esta página
                document.dispatchEvent(new CustomEvent('show-auth-modal', { detail: { mode: 'login' } }));
            });
        }
        return;
    }

    console.log("✅ Usuario autenticado, mostrando formulario");
    authRequiredMessage.classList.add('hidden');
    form.classList.remove('hidden');

    console.log("Agregando event listener al formulario...");
    form.addEventListener('submit', handleFormSubmit);
    console.log("✅ Página de agregar servidor inicializada completamente");
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const feedbackEl = form.querySelector('#form-feedback');

    // Función helper para restaurar el estado del botón
    const resetButton = () => {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Servidor';
    };

    // Función helper para mostrar error
    const showError = (message) => {
        console.error('Error al enviar el formulario:', message);
        feedbackEl.textContent = `Error: ${message}`;
        feedbackEl.className = 'feedback-message error active';
        resetButton();
    };

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando...';
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback-message';

    console.log('=== INICIANDO PROCESO DE ADD-SERVER ===');

    try {
        // Validación inicial del formulario
        if (!form.elements.name.value.trim()) {
            throw new Error("El nombre del servidor es obligatorio.");
        }
        if (!form.elements.website_url.value.trim()) {
            throw new Error("La URL del sitio web es obligatoria.");
        }

        // Construir objeto de datos del servidor (sin antihack_info que no existe en la BD)
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

        console.log("Datos del servidor preparados:", serverData);

        // Obtener archivos seleccionados
        const logoFile = document.getElementById('logo-file').files[0];
        const bannerFile = document.getElementById('banner-file').files[0];
        const galleryFiles = document.getElementById('gallery-files').files;

        console.log("Archivos seleccionados:", {
            logo: logoFile?.name,
            banner: bannerFile?.name,
            gallery: galleryFiles.length
        });

        if (logoFile) console.log(`Logo: ${logoFile.name} (${logoFile.size} bytes, ${logoFile.type})`);
        if (bannerFile) console.log(`Banner: ${bannerFile.name} (${bannerFile.size} bytes, ${bannerFile.type})`);
        if (galleryFiles.length > 0) {
            for (let i = 0; i < galleryFiles.length; i++) {
                console.log(`Galería ${i + 1}: ${galleryFiles[i].name} (${galleryFiles[i].size} bytes)`);
            }
        }

        // Subir logo si se seleccionó
        if (logoFile) {
            try {
                feedbackEl.textContent = 'Subiendo logo...';
                feedbackEl.className = 'feedback-message info active';
                console.log("=== INICIANDO SUBIDA DE LOGO ===");
                console.log(`Archivo: ${logoFile.name}, Tamaño: ${logoFile.size}, Tipo: ${logoFile.type}`);

                const startTime = Date.now();
                console.log(`Timestamp inicio subida logo: ${startTime}`);

                serverData.image_url = await uploadFileDirectly(logoFile, 'server-images');

                const endTime = Date.now();
                console.log(`Timestamp fin subida logo: ${endTime} (duración: ${endTime - startTime}ms)`);
                console.log("Logo subido exitosamente:", serverData.image_url);
                console.log("=== SUBIDA DE LOGO COMPLETADA ===");
            } catch (logoError) {
                console.log("=== ERROR EN SUBIDA DE LOGO ===");
                console.error("Error completo:", logoError);
                throw new Error(`Error al subir el logo: ${logoError.message}`);
            }
        }

        // Subir banner si se seleccionó
        if (bannerFile) {
            try {
                feedbackEl.textContent = 'Subiendo banner...';
                feedbackEl.className = 'feedback-message info active';
                console.log("Iniciando subida de banner...");

                console.log("Iniciando subida de banner...");
                serverData.banner_url = await uploadFileDirectly(bannerFile, 'server-banners');
                console.log("Banner subido exitosamente:", serverData.banner_url);
            } catch (bannerError) {
                throw new Error(`Error al subir el banner: ${bannerError.message}`);
            }
        }

        // Subir galería si se seleccionaron imágenes
        if (galleryFiles.length > 0) {
            if (galleryFiles.length > 6) {
                throw new Error("Puedes subir un máximo de 6 imágenes a la galería.");
            }

            try {
                feedbackEl.textContent = `Subiendo ${galleryFiles.length} imágenes a la galería...`;
                feedbackEl.className = 'feedback-message info active';
                console.log("Iniciando subida de galería...");

                // Subir archivos de galería uno por uno para mejor control de errores
                const galleryPaths = [];
                for (let i = 0; i < galleryFiles.length; i++) {
                    const file = galleryFiles[i];
                    feedbackEl.textContent = `Subiendo imagen ${i + 1} de ${galleryFiles.length}...`;

                    console.log(`Iniciando subida de galería ${i + 1}...`);
                    const path = await uploadFileDirectly(file, 'server-gallery');
                    if (path) {
                        galleryPaths.push(path);
                    }
                }

                if (galleryPaths.length > 0) {
                    serverData.gallery_urls = galleryPaths;
                    console.log("Galería subida exitosamente:", galleryPaths);
                }
            } catch (galleryError) {
                throw new Error(`Error al subir la galería: ${galleryError.message}`);
            }
        }

        // Guardar datos del servidor en la base de datos
        feedbackEl.textContent = 'Guardando datos del servidor...';
        feedbackEl.className = 'feedback-message info active';
        console.log("Guardando servidor en la base de datos...");

        await api.addServer(serverData);
        console.log("Servidor guardado exitosamente");

        // Mostrar éxito y redirigir
        feedbackEl.textContent = '¡Éxito! Tu servidor ha sido enviado para revisión. Redirigiendo...';
        feedbackEl.className = 'feedback-message success active';
        form.reset();

        setTimeout(() => {
            window.location.href = 'profile.html';
        }, 2500);

    } catch (error) {
        showError(error.message || "Ocurrió un error inesperado.");
    }
}