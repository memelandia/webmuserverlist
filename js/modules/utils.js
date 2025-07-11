// /js/modules/utils.js

export function getOptimizedImageUrl(bucketName, imagePath, options, fallbackUrl) {
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