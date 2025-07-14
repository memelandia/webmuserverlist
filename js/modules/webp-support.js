// js/modules/webp-support.js
// Sistema de soporte WebP con fallback automático

// =====================================================
// DETECCIÓN DE SOPORTE WEBP
// =====================================================

let webpSupported = null;
let webpSupportPromise = null;

// Detectar soporte WebP del navegador
function detectWebPSupport() {
    if (webpSupportPromise) return webpSupportPromise;
    
    webpSupportPromise = new Promise((resolve) => {
        const webP = new Image();
        webP.onload = webP.onerror = function () {
            resolve(webP.height === 2);
        };
        // Imagen WebP de 1x1 pixel transparente
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
    
    return webpSupportPromise;
}

// Función síncrona para verificar soporte (después de la detección inicial)
export function isWebPSupported() {
    return webpSupported === true;
}

// Inicializar detección de WebP
export async function initWebPSupport() {
    try {
        webpSupported = await detectWebPSupport();
        console.log(`🖼️ Soporte WebP: ${webpSupported ? '✅ Soportado' : '❌ No soportado'}`);
        
        // Añadir clase al body para CSS condicional
        if (webpSupported) {
            document.body.classList.add('webp-supported');
        } else {
            document.body.classList.add('webp-not-supported');
        }
        
        return webpSupported;
    } catch (error) {
        console.error('Error detectando soporte WebP:', error);
        webpSupported = false;
        document.body.classList.add('webp-not-supported');
        return false;
    }
}

// =====================================================
// CONVERSIÓN DE URLs DE IMÁGENES
// =====================================================

// Convertir URL de imagen a WebP si es soportado
export function getWebPUrl(originalUrl, fallbackUrl = null) {
    if (!originalUrl) return fallbackUrl || '';
    
    // Si ya es WebP, devolver tal como está
    if (originalUrl.includes('.webp')) return originalUrl;
    
    // Si no hay soporte WebP, devolver original
    if (webpSupported === false) return originalUrl;
    
    // Si aún no sabemos el soporte, devolver original (se actualizará después)
    if (webpSupported === null) return originalUrl;
    
    // Convertir extensión a WebP
    const webpUrl = originalUrl.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, '.webp$2');
    return webpUrl;
}

// Generar elemento <picture> con soporte WebP y fallback
export function createPictureElement(webpSrc, fallbackSrc, alt = '', attributes = {}) {
    const {
        className = '',
        width,
        height,
        loading = 'lazy',
        sizes = '',
        srcset = ''
    } = attributes;
    
    const widthAttr = width ? `width="${width}"` : '';
    const heightAttr = height ? `height="${height}"` : '';
    const sizesAttr = sizes ? `sizes="${sizes}"` : '';
    const srcsetAttr = srcset ? `srcset="${srcset}"` : '';
    
    return `
        <picture>
            <source srcset="${webpSrc}" type="image/webp" ${sizesAttr}>
            <img src="${fallbackSrc}" 
                 alt="${alt}" 
                 class="${className}"
                 ${widthAttr}
                 ${heightAttr}
                 loading="${loading}"
                 ${srcsetAttr}>
        </picture>
    `;
}

// =====================================================
// OPTIMIZACIÓN DE IMÁGENES SUPABASE
// =====================================================

// Función mejorada para obtener URLs optimizadas con WebP
export function getOptimizedImageUrl(bucketName, imagePath, options = {}, fallbackUrl = '') {
    if (!window.supabaseClient || !imagePath) return fallbackUrl;
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    
    const {
        width,
        height,
        quality = 80,
        format = 'auto', // 'auto' detectará automáticamente el mejor formato
        resize = 'cover'
    } = options;
    
    try {
        // Configurar transformaciones
        const transform = {
            resize,
            quality
        };
        
        if (width) transform.width = width;
        if (height) transform.height = height;
        
        // Si WebP es soportado y no se especifica formato, usar WebP
        if (webpSupported && format === 'auto') {
            transform.format = 'webp';
        } else if (format !== 'auto') {
            transform.format = format;
        }
        
        const { data } = window.supabaseClient.storage
            .from(bucketName)
            .getPublicUrl(imagePath, { transform });
        
        return data.publicUrl || fallbackUrl;
    } catch (error) {
        console.error('Error obteniendo URL optimizada:', error);
        return fallbackUrl;
    }
}

// =====================================================
// LAZY LOADING CON WEBP
// =====================================================

// Crear imagen lazy con soporte WebP
export function createLazyWebPImage(src, alt = '', options = {}) {
    const {
        className = '',
        width,
        height,
        fallback = 'img/logo_placeholder_small.png',
        sizes = '',
        quality = 80
    } = options;
    
    // Generar URLs WebP y fallback
    const webpSrc = getWebPUrl(src);
    const fallbackSrc = src;
    
    // Si WebP es soportado, usar WebP directamente
    if (webpSupported) {
        return `<img data-src="${webpSrc}" 
                     data-fallback="${fallback}" 
                     alt="${alt}" 
                     class="${className} lazy-placeholder" 
                     ${width ? `width="${width}"` : ''} 
                     ${height ? `height="${height}"` : ''} 
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width || 100}' height='${height || 100}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3C/svg%3E">`;
    }
    
    // Si no hay soporte WebP o aún no se ha detectado, usar picture element
    return `<picture>
                <source data-srcset="${webpSrc}" type="image/webp" ${sizes ? `sizes="${sizes}"` : ''}>
                <img data-src="${fallbackSrc}" 
                     data-fallback="${fallback}" 
                     alt="${alt}" 
                     class="${className} lazy-placeholder" 
                     ${width ? `width="${width}"` : ''} 
                     ${height ? `height="${height}"` : ''} 
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width || 100}' height='${height || 100}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3C/svg%3E">
            </picture>`;
}

// =====================================================
// CONVERSIÓN AUTOMÁTICA DE IMÁGENES EXISTENTES
// =====================================================

// Convertir imágenes existentes a WebP si es posible
export function upgradeImagesToWebP(container = document) {
    if (!webpSupported) return;
    
    const images = container.querySelectorAll('img[src]');
    let upgradedCount = 0;
    
    images.forEach(img => {
        const originalSrc = img.src;
        const webpSrc = getWebPUrl(originalSrc);
        
        if (webpSrc !== originalSrc) {
            // Crear nueva imagen para verificar que WebP existe
            const testImg = new Image();
            testImg.onload = () => {
                img.src = webpSrc;
                upgradedCount++;
                console.log(`🔄 Imagen actualizada a WebP: ${originalSrc} → ${webpSrc}`);
            };
            testImg.onerror = () => {
                // Si WebP no existe, mantener original
                console.log(`⚠️ WebP no disponible para: ${originalSrc}`);
            };
            testImg.src = webpSrc;
        }
    });
    
    if (upgradedCount > 0) {
        console.log(`✅ ${upgradedCount} imágenes actualizadas a WebP`);
    }
}

// =====================================================
// ESTADÍSTICAS Y MONITOREO
// =====================================================

let webpStats = {
    totalImages: 0,
    webpImages: 0,
    fallbackImages: 0,
    bytesWebP: 0,
    bytesFallback: 0
};

// Registrar estadística de imagen
export function trackImageLoad(src, isWebP, bytes = 0) {
    webpStats.totalImages++;
    if (isWebP) {
        webpStats.webpImages++;
        webpStats.bytesWebP += bytes;
    } else {
        webpStats.fallbackImages++;
        webpStats.bytesFallback += bytes;
    }
}

// Obtener estadísticas de WebP
export function getWebPStats() {
    const webpPercentage = webpStats.totalImages > 0 ? 
        (webpStats.webpImages / webpStats.totalImages * 100).toFixed(1) : 0;
    
    return {
        ...webpStats,
        webpPercentage,
        estimatedSavings: webpStats.bytesFallback > 0 ? 
            ((webpStats.bytesFallback - webpStats.bytesWebP) / webpStats.bytesFallback * 100).toFixed(1) : 0
    };
}

// =====================================================
// INICIALIZACIÓN AUTOMÁTICA
// =====================================================

// Auto-inicializar cuando se carga el módulo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebPSupport);
} else {
    initWebPSupport();
}

// Exportar funciones principales
export {
    detectWebPSupport,
    initWebPSupport,
    getWebPUrl,
    createPictureElement,
    createLazyWebPImage,
    upgradeImagesToWebP,
    getWebPStats,
    trackImageLoad
};

console.log('🎨 Módulo de soporte WebP cargado');
