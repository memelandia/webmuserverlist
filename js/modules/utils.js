// /js/modules/utils.js

/**
 * Genera una URL pública de Supabase Storage con transformaciones de imagen.
 * @param {string} bucketName - El nombre del bucket (ej. 'server-images').
 * @param {string} imagePath - La ruta/nombre del archivo de imagen.
 * @param {object} options - Opciones de transformación (ej. { width: 100, height: 100 }).
 * @param {string} fallbackUrl - Una URL de respaldo si imagePath es nulo.
 * @returns {string} - La URL transformada o la de respaldo.
 */
export function getOptimizedImageUrl(bucketName, imagePath, options, fallbackUrl) {
    // Si no tenemos el cliente de Supabase listo, devolvemos el fallback
    if (!window.supabaseClient) {
        return fallbackUrl;
    }

    if (!imagePath) {
        return fallbackUrl;
    }
    
    // Si la URL ya es una URL completa (por retrocompatibilidad o datos antiguos), la devolvemos.
    if (imagePath.startsWith('http')) {
        return imagePath;
    }
    
    const { data } = window.supabaseClient.storage
        .from(bucketName)
        .getPublicUrl(imagePath, {
            transform: {
                ...options,
                resize: options.resize || 'cover' // 'cover' es un buen default
            },
        });

    return data.publicUrl;
}

/**
 * Renderiza estrellas de calificación a partir de un número.
 * @param {number} rating - El número de calificación (0-5).
 * @returns {string} - El HTML de las estrellas.
 */
export function renderStars(rating) {
    // Si el rating es 0, null o undefined, mostrar 5 estrellas vacías
    if (!rating || rating <= 0) {
        return '<span style="color:var(--text-secondary); letter-spacing:1px;">☆☆☆☆☆</span>';
    }
    
    // Para ratings válidos, calcular estrellas llenas y vacías
    const full = '★'.repeat(Math.floor(rating));
    const empty = '☆'.repeat(5 - Math.floor(rating));
    return `<span style="color:var(--primary-color); letter-spacing:1px;">${full}${empty}</span>`;
}
