// /js/modules/utils.js

export function getOptimizedImageUrl(bucketName, imagePath, options = {}, fallbackUrl = 'img/logo_placeholder_small.png') {
    if (!window.supabaseClient) return fallbackUrl;
    if (!imagePath) return fallbackUrl;
    if (imagePath.startsWith('http')) return imagePath;

    const { data } = window.supabaseClient.storage
        .from(bucketName)
        .getPublicUrl(imagePath, {
            transform: {
                ...options,
                resize: options.resize || 'cover'
            },
        });

    return data.publicUrl || fallbackUrl;
}

export function renderStars(rating) {
    const numRating = Number(rating);
    if (!numRating || numRating <= 0) {
        return '<span class="stars-empty" aria-label="Sin calificación">☆☆☆☆☆</span>';
    }
    const full = '★'.repeat(Math.floor(numRating));
    const empty = '☆'.repeat(5 - Math.floor(numRating));
    return `<span class="stars-full" aria-label="Calificación: ${numRating} de 5 estrellas">${full}</span><span class="stars-empty">${empty}</span>`;
}

// Funciones adicionales que podrían estar siendo usadas
export function formatDate(date) {
    if (!date) return "Fecha no disponible";
    try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? "Fecha inválida" : d.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    } catch {
        return "Error en fecha";
    }
}

export function formatDateTime(date) {
    if (!date) return "Fecha no disponible";
    try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? "Fecha inválida" : d.toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return "Error en fecha";
    }
}

export function truncateText(text, maxLength = 100) {
    if (!text || typeof text !== 'string') return '';
    return text.length <= maxLength ? text : text.substring(0, maxLength).trim() + '...';
}

export function sanitizeHTML(str) {
    if (!str || typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

console.log('🛠️ Módulo de utilidades cargado');