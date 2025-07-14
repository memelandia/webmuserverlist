// /js/modules/utils.js

import { getOptimizedImageUrl as getWebPOptimizedUrl, isWebPSupported } from './webp-support.js';

export function getOptimizedImageUrl(bucketName, imagePath, options = {}, fallbackUrl = 'img/logo_placeholder_small.png') {
    // Usar la función optimizada con soporte WebP
    return getWebPOptimizedUrl(bucketName, imagePath, options, fallbackUrl);
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